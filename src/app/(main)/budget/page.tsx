import Link from "next/link";

import { fetchProjectList } from "@/lib/repositories/projects";
import { fetchMonthlyExecution, fetchCapexItems } from "@/lib/repositories/budget";
import { Card } from "@/components/ui/card";
import { MiniBars, Bar } from "@/components/charts/charts";
import { formatBudgetEok } from "@/lib/domain/format";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";

export const dynamic = "force-dynamic";

const ACCENT = "#534AB7";
const GREEN = "#16A34A";
const YELLOW = "#E0A106";

export default async function BudgetPage() {
  const [projects, monthly, capex] = await Promise.all([
    fetchProjectList(),
    fetchMonthlyExecution(),
    fetchCapexItems(),
  ]);

  const planTotal = capex.reduce((a, c) => a + c.plan_won, 0);
  const execTotal = capex.reduce((a, c) => a + c.exec_won, 0);
  const rate = planTotal > 0 ? Math.round((execTotal / planTotal) * 100) : 0;
  const maxPlan = Math.max(1, ...capex.map((c) => c.plan_won));
  const monthlyBars = monthly.map((m) => ({
    label: m.year_month.slice(2).replace("-", "."),
    value: m.amount / 100_000_000,
  }));
  const cumulative = monthly.reduce((a, m) => a + m.amount, 0);
  const byBudget = [...projects].sort(
    (a, b) => (b.total_budget ?? 0) - (a.total_budget ?? 0),
  );

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 px-6 py-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">투자비 현황</h1>
        <p className="text-muted-foreground mt-0.5 text-[12.5px]">
          전체 CAPEX 규모와 항목별·과제별 계획 대비 집행 현황
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <StatCard label="총 CAPEX (계획)" value={formatBudgetEok(planTotal)} sub="전체 과제 투자 예산" />
        <StatCard
          label="집행 누계"
          value={formatBudgetEok(execTotal)}
          valueColor={ACCENT}
          sub={`집행률 ${rate}%`}
        />
        <StatCard label="집행률" value={`${rate}%`}>
          <Bar value={rate} color={ACCENT} height={6} />
        </StatCard>
        <StatCard
          label="미집행 잔액"
          value={formatBudgetEok(planTotal - execTotal)}
          sub={`계획 대비 ${100 - rate}%`}
        />
      </div>

      {/* 항목별 + 월별 */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold">CAPEX 항목별 계획 대비 집행</h2>
            <span className="text-faint text-[11px]">막대 = 계획 · 채움 = 집행</span>
          </div>
          <div className="flex flex-col gap-3">
            {capex.map((c) => {
              const cRate = c.plan_won > 0 ? Math.round((c.exec_won / c.plan_won) * 100) : 0;
              return (
                <div key={c.id}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[12.5px] font-semibold">{c.category}</span>
                    <span className="text-muted-foreground text-[11.5px] tabular-nums">
                      {formatBudgetEok(c.exec_won)} / {formatBudgetEok(c.plan_won)}{" "}
                      <b className="text-foreground">({cRate}%)</b>
                    </span>
                  </div>
                  <div className="relative h-3 w-full">
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full"
                      style={{ width: `${(c.plan_won / maxPlan) * 100}%`, background: "#EEF0F3" }}
                    />
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full"
                      style={{ width: `${(c.exec_won / maxPlan) * 100}%`, background: ACCENT }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[13px] font-bold">월별 집행 추이</h2>
            <span className="text-faint text-[11px]">단위: 억</span>
          </div>
          <div className="text-[28px] font-extrabold tabular-nums">
            {formatBudgetEok(cumulative)}{" "}
            <span className="text-muted-foreground text-[13px] font-semibold">
              누적
            </span>
          </div>
          <div className="mt-3.5 flex flex-1 items-end overflow-x-auto">
            <MiniBars data={monthlyBars} height={120} barW={28} gap={12} accentLast={ACCENT} />
          </div>
        </Card>
      </div>

      {/* 과제별 계획 대비 집행 */}
      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-[13px] font-bold">
          과제별 계획 대비 집행{" "}
          <span className="text-muted-foreground font-medium">
            {byBudget.length}건
          </span>
        </div>
        <div className="text-muted-foreground flex h-9 items-center border-b bg-[#FAFAFB] px-4 text-[11px] font-semibold">
          <div className="w-[88px] shrink-0">MPRS</div>
          <div className="min-w-0 flex-1">과제명</div>
          <div className="w-[130px] shrink-0">본부</div>
          <div className="w-[72px] shrink-0 text-right">계획</div>
          <div className="w-[72px] shrink-0 text-right">집행</div>
          <div className="w-[160px] shrink-0 pl-4">집행률</div>
        </div>
        {byBudget.map((p, i) => {
          const r =
            (p.total_budget ?? 0) > 0
              ? Math.round((p.executed_budget / (p.total_budget ?? 1)) * 100)
              : 0;
          const color = r >= 70 ? GREEN : r >= 30 ? ACCENT : YELLOW;
          const mprs = MPRS_COLORS[p.mprs];
          return (
            <Link
              key={p.id}
              href={`/projects?detail=${p.id}`}
              className={`hover:bg-muted/50 flex h-[42px] items-center px-4 text-[12.5px] transition-colors ${i === byBudget.length - 1 ? "" : "border-b"}`}
            >
              <div className="w-[88px] shrink-0">
                <span
                  className="rounded px-1.5 py-0.5 text-[10.5px] font-bold"
                  style={{ background: mprs.bg, color: mprs.text }}
                >
                  {MPRS_LABEL[p.mprs]}
                </span>
              </div>
              <div className="min-w-0 flex-1 truncate pr-2 font-semibold">{p.name}</div>
              <div className="text-muted-foreground w-[130px] shrink-0 truncate text-[11.5px]">
                {p.headquarter_name}
              </div>
              <div className="w-[72px] shrink-0 text-right tabular-nums">
                {formatBudgetEok(p.total_budget)}
              </div>
              <div className="w-[72px] shrink-0 text-right font-semibold tabular-nums">
                {formatBudgetEok(p.executed_budget)}
              </div>
              <div className="flex w-[160px] shrink-0 items-center gap-2 pl-4">
                <div className="flex-1">
                  <Bar value={r} color={color} height={6} />
                </div>
                <span className="text-muted-foreground w-8 text-right text-[11.5px] tabular-nums">
                  {r}%
                </span>
              </div>
            </Link>
          );
        })}
      </Card>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className="mt-1 text-2xl font-extrabold tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      {children && <div className="mt-2.5">{children}</div>}
    </Card>
  );
}
