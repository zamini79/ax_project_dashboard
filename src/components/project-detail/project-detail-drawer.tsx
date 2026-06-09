"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Sparkles } from "lucide-react";

import { Bar } from "@/components/charts/charts";
import { EditProjectModal } from "@/components/project-form/edit-project-modal";
import { UpdateCompose } from "@/components/project-detail/update-compose";
import type { ProjectDetail } from "@/lib/repositories/projects";
import type { ProjectEffect } from "@/lib/repositories/effects";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import { INVESTMENT_LABEL } from "@/lib/domain/investment";
import {
  LIFECYCLE_LABEL,
  HEALTH_LABEL,
  HEALTH_COLOR_VAR,
} from "@/lib/domain/lifecycle";
import { SOURCE_LABEL, PAGE_ROLE_LABEL } from "@/lib/domain/updates";
import {
  formatBudgetEok,
  executionRate,
  formatYearMonth,
  formatDateKo,
} from "@/lib/domain/format";

const ACCENT = "var(--primary)";

/** 과제 상세 우측 슬라이드오버 (createPortal — fixed 오버레이 클리핑 회피, §8.4) */
export function ProjectDetailDrawer({
  detail: p,
  effect,
  closeHref,
  todayISO,
}: {
  detail: ProjectDetail;
  effect?: ProjectEffect | null;
  closeHref: string;
  todayISO: string;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // createPortal SSR 가드 — 마운트 후에만 포털 렌더
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    // 스크롤 잠금 시 세로 스크롤바가 사라지며 뒤 화면이 밀리는 현상 방지 —
    // 사라지는 스크롤바 폭만큼 body에 padding-right로 보정.
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setShown(false);
    window.setTimeout(() => router.push(closeHref), 260);
  }

  if (!mounted) return null;

  const mprs = MPRS_COLORS[p.mprs];
  const rate = executionRate(p.total_budget, p.executed_budget);
  const pmNames = p.pms.map((x) => x.name).join(", ") || "PM 미정";

  return createPortal(
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,24,48,.42)",
        zIndex: 100,
        opacity: shown ? 1 : 0,
        transition: "opacity .2s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 520,
          maxWidth: "92vw",
          background: "var(--background)",
          overflowY: "auto",
          transform: shown ? "translateX(0)" : "translateX(100%)",
          transition: "transform .28s cubic-bezier(.2,.7,.3,1)",
          boxShadow: "-12px 0 40px rgba(15,24,48,.2)",
        }}
      >
        {/* 헤더 */}
        <div className="bg-card sticky top-0 z-[2] border-b px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-6 items-center rounded px-1.5 text-xs font-bold"
                style={{ background: mprs.bg, color: mprs.text }}
              >
                {MPRS_LABEL[p.mprs]}
              </span>
              <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[11px] font-semibold">
                {LIFECYCLE_LABEL[p.lifecycle]}
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11.5px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: HEALTH_COLOR_VAR[p.health] }}
                />
                {HEALTH_LABEL[p.health]}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <EditProjectModal
                projectId={p.id}
                className="bg-card hover:bg-muted flex h-[30px] items-center rounded-lg border px-3 text-[12.5px] font-semibold transition-colors"
              />
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="text-muted-foreground hover:bg-muted flex h-[30px] w-[30px] items-center justify-center rounded-lg border"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <h2 className="text-lg font-extrabold leading-snug tracking-tight">
            {p.name}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-xs">
            {p.headquarter_name} · {pmNames}
          </p>
          <div className="mt-3.5 flex items-center gap-2.5">
            <Bar value={p.progress_pct} color={ACCENT} height={8} />
            <span className="text-sm font-extrabold tabular-nums">
              {p.progress_pct}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 p-5">
          {/* 메타 */}
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Field label="주관 본부">{p.headquarter_name}</Field>
              <Field label="투자 유형">
                {INVESTMENT_LABEL[p.investment_type]}
              </Field>
              <Field label="일정">
                {formatYearMonth(p.start_date)} ~ {formatYearMonth(p.end_date)}
              </Field>
              <Field label="투자비 / 집행">
                {formatBudgetEok(p.executed_budget)} /{" "}
                {formatBudgetEok(p.total_budget)}
                {rate != null && (
                  <span className="text-muted-foreground"> ({rate}%)</span>
                )}
              </Field>
              <Field label="AI 기술">
                {p.ai_techs.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.ai_techs.map((t) => (
                      <span
                        key={t}
                        className="text-accent-foreground bg-accent rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-faint">-</span>
                )}
              </Field>
              <Field label="유관부서 / 담당자">
                {p.stakeholders.length ? (
                  <div className="flex flex-col gap-0.5">
                    {p.stakeholders.map((s, i) => (
                      <span key={`${s.department}-${i}`}>
                        {s.department}
                        <span className="text-muted-foreground">
                          {" "}
                          · {s.person ?? "담당자 미정"}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">없음</span>
                )}
              </Field>
            </div>
          </Card>

          {/* 운영 효과 (있을 때) */}
          {effect && (
            <div
              className="rounded-2xl border p-4"
              style={{ background: "#F2FBF5", borderColor: "#CBEFD8" }}
            >
              <div className="mb-2.5 flex items-center gap-1.5">
                <Sparkles size={16} style={{ color: "#16A34A" }} />
                <span className="text-[13px] font-bold" style={{ color: "#0E7A4E" }}>
                  운영 효과{effect.isPilot ? " (파일럿)" : ""}
                </span>
                <span className="text-muted-foreground ml-auto text-[11px]">
                  {effect.appliedYm} 적용
                </span>
              </div>
              <div className="flex gap-2">
                {effect.metrics.map((m, i) => (
                  <div
                    key={i}
                    className="bg-card flex-1 rounded-[9px] border p-2.5"
                    style={{ borderColor: "#DCEFE3" }}
                  >
                    <div className="text-muted-foreground mb-1.5 text-[10px]">
                      {m.label}
                    </div>
                    <div className="text-[15px] font-extrabold tabular-nums">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 업데이트 타임라인 */}
          <Card>
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[13px] font-bold">업데이트 타임라인</span>
              <UpdateCompose projectId={p.id} defaultDate={todayISO} />
            </div>
            {p.updates.length === 0 ? (
              <div className="text-faint rounded-[10px] border border-dashed py-5 text-center text-[12.5px]">
                아직 업데이트가 없습니다.
              </div>
            ) : (
              <ol className="border-border relative ml-1 list-none border-l p-0">
                {p.updates.map((u, i) => (
                  <li
                    key={u.id}
                    className="relative pl-[18px]"
                    style={{
                      paddingBottom: i === p.updates.length - 1 ? 0 : 16,
                    }}
                  >
                    <span
                      className="bg-background absolute left-[-5px] top-[3px] h-[9px] w-[9px] rounded-full"
                      style={{
                        border: `2px solid ${u.source === "atlassian_sync" ? ACCENT : "#C7CBD3"}`,
                      }}
                    />
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                        style={
                          u.source === "atlassian_sync"
                            ? { background: "#E8EAFB", color: ACCENT }
                            : { background: "#EEF0F3", color: "#5B616B" }
                        }
                      >
                        {SOURCE_LABEL[u.source]}
                      </span>
                      {u.page_role && (
                        <span className="text-muted-foreground rounded border px-1.5 py-px text-[10px]">
                          {PAGE_ROLE_LABEL[u.page_role]}
                        </span>
                      )}
                      <span className="text-faint text-[11px]">
                        {formatDateKo(u.update_date)}
                      </span>
                      {u.source_url && (
                        <a
                          href={u.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground text-[11px] underline"
                        >
                          원본
                        </a>
                      )}
                    </div>
                    <div className="text-[12.5px] leading-relaxed text-[#373B42]">
                      {u.content}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border p-4 shadow-sm">{children}</div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-[11.5px]">{label}</span>
      <div className="text-[13.5px]">{children}</div>
    </div>
  );
}
