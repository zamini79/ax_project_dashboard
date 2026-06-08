import Link from "next/link";

import {
  fetchProjectList,
  fetchProjectDetail,
  fetchHeadquarters,
} from "@/lib/repositories/projects";
import { fetchEffectForProject } from "@/lib/repositories/effects";
import { fetchMonthlyExecution } from "@/lib/repositories/budget";
import { fetchBudgetPlanItems } from "@/lib/repositories/budget-plan";
import { ProjectDetailDrawer } from "@/components/project-detail/project-detail-drawer";
import { BudgetPlanCard } from "@/components/budget/budget-plan-dialog";
import { Card } from "@/components/ui/card";
import { MiniBars, Bar } from "@/components/charts/charts";
import { formatBudgetEok } from "@/lib/domain/format";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import { capexByInvestmentType, INVESTMENT_LABEL } from "@/lib/domain/investment";
import { buildBudgetPlanView } from "@/lib/domain/budget-plan";

export const dynamic = "force-dynamic";

const ACCENT = "var(--primary)";
const GREEN = "var(--health-green)";
const YELLOW = "var(--health-yellow)";

type SearchParams = Promise<{ detail?: string }>;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const now = new Date();
  const fiscalYear = now.getFullYear();
  const [projects, monthly, planRows, headquarters] = await Promise.all([
    fetchProjectList(),
    fetchMonthlyExecution(),
    fetchBudgetPlanItems(fiscalYear),
    fetchHeadquarters(),
  ]);

  // 상세 드로어 (?detail=<id>) — 투자비 현황 위에 그대로 띄움
  const detail = sp.detail ? await fetchProjectDetail(sp.detail) : null;
  const detailEffect = detail ? await fetchEffectForProject(detail.id) : null;
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // CAPEX 항목별 = 과제 투자 유형별 자동 집계 (D-030)
  const capex = capexByInvestmentType(projects);
  const maxPlan = Math.max(1, ...capex.map((c) => c.plan_won));

  // 사업계획 (D-031): 계획=수기, 집행=매핑 과제 자동 합산
  const plan = buildBudgetPlanView(fiscalYear, planRows);
  const execTotal = capex.reduce((a, c) => a + c.exec_won, 0); // 전체 집행
  const planExec = plan.planExec; // 계획 집행 (매핑 과제)
  const outOfPlan = Math.max(0, execTotal - planExec); // 계획 이외 집행
  const unspent = plan.planTotal - planExec; // 계획대비 미집행
  const planRate = plan.planTotal > 0 ? Math.round((planExec / plan.planTotal) * 100) : 0;
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
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
        <p className="text-muted-foreground mt-0.5 text-[12px]">
          전체 CAPEX 규모와 항목별·과제별 계획 대비 집행 현황
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
        {/* 사업계획 (클릭 → 팝업) */}
        <BudgetPlanCard year={fiscalYear} view={plan} projectOptions={projectOptions} headquarterOptions={headquarters} />

        {/* 집행 누계 = 전체 집행 + 계획/계획외 분해 */}
        <StatCard
          label={`${now.getFullYear() % 100}년 ${now.getMonth() + 1}월 현재 집행 누계`}
          value={formatBudgetEok(execTotal)}
          valueColor={ACCENT}
        >
          <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-[12px]">
            <span>
              계획 집행 <b className="text-foreground tabular-nums">{formatBudgetEok(planExec)}</b>
            </span>
            <span>
              계획 이외 집행 <b className="text-foreground tabular-nums">{formatBudgetEok(outOfPlan)}</b>
            </span>
          </div>
        </StatCard>

        {/* 계획대비 미집행 잔액 */}
        <StatCard
          label="계획대비 미집행 잔액"
          value={formatBudgetEok(unspent)}
          sub={`계획 집행률 ${planRate}%`}
        >
          <Bar value={planRate} color={ACCENT} height={6} />
        </StatCard>
      </div>

      {/* 항목별 + 월별 */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">CAPEX 항목별 계획 대비 집행</h2>
            <span className="text-faint text-[12px]">막대 = 계획 · 채움 = 집행</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {capex.map((c) => {
              const cRate = c.plan_won > 0 ? Math.round((c.exec_won / c.plan_won) * 100) : 0;
              return (
                <div key={c.type} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-[14px] font-semibold">
                    {c.label}
                  </span>
                  <div className="relative h-3 flex-1">
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full"
                      style={{ width: `${(c.plan_won / maxPlan) * 100}%`, background: "#EEF0F3" }}
                    />
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full"
                      style={{ width: `${(c.exec_won / maxPlan) * 100}%`, background: ACCENT }}
                    />
                  </div>
                  <span className="text-muted-foreground w-[150px] shrink-0 text-right text-[12px] tabular-nums">
                    {formatBudgetEok(c.exec_won)} / {formatBudgetEok(c.plan_won)}{" "}
                    <b className="text-foreground">({cRate}%)</b>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">월별 집행 추이</h2>
            <span className="text-faint text-[12px]">단위: 억</span>
          </div>
          <div className="mt-2 flex flex-1 items-end gap-5">
            <div className="shrink-0">
              <div className="text-[28px] font-extrabold leading-none tabular-nums">
                {formatBudgetEok(cumulative)}
              </div>
              <div className="text-muted-foreground mt-1.5 text-[12px] font-semibold">
                누적
              </div>
            </div>
            <div className="flex flex-1 items-end justify-end overflow-x-auto">
              <MiniBars
                data={monthlyBars}
                height={120}
                barW={28}
                gap={12}
                accentLast={ACCENT}
                ariaLabel={`월별 집행 추이 · 누적 ${formatBudgetEok(cumulative)}`}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 과제별 계획 대비 집행 */}
      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-[15px] font-bold">
          과제별 계획 대비 집행{" "}
          <span className="text-muted-foreground font-medium">
            {byBudget.length}건
          </span>
        </div>
        <div className="text-muted-foreground flex h-9 items-center border-b bg-[#FAFAFB] px-4 text-[13px] font-semibold">
          <div className="w-[87px] shrink-0 text-center">순번</div>
          <div className="w-[135px] shrink-0 text-center">MPRS</div>
          <div className="w-[111px] shrink-0 text-center">투자유형</div>
          <div className="min-w-0 flex-1 text-center">과제명</div>
          <div className="w-[177px] shrink-0 text-center">본부</div>
          <div className="w-[119px] shrink-0 text-center">계획</div>
          <div className="w-[119px] shrink-0 text-center">집행</div>
          <div className="w-[207px] shrink-0 text-center">집행률</div>
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
              href={`/budget?detail=${p.id}`}
              className={`hover:bg-muted/50 flex h-[42px] items-center px-4 text-[14px] transition-colors ${i === byBudget.length - 1 ? "" : "border-b"}`}
            >
              <div className="text-muted-foreground w-[87px] shrink-0 text-center tabular-nums">
                {i + 1}
              </div>
              <div className="w-[135px] shrink-0 text-center">
                <span
                  className="rounded px-1.5 py-0.5 text-[12px] font-bold"
                  style={{ background: mprs.bg, color: mprs.text }}
                >
                  {MPRS_LABEL[p.mprs]}
                </span>
              </div>
              <div className="w-[111px] shrink-0 text-center">
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[12px] font-semibold">
                  {INVESTMENT_LABEL[p.investment_type]}
                </span>
              </div>
              <div className="min-w-0 flex-1 truncate pl-3 pr-2 font-semibold">{p.name}</div>
              <div className="text-muted-foreground w-[177px] shrink-0 truncate text-center text-[12px]">
                {p.headquarter_name}
              </div>
              <div className="w-[119px] shrink-0 text-center tabular-nums">
                {formatBudgetEok(p.total_budget)}
              </div>
              <div className="w-[119px] shrink-0 text-center font-semibold tabular-nums">
                {formatBudgetEok(p.executed_budget)}
              </div>
              <div className="flex w-[207px] shrink-0 items-center gap-2 pl-4">
                <div className="flex-1">
                  <Bar value={r} color={color} height={6} />
                </div>
                <span className="text-muted-foreground w-8 text-right text-[12px] tabular-nums">
                  {r}%
                </span>
              </div>
            </Link>
          );
        })}
      </Card>

      {detail && (
        <ProjectDetailDrawer
          detail={detail}
          effect={detailEffect}
          closeHref="/budget"
          todayISO={todayISO}
        />
      )}
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
      <p className="text-muted-foreground text-[13px]">{label}</p>
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
