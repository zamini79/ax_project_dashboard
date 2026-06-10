import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import {
  fetchProjectList,
  fetchHeadquarters,
} from "@/lib/repositories/projects";
import { fetchMonthlyExecution } from "@/lib/repositories/budget";
import { fetchProjectEffects } from "@/lib/repositories/effects";
import { computeKpis } from "@/lib/domain/dashboard";
import { performanceSummary, effectsSummary } from "@/lib/domain/analytics";
import { formatBudgetEok } from "@/lib/domain/format";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import {
  HEALTH_COLOR_VAR,
  HEALTH_LABEL,
  HEALTH_HELP,
  LIFECYCLE_LABEL,
} from "@/lib/domain/lifecycle";
import { Donut, MiniBars, Bar, HealthDot } from "@/components/charts/charts";
import {
  ProjectExplorer,
  type ExplorerSearchParams,
} from "@/components/dashboard/project-explorer";

export const dynamic = "force-dynamic";

const NAVY = "var(--navy)";
const ACCENT = "var(--primary)";
const LINE = "var(--border)";
const SUB = "var(--muted-foreground)";
const FAINT = "var(--faint)";
// 단계 도넛 색: 진행전/검토중/진행중/완료
const DONUT_COLORS = ["#C7CBD3", "#E0A106", "#534AB7", "#16A34A"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<ExplorerSearchParams>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const [projects, headquarters, monthly, effects] = await Promise.all([
    fetchProjectList(),
    fetchHeadquarters(),
    fetchMonthlyExecution(),
    fetchProjectEffects(),
  ]);

  const kpis = computeKpis(projects, headquarters, now);
  const perf = performanceSummary(projects);
  const eff = effectsSummary(effects);
  const asOf = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  const inProgress =
    kpis.lifecycle.find((l) => l.key === "in_progress")?.count ?? 0;
  const budgetRate =
    kpis.budgetTotal.budget > 0
      ? Math.round((kpis.budgetTotal.executed / kpis.budgetTotal.budget) * 100)
      : 0;
  const budgetTotal = kpis.budgetByMprs.reduce((a, b) => a + b.budget, 0);
  const monthlyBars = monthly.map((m) => ({
    label: m.year_month.slice(2).replace("-", "."),
    value: m.amount / 100_000_000,
  }));
  const atRisk = perf.atRisk.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-[1800px] flex-1 px-6 py-5">
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "210px 188px 196px",
          gridTemplateAreas:
            '"hero hero donut week" "trend trend mprs mprs" "risk risk perf perf"',
        }}
      >
        {/* HERO */}
        <Tile area="hero" dark pad={24}>
          <Cap light>과제 진행 현황 · {asOf} 기준</Cap>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px 16px",
              margin: "2px 0 16px",
            }}
          >
            {[
              { l: "전체 과제", v: kpis.total, u: "건" },
              { l: "진행 중", v: inProgress, u: "건" },
              { l: "평균 진행률", v: perf.avgProgress, u: "%" },
              { l: "투자비 집행률", v: budgetRate, u: "%" },
            ].map((k) => (
              <div key={k.l}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginBottom: 6 }}>
                  {k.l}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {k.v}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.7)" }}>
                    {k.u}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 7 }}>
            진행 현황(헬스)
          </div>
          <div
            role="img"
            aria-label={`진행 현황 — ${kpis.health.map((h) => `${HEALTH_LABEL[h.key]} ${h.count}`).join(", ")}`}
            style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", marginBottom: 9 }}
          >
            {kpis.health.map((h) => (
              <div
                key={h.key}
                style={{
                  width: `${(h.count / Math.max(1, kpis.total)) * 100}%`,
                  background: HEALTH_COLOR_VAR[h.key],
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {kpis.health.map((h) => (
              <span
                key={h.key}
                title={HEALTH_HELP[h.key]}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(255,255,255,.8)" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 99, background: HEALTH_COLOR_VAR[h.key] }} />
                {HEALTH_LABEL[h.key]} <b style={{ color: "#fff" }}>{h.count}</b>
              </span>
            ))}
          </div>
        </Tile>

        {/* 단계 도넛 */}
        <Tile area="donut" style={{ display: "flex", flexDirection: "column" }}>
          <Cap>과제 단계</Cap>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flex: 1 }}>
            <Donut
              size={102}
              thickness={14}
              ariaLabel={`과제 단계 — ${kpis.lifecycle.map((l) => `${LIFECYCLE_LABEL[l.key]} ${l.count}`).join(", ")}`}
              segments={kpis.lifecycle.map((l, i) => ({
                value: l.count,
                color: DONUT_COLORS[i],
              }))}
            >
              <div style={{ fontSize: 23, fontWeight: 800 }}>{kpis.total}</div>
              <div style={{ fontSize: 9.5, color: SUB }}>전체</div>
            </Donut>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {kpis.lifecycle.map((l, i) => (
                <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: DONUT_COLORS[i] }} />
                  <span style={{ color: SUB }}>{LIFECYCLE_LABEL[l.key]}</span>
                  <b style={{ marginLeft: "auto", paddingLeft: 14, fontVariantNumeric: "tabular-nums" }}>{l.count}</b>
                </div>
              ))}
            </div>
          </div>
        </Tile>

        {/* 금주 업데이트 */}
        <Tile area="week" href="/projects" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Cap action={<ArrowRight size={15} style={{ color: FAINT }} />}>
            금주 업데이트
          </Cap>
          <div>
            <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: ACCENT }}>
              {kpis.thisWeekCount}
            </div>
            <div style={{ fontSize: 11.5, color: SUB, marginTop: 8 }}>
              이번 주 갱신된 과제
            </div>
          </div>
        </Tile>

        {/* 위험·주의 피드 */}
        <Tile area="risk">
          <Cap action={<More href="/projects" />}>
            위험·주의 과제 · {perf.atRisk.length}건
          </Cap>
          {atRisk.map((p, i) => (
            <Link
              key={p.id}
              href={`/?detail=${p.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 6px",
                margin: "0 -6px",
                borderRadius: 8,
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <HealthDot color={cssHealth(p.health)} size={9} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.name}
              </span>
              <span style={{ fontSize: 11, color: SUB, whiteSpace: "nowrap" }}>
                {p.headquarter_name}
              </span>
              <div style={{ width: 44 }}>
                <Bar value={p.progress_pct} color={cssHealth(p.health)} height={5} />
              </div>
              <span style={{ fontSize: 11.5, color: SUB, width: 28, textAlign: "right" }}>
                {p.progress_pct}%
              </span>
            </Link>
          ))}
        </Tile>

        {/* MPRS 투자 배분 */}
        <Tile area="mprs" href="/budget">
          <Cap action={<ArrowRight size={15} style={{ color: FAINT }} />}>
            MPRS 투자 배분 · 총 {formatBudgetEok(budgetTotal)}
          </Cap>
          <div
            role="img"
            aria-label={`MPRS 투자 배분 · 총 ${formatBudgetEok(budgetTotal)}`}
            style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 12 }}
          >
            {kpis.budgetByMprs.map((b) => (
              <div
                key={b.key}
                style={{
                  width: `${budgetTotal > 0 ? (b.budget / budgetTotal) * 100 : 0}%`,
                  background: MPRS_COLORS[b.key].main,
                }}
              />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px" }}>
            {kpis.budgetByMprs.map((b) => (
              <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: MPRS_COLORS[b.key].main }} />
                <span style={{ color: SUB }}>{MPRS_LABEL[b.key]}</span>
                <b style={{ marginLeft: "auto" }}>{formatBudgetEok(b.budget)}</b>
              </div>
            ))}
          </div>
        </Tile>

        {/* 월별 추이 — 누적 집행(좌) · 막대(우) */}
        <Tile area="trend" style={{ display: "flex", flexDirection: "column" }}>
          <Cap>월별 집행 추이 · 단위 억</Cap>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>
                {formatBudgetEok(kpis.budgetTotal.executed)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: SUB, marginTop: 7 }}>
                누적 집행
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <MiniBars
                data={monthlyBars}
                height={80}
                barW={28}
                gap={12}
                accentLast={ACCENT}
                showValues
                ariaLabel={`월별 집행 추이 · 누적 ${formatBudgetEok(kpis.budgetTotal.executed)}`}
              />
            </div>
          </div>
        </Tile>

        {/* 성과 하이라이트 (mock — 013 도입 후 실데이터) */}
        <Tile
          area="perf"
          href="/performance"
          style={{ background: "linear-gradient(135deg,#16A34A 0%,#0E7A4E 100%)", border: "none", color: "#fff" }}
        >
          <Cap light action={<ArrowRight size={15} style={{ color: "rgba(255,255,255,.8)" }} />}>
            운영 성과 하이라이트
          </Cap>
          <div style={{ display: "flex", gap: 26, alignItems: "flex-end" }}>
            {[
              { v: formatBudgetEok(eff.totalSaveCostWon), l: "연간 절감비용" },
              { v: eff.totalSaveHours.toLocaleString(), l: "월 업무시간 절감(시간)" },
              { v: eff.appliedCount, l: "운영 적용 과제" },
            ].map((k) => (
              <div key={k.l}>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", marginTop: 6 }}>{k.l}</div>
              </div>
            ))}
          </div>
        </Tile>
      </div>

      {/* 과제 목록 (과제 현황 탭과 동일 — KPI 드릴다운·필터·표/맵·드로어 포함) */}
      <div style={{ marginTop: 22 }}>
        <ProjectExplorer
          sp={sp}
          base="/"
          heading="과제 목록"
          showKpis={false}
          showSummary={false}
        />
      </div>
    </main>
  );
}

/** HEALTH_COLOR_VAR는 "var(--health-..)" → 차트 컴포넌트 color prop에 그대로 사용 가능 */
function cssHealth(h: "green" | "yellow" | "red"): string {
  return HEALTH_COLOR_VAR[h];
}

function Tile({
  area,
  dark = false,
  pad = 18,
  href,
  style,
  children,
}: {
  area: string;
  dark?: boolean;
  pad?: number;
  href?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const base: React.CSSProperties = {
    gridArea: area,
    background: dark ? NAVY : "#fff",
    border: dark ? "none" : `1px solid ${LINE}`,
    borderRadius: 18,
    padding: pad,
    color: dark ? "#fff" : "inherit",
    overflow: "hidden",
    boxShadow: dark
      ? "0 8px 28px rgba(15,24,48,.22)"
      : "0 1px 2px rgba(16,24,40,.05)",
    ...style,
  };
  if (href) {
    return (
      <Link href={href} style={base} className="bento-tile">
        {children}
      </Link>
    );
  }
  return (
    <div style={base} className="bento-tile">
      {children}
    </div>
  );
}

function Cap({
  light = false,
  action,
  children,
}: {
  light?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: light ? "rgba(255,255,255,.6)" : SUB }}>
        {children}
      </span>
      {action}
    </div>
  );
}

function More({ href }: { href: string }) {
  return (
    <Link
      href={href}
      style={{ fontSize: 11, fontWeight: 600, color: ACCENT, display: "inline-flex", alignItems: "center", gap: 2 }}
    >
      전체 보기 <ChevronRight size={12} />
    </Link>
  );
}
