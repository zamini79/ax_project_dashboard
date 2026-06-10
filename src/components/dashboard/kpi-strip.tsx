import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Donut, Bar } from "@/components/charts/charts";
import { cn } from "@/lib/utils";
import type { DashboardKpis, DashboardFilter } from "@/lib/domain/dashboard";
import {
  LIFECYCLE_LABEL,
  HEALTH_LABEL,
  HEALTH_HELP,
  HEALTH_COLOR_VAR,
} from "@/lib/domain/lifecycle";
import { formatBudgetEok } from "@/lib/domain/format";
import { dashboardHref, toggle, type DashboardState } from "./url";

const ACCENT = "var(--primary)";
// 단계 도넛/범례 색: 진행전/검토중/진행중/완료/운영
const LIFE_COLORS = ["#C7CBD3", "#E0A106", "#534AB7", "#16A34A", "#0F1830"];

/** 과제 현황 KPI 스트립 (4카드). 단계 범례·헬스는 드릴다운(D-019) 링크. */
export function KpiStrip({
  kpis,
  filter,
  state,
  avgProgress,
}: {
  kpis: DashboardKpis;
  filter: DashboardFilter;
  state: DashboardState;
  avgProgress: number;
}) {
  const budgetRate =
    kpis.budgetTotal.budget > 0
      ? Math.round((kpis.budgetTotal.executed / kpis.budgetTotal.budget) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.05fr_1.45fr_1fr_1.1fr]">
      {/* 1) 라이프사이클 도넛 + 범례(드릴다운) */}
      <Card className="flex flex-col gap-2 p-3.5">
        <p className="text-muted-foreground text-[11.5px] font-semibold">
          과제 단계
        </p>
        <div className="flex items-center gap-3.5">
          <Donut
            size={70}
            thickness={11}
            ariaLabel={`과제 단계 — ${kpis.lifecycle.map((l) => `${LIFECYCLE_LABEL[l.key]} ${l.count}`).join(", ")}`}
            segments={kpis.lifecycle.map((l, i) => ({
              value: l.count,
              color: LIFE_COLORS[i],
            }))}
          >
            <div className="text-xl font-extrabold">{kpis.total}</div>
          </Donut>
          <div className="flex flex-1 flex-col gap-1">
            {kpis.lifecycle.map((l, i) => {
              const on = filter.lifecycle === l.key;
              return (
                <Link
                  key={l.key}
                  href={dashboardHref(state, {
                    lifecycle: toggle(filter.lifecycle, l.key),
                  })}
                  aria-pressed={on}
                  aria-label={`${LIFECYCLE_LABEL[l.key]} ${l.count}건 — 단계 필터 ${on ? "해제" : "적용"}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-1 text-[11.5px]",
                    on ? "bg-accent font-semibold" : "hover:bg-muted",
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: LIFE_COLORS[i] }}
                  />
                  <span className="text-muted-foreground">
                    {LIFECYCLE_LABEL[l.key]}
                  </span>
                  <b className="ml-auto pl-3.5 tabular-nums">{l.count}</b>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 2) 헬스 스택바 + 카운트(드릴다운) + 금주 */}
      <Card className="p-3.5">
        <p className="text-muted-foreground mb-2.5 text-[11.5px] font-semibold">
          진행 현황(헬스)
        </p>
        <div
          role="img"
          aria-label={`진행 현황 — ${kpis.health.map((h) => `${HEALTH_LABEL[h.key]} ${h.count}`).join(", ")}`}
          className="mb-3 flex h-3 overflow-hidden rounded-full"
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
        <div className="flex gap-4">
          {kpis.health.map((h) => (
            <Link
              key={h.key}
              href={dashboardHref(state, {
                progress: toggle(filter.progress, h.key),
              })}
              title={HEALTH_HELP[h.key]}
              aria-pressed={filter.progress === h.key}
              aria-label={`${HEALTH_LABEL[h.key]} ${h.count}건 — ${HEALTH_HELP[h.key]}. 진행 현황 필터 ${filter.progress === h.key ? "해제" : "적용"}`}
              className={cn(
                "flex flex-col gap-0.5 rounded px-1",
                filter.progress === h.key ? "bg-accent" : "hover:bg-muted",
              )}
            >
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: HEALTH_COLOR_VAR[h.key] }}
                />
                {HEALTH_LABEL[h.key]}
              </span>
              <span className="text-lg font-bold tabular-nums">{h.count}</span>
            </Link>
          ))}
          <Link
            href={dashboardHref(state, {
              progress: toggle(filter.progress, "this_week"),
            })}
            aria-pressed={filter.progress === "this_week"}
            aria-label={`금주 업데이트 ${kpis.thisWeekCount}건 — 필터 ${filter.progress === "this_week" ? "해제" : "적용"}`}
            className={cn(
              "ml-auto flex flex-col gap-0.5 rounded border-l pl-3.5 pr-1",
              filter.progress === "this_week" ? "bg-accent" : "hover:bg-muted",
            )}
          >
            <span className="text-muted-foreground text-[11px]">금주 업데이트</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: ACCENT }}>
              {kpis.thisWeekCount}
            </span>
          </Link>
        </div>
      </Card>

      {/* 3) 평균 진행률 */}
      <Card className="flex flex-col justify-center p-3.5">
        <p className="text-muted-foreground mb-2 text-[11.5px] font-semibold">
          평균 진행률
        </p>
        <p className="mb-2 text-2xl font-extrabold tabular-nums">{avgProgress}%</p>
        <Bar value={avgProgress} color={ACCENT} height={7} />
      </Card>

      {/* 4) 투자비 집행률 도넛 */}
      <Card className="flex items-center gap-3.5 p-3.5">
        <Donut
          size={70}
          thickness={11}
          ariaLabel={`투자비 집행률 ${budgetRate}%`}
          segments={[
            { value: budgetRate, color: ACCENT },
            { value: 100 - budgetRate, color: "#EEF0F3" },
          ]}
        >
          <div className="text-[17px] font-extrabold">{budgetRate}%</div>
        </Donut>
        <div className="leading-relaxed">
          <p className="text-muted-foreground text-[11.5px] font-semibold">
            투자비 집행
          </p>
          <p className="text-[15px] font-bold tabular-nums">
            {formatBudgetEok(kpis.budgetTotal.executed)}
          </p>
          <p className="text-muted-foreground text-[11px]">
            / {formatBudgetEok(kpis.budgetTotal.budget)} 예산
          </p>
        </div>
      </Card>
    </div>
  );
}
