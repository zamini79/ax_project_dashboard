import Link from "next/link";

import { fetchProjectList } from "@/lib/repositories/projects";
import { fetchMonthlyExecution } from "@/lib/repositories/budget";
import { budgetSummary, type BudgetBucket } from "@/lib/domain/analytics";
import { Card } from "@/components/ui/card";
import { formatBudgetEok, formatYearMonth } from "@/lib/domain/format";
import { MPRS_COLORS, MPRS_LABEL, type Mprs } from "@/lib/domain/mprs";

export const dynamic = "force-dynamic";

const NEUTRAL = "#475569";

export default async function BudgetPage() {
  const [projects, monthly] = await Promise.all([
    fetchProjectList(),
    fetchMonthlyExecution(),
  ]);

  const s = budgetSummary(projects);
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.amount));

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-6 py-5">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="총 예산" value={formatBudgetEok(s.totalBudget)} />
        <StatCard label="총 집행" value={formatBudgetEok(s.totalExecuted)} />
        <StatCard
          label="집행률"
          value={s.rate != null ? `${s.rate}%` : "-"}
        />
        <StatCard
          label="미집행"
          value={formatBudgetEok(s.totalBudget - s.totalExecuted)}
        />
      </div>

      {/* 월별 집행 추이 */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">월별 집행 추이 (단위: 억)</h2>
        {monthly.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            집행 데이터가 없습니다.
          </p>
        ) : (
          <div className="flex h-44 items-end gap-2 overflow-x-auto">
            {monthly.map((m) => (
              <div
                key={m.year_month}
                className="flex w-10 shrink-0 flex-col items-center gap-1"
                title={`${formatYearMonth(m.year_month)} · ${formatBudgetEok(m.amount)}`}
              >
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {(m.amount / 100_000_000).toFixed(1)}
                </span>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max(4, (m.amount / maxMonthly) * 130)}px`,
                    background: NEUTRAL,
                  }}
                />
                <span className="text-muted-foreground text-[10px]">
                  {m.year_month.slice(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* MPRS별 */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">MPRS별 예산·집행</h2>
          <div className="flex flex-col gap-3">
            {s.byMprs.map((b) => (
              <BudgetRow
                key={b.key}
                label={MPRS_LABEL[b.key as Mprs]}
                bucket={b}
                color={MPRS_COLORS[b.key as Mprs].main}
              />
            ))}
          </div>
        </Card>

        {/* 본부별 */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">본부별 예산·집행</h2>
          <div className="flex flex-col gap-3">
            {s.byHeadquarter.map((b) => (
              <BudgetRow key={b.key} label={b.label} bucket={b} color={NEUTRAL} />
            ))}
          </div>
        </Card>
      </div>

      {/* 집행 TOP */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">집행액 상위 과제</h2>
        {s.topExecuted.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            데이터가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {s.topExecuted.map((p) => {
              const rate =
                (p.total_budget ?? 0) > 0
                  ? Math.round((p.executed_budget / (p.total_budget ?? 1)) * 100)
                  : null;
              return (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="hover:bg-muted/50 flex items-center gap-3 rounded px-1 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {p.name}
                    </span>
                    <span className="text-muted-foreground hidden w-24 truncate text-xs sm:block">
                      {p.headquarter_name}
                    </span>
                    <span className="w-32 text-right text-xs tabular-nums">
                      {formatBudgetEok(p.executed_budget)} /{" "}
                      {formatBudgetEok(p.total_budget)}
                    </span>
                    <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
                      {rate != null ? `${rate}%` : "-"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function BudgetRow({
  label,
  bucket,
  color,
}: {
  label: string;
  bucket: BudgetBucket;
  color: string;
}) {
  const width = bucket.rate ?? 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatBudgetEok(bucket.executed)} / {formatBudgetEok(bucket.budget)}
          {bucket.rate != null && (
            <span className="ml-1">({bucket.rate}%)</span>
          )}
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}
