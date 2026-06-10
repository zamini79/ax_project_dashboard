"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import type { ProjectListItem } from "@/lib/repositories/projects";
import {
  MPRS_COLORS,
  MPRS_LABEL,
  MPRS_ORDER,
  type Mprs,
} from "@/lib/domain/mprs";
import {
  type Health,
  HEALTH_LABEL,
  HEALTH_COLOR_VAR,
  HEALTH_KPI_ORDER,
} from "@/lib/domain/lifecycle";
import { formatBudgetEok } from "@/lib/domain/format";
import { dashboardHref, type DashboardState } from "./url";

const NAVY = "var(--navy)";
const padL = 50,
  padR = 24,
  padT = 16,
  padB = 36,
  plotH = 400;
const bMin = 1.5,
  bMax = 12;
const boxH = padT + plotH + padB;
const xticks = [0, 25, 50, 75, 100];
const yticks = [2, 4, 6, 8, 10, 12];

/** 포트폴리오 맵: X=진행률 / Y=투자비(억) / 테두리=헬스. MPRS 범례로 필터. */
export function PortfolioMap({
  items,
  state,
}: {
  items: ProjectListItem[];
  state: DashboardState;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const plotW = Math.max(300, containerW - padL - padR);
  const boxW = containerW;

  // 활성 MPRS는 URL 상태(state.mprs)에서 도출 — 빈 배열 = 전체 (D-019 공유·영속)
  const active: Set<Mprs> =
    state.mprs && state.mprs.length > 0
      ? new Set(state.mprs)
      : new Set(MPRS_ORDER);

  const cx = (prog: number) => padL + (prog / 100) * plotW;
  const cy = (eok: number) =>
    padT + (1 - (Math.min(bMax, Math.max(bMin, eok)) - bMin) / (bMax - bMin)) * plotH;
  const BUBBLE_D = 40; // 버블 지름 고정 (투입 인력 제거로 크기 인코딩 없음)
  const isOn = (k: Mprs) => active.has(k);

  function toggle(k: Mprs) {
    const n = new Set(active);
    if (n.size === MPRS_ORDER.length) {
      n.clear();
      n.add(k);
    } else if (n.has(k) && n.size === 1) {
      n.clear();
      MPRS_ORDER.forEach((m) => n.add(m));
    } else if (n.has(k)) {
      n.delete(k);
    } else {
      n.add(k);
    }
    const next = n.size ? [...n] : [...MPRS_ORDER];
    router.push(dashboardHref(state, { mprs: next }));
  }

  const healthCount = (h: Health) =>
    items.filter((p) => p.health === h).length;
  const hp = hover ? items.find((p) => p.id === hover) : null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Card className="min-w-0 flex-1 overflow-hidden p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">포트폴리오 맵</h2>
          <span className="text-faint text-[11px]">
            세로축 투자비(억) · 가로축 진행률(%) · 테두리 = 헬스
          </span>
        </div>

        <div ref={containerRef} style={{ width: "100%" }}>
        <div
          className="relative"
          style={{ width: boxW, height: boxH }}
          onMouseLeave={() => setHover(null)}
        >
          {/* 주목 영역(큰 투자·낮은 진행) */}
          <div
            style={{
              position: "absolute",
              left: padL,
              top: padT,
              width: plotW / 2,
              height: plotH / 2,
              background: "rgba(220,38,38,.05)",
              borderRadius: 6,
            }}
          />
          {/* Y 그리드 */}
          {yticks.map((v) => (
            <div key={`y${v}`}>
              <div style={{ position: "absolute", left: padL, top: cy(v), width: plotW, height: 1, background: "#F1F2F4" }} />
              <span style={{ position: "absolute", left: 0, top: cy(v) - 7, width: padL - 8, textAlign: "right", fontSize: 10, color: "#6E737D" }}>
                {v}
              </span>
            </div>
          ))}
          {/* X 그리드 */}
          {xticks.map((v) => (
            <div key={`x${v}`}>
              <div style={{ position: "absolute", left: cx(v), top: padT, width: 1, height: plotH, background: v === 50 ? "#E2E4E8" : "#F6F7F8" }} />
              <span style={{ position: "absolute", left: cx(v) - 12, top: padT + plotH + 8, width: 24, textAlign: "center", fontSize: 10, color: "#6E737D" }}>
                {v}
              </span>
            </div>
          ))}
          <span style={{ position: "absolute", left: padL + 8, top: padT + 6, fontSize: 10.5, fontWeight: 700, color: "rgba(220,38,38,.5)" }}>
            ● 주목 · 큰 투자 / 낮은 진행
          </span>

          {/* 버블 */}
          {items.map((p) => {
            const on = isOn(p.mprs);
            const d = BUBBLE_D;
            const isH = hover === p.id;
            const eok = (p.total_budget ?? 0) / 100_000_000;
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                aria-label={`${p.name} · 진행률 ${p.progress_pct}% · 투자비 ${formatBudgetEok(p.total_budget)} · 헬스 ${HEALTH_LABEL[p.health]}`}
                onMouseEnter={() => setHover(p.id)}
                onFocus={() => setHover(p.id)}
                onClick={() =>
                  router.push(dashboardHref(state, { detail: p.id }), {
                    scroll: false,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(dashboardHref(state, { detail: p.id }), {
                      scroll: false,
                    });
                  }
                }}
                className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F1830]"
                style={{
                  position: "absolute",
                  left: cx(p.progress_pct),
                  top: cy(eok),
                  width: d,
                  height: d,
                  transform: `translate(-50%,-50%) scale(${isH ? 1.12 : 1})`,
                  borderRadius: 99,
                  background: MPRS_COLORS[p.mprs].main,
                  border: `3px solid ${HEALTH_COLOR_VAR[p.health]}`,
                  opacity: on ? (hover && !isH ? 0.5 : 0.92) : 0.1,
                  cursor: "pointer",
                  boxShadow: isH ? `0 6px 18px ${MPRS_COLORS[p.mprs].main}66` : "none",
                  transition: "transform .15s, opacity .15s, box-shadow .15s",
                  zIndex: isH ? 5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {MPRS_COLORS[p.mprs] ? MPRS_LABEL[p.mprs][0] : ""}
              </div>
            );
          })}

          {/* 호버 툴팁 */}
          {hp && (
            <div
              style={{
                position: "absolute",
                left: Math.min(cx(hp.progress_pct) + BUBBLE_D / 2 + 8, boxW - 210),
                top: Math.max(padT, cy((hp.total_budget ?? 0) / 100_000_000) - 30),
                width: 200,
                background: NAVY,
                color: "#fff",
                borderRadius: 11,
                padding: "10px 12px",
                zIndex: 10,
                pointerEvents: "none",
                boxShadow: "0 10px 30px rgba(15,24,48,.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: MPRS_COLORS[hp.mprs].main, borderRadius: 4, padding: "1px 6px" }}>
                  {MPRS_LABEL[hp.mprs]}
                </span>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: HEALTH_COLOR_VAR[hp.health] }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>
                  {HEALTH_LABEL[hp.health]}
                </span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>
                {hp.name}
              </div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.7)" }}>
                진행률 {hp.progress_pct}% · 투자비 {formatBudgetEok(hp.total_budget)}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                클릭하면 상세 보기 →
              </div>
            </div>
          )}
        </div>
        </div>
      </Card>

      {/* 우측 범례/필터 */}
      <aside className="w-full shrink-0 lg:w-[300px]">
        <Card className="p-4">
          <p className="text-muted-foreground mb-2.5 text-xs font-semibold">
            MPRS 필터 <span className="text-faint">· 클릭해 좁히기</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MPRS_ORDER.map((k) => {
              const on = isOn(k);
              const cnt = items.filter((p) => p.mprs === k).length;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(k)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 9,
                    cursor: "pointer",
                    border: `1px solid ${on ? MPRS_COLORS[k].main : "#ECEEF1"}`,
                    background: on ? MPRS_COLORS[k].bg : "#fff",
                    opacity: on ? 1 : 0.55,
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: MPRS_COLORS[k].main }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: on ? MPRS_COLORS[k].text : "#6B7280" }}>
                    {MPRS_LABEL[k]}
                  </span>
                  <b style={{ marginLeft: "auto", fontSize: 12 }}>{cnt}</b>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-3.5 border-t pt-3">
            {HEALTH_KPI_ORDER.map((h) => (
              <span key={h} className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <span
                  className="box-border h-[11px] w-[11px] rounded-full"
                  style={{ border: `3px solid ${HEALTH_COLOR_VAR[h]}` }}
                />
                {HEALTH_LABEL[h]} {healthCount(h)}
              </span>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
