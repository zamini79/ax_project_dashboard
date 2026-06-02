import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardFilter, DashboardKpis } from "@/lib/domain/dashboard";
import { LIFECYCLE_LABEL, HEALTH_LABEL } from "@/lib/domain/lifecycle";
import {
  MPRS_COLORS,
  MPRS_LABEL,
  type Mprs,
} from "@/lib/domain/mprs";
import { formatBudgetEok, executionRate } from "@/lib/domain/format";
import {
  dashboardHref,
  toggle,
  type GroupMode,
  type ViewMode,
} from "./url";
import type { SortKey, SortDir } from "@/lib/domain/dashboard";

interface KpiProps {
  kpis: DashboardKpis;
  filter: DashboardFilter;
  group: GroupMode;
  view: ViewMode;
  year: number;
  sort: SortKey | null;
  dir: SortDir;
}

const HEALTH_DOT: Record<string, string> = {
  red: "var(--health-red)",
  yellow: "var(--health-yellow)",
  green: "var(--health-green)",
};

/** 클릭 가능한 KPI 셀 (드릴다운). active면 강조(배경+테두리) — D-019 */
function StatButton({
  href,
  label,
  count,
  active,
  dotColor,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  dotColor?: string;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-0.5 rounded-md border px-2 py-2 transition-colors",
        active
          ? "border-primary bg-accent ring-primary/20 ring-2"
          : "border-transparent hover:bg-muted",
      )}
    >
      <span className="text-muted-foreground flex items-center gap-1 whitespace-nowrap text-xs">
        {dotColor && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: dotColor }}
          />
        )}
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">{count}</span>
    </Link>
  );
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-muted-foreground mb-2 text-xs font-medium">
      {children}
    </h2>
  );
}

export function KpiSection({
  kpis,
  filter,
  group,
  view,
  year,
  sort,
  dir,
}: KpiProps) {
  const state = { filter, group, view, year, sort, dir };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {/* (1) 과제 현황 — 라이프사이클 5 카운트 */}
      <Card className="p-3">
        <BlockTitle>과제 현황</BlockTitle>
        <div className="flex flex-col gap-2">
          <StatButton
            href={dashboardHref(state, { lifecycle: null })}
            label="전체"
            count={kpis.total}
            active={filter.lifecycle === null}
          />
          <div className="grid grid-cols-4 gap-1">
            {kpis.lifecycle.map(({ key, count }) => (
              <StatButton
                key={key}
                href={dashboardHref(state, {
                  lifecycle: toggle(filter.lifecycle, key),
                })}
                label={LIFECYCLE_LABEL[key]}
                count={count}
                active={filter.lifecycle === key}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* (2) 진행 현황 — 헬스 3 + 금주 업데이트 */}
      <Card className="p-3">
        <BlockTitle>진행 현황</BlockTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {kpis.health.map(({ key, count }) => (
            <StatButton
              key={key}
              href={dashboardHref(state, {
                progress: toggle(filter.progress, key),
              })}
              label={HEALTH_LABEL[key]}
              count={count}
              active={filter.progress === key}
              dotColor={HEALTH_DOT[key]}
            />
          ))}
          <StatButton
            href={dashboardHref(state, {
              progress: toggle(filter.progress, "this_week"),
            })}
            label="금주 업데이트"
            count={kpis.thisWeekCount}
            active={filter.progress === "this_week"}
          />
        </div>
      </Card>

      {/* (3) 본부별 과제 — 6 본부 3×2 */}
      <Card className="p-3">
        <BlockTitle>본부별 과제</BlockTitle>
        <div className="grid grid-cols-3 gap-1.5">
          {kpis.byHeadquarter.map((h) => (
            <StatButton
              key={h.id}
              href={dashboardHref(state, {
                headquarterId: toggle(filter.headquarterId, h.id),
              })}
              label={h.name}
              count={h.count}
              active={filter.headquarterId === h.id}
            />
          ))}
        </div>
      </Card>

      {/* (4) 투자비 집행 — 표시만 (Phase 1에서 클릭) */}
      <Card className="p-3">
        <BlockTitle>투자비 집행 (단위: 억)</BlockTitle>
        <div className="flex flex-col gap-2">
          <BudgetRow
            label="전체"
            budget={kpis.budgetTotal.budget}
            executed={kpis.budgetTotal.executed}
            color="var(--primary)"
            emphasize
          />
          {kpis.budgetByMprs.map((b) => (
            <BudgetRow
              key={b.key}
              label={MPRS_LABEL[b.key as Mprs]}
              budget={b.budget}
              executed={b.executed}
              color={MPRS_COLORS[b.key as Mprs].main}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function BudgetRow({
  label,
  budget,
  executed,
  color,
  emphasize = false,
}: {
  label: string;
  budget: number;
  executed: number;
  color: string;
  emphasize?: boolean;
}) {
  const rate = executionRate(budget, executed);
  const width = rate ?? 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className={cn(emphasize && "font-semibold")}>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatBudgetEok(executed)} / {formatBudgetEok(budget)}
          {rate != null && <span className="ml-1">({rate}%)</span>}
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}
