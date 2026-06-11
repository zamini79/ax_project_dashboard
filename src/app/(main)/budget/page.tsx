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
import { Bar } from "@/components/charts/charts";
import { MonthlyExecBars } from "@/components/charts/monthly-exec-bars";
import { formatBudgetEok } from "@/lib/domain/format";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import { INVESTMENT_LABEL } from "@/lib/domain/investment";
import {
  buildBudgetPlanView,
  planYearBreakdown,
} from "@/lib/domain/budget-plan";
import { monthlyExecutionForYear } from "@/lib/domain/analytics";
import { BudgetYearSelect } from "@/components/budget/budget-year-select";

export const dynamic = "force-dynamic";

const ACCENT = "var(--primary)";
const GREEN = "var(--health-green)";
const YELLOW = "var(--health-yellow)";

type BudgetSortKey = "mprs" | "type" | "name" | "hq" | "plan" | "exec" | "rate";

type SearchParams = Promise<{
  detail?: string;
  sort?: string;
  dir?: string;
  year?: string;
}>;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sortKey = (sp.sort as BudgetSortKey | undefined) ?? "plan";
  const sortDir = sp.dir === "asc" ? "asc" : "desc";
  const now = new Date();
  const currentYear = now.getFullYear();
  const [projects, monthly, planRows, headquarters] = await Promise.all([
    fetchProjectList(),
    fetchMonthlyExecution(),
    fetchBudgetPlanItems(), // 전체 연도 (팝업에서 연도 컬럼 표시)
    fetchHeadquarters(),
  ]);

  // 연도 선택 (?year=) — 사업계획이 존재하는 연도 + 올해
  const planYears = Array.from(new Set(planRows.map((r) => r.fiscal_year)));
  const years = Array.from(new Set([currentYear, ...planYears])).sort(
    (a, b) => b - a,
  );
  const yParam = Number(sp.year);
  const fiscalYear =
    Number.isInteger(yParam) && years.includes(yParam) ? yParam : currentYear;

  // 상세 드로어 (?detail=<id>) — 투자비 현황 위에 그대로 띄움
  const detail = sp.detail ? await fetchProjectDetail(sp.detail) : null;
  const detailEffect = detail ? await fetchEffectForProject(detail.id) : null;
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // 사업계획 (D-031): 계획=수기, 집행=매핑 과제 자동 합산. 선택 연도 기준.
  const planRowsYear = planRows.filter((r) => r.fiscal_year === fiscalYear);
  const plan = buildBudgetPlanView(fiscalYear, planRowsYear); // KPI 카드(선택 연도)
  const planAll = buildBudgetPlanView(fiscalYear, planRows); // 팝업(전체 연도)

  // CAPEX 항목별 / 본부별 — 선택 연도 사업계획 기준 (계획=plan_amount, 집행=매핑 과제 당해 집행)
  const breakdown = planYearBreakdown(planRowsYear, fiscalYear);
  const capex = breakdown.byInvestment;
  const maxPlan = Math.max(1, ...capex.map((c) => c.plan_won));
  // 본부 표시 순서 = 본부 마스터 등록 순(MBD→Bio→개발→L HOUSE→…→전사). 미지정은 마지막.
  const hqOrder = new Map(headquarters.map((h, i) => [h.id, i]));
  const hqBudget = [...breakdown.byHeadquarter].sort(
    (a, b) => (hqOrder.get(a.key) ?? 999) - (hqOrder.get(b.key) ?? 999),
  );
  const maxHqPlan = Math.max(1, ...hqBudget.map((h) => h.plan_won));

  // 선택 연도 1~12월 집행 실적(없는 달 0) + 누계/계획·계획외 분해
  const yearMonthly = monthlyExecutionForYear(monthly, fiscalYear);
  const execTotal = yearMonthly.reduce((a, m) => a + m.amount, 0); // 당해 전체 집행
  const planTotal = breakdown.planTotal;
  const planExec = breakdown.planExec; // 계획 집행 (매핑 과제, 당해)
  const outOfPlan = Math.max(0, execTotal - planExec); // 계획 이외 집행
  const unspent = planTotal - planExec; // 계획대비 미집행
  const planRate = planTotal > 0 ? Math.round((planExec / planTotal) * 100) : 0;
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const monthlyBars = yearMonthly.map((m) => ({
    label: m.year_month.slice(2).replace("-", "."),
    value: m.amount / 100_000_000,
    projects: m.projects.map((p) => ({ name: p.name, amount: p.amount })),
  }));
  const cumulative = execTotal; // 월별 카드 "누적" = 당해 집행 누계
  const byBudget = [...projects]
    .map((p) => ({
      ...p,
      _rate:
        (p.total_budget ?? 0) > 0
          ? p.executed_budget / (p.total_budget ?? 1)
          : 0,
    }))
    .sort((a, b) => {
      let v = 0;
      switch (sortKey) {
        case "mprs":
          v = a.mprs.localeCompare(b.mprs);
          break;
        case "type":
          v = a.investment_type.localeCompare(b.investment_type);
          break;
        case "name":
          v = a.name.localeCompare(b.name, "ko");
          break;
        case "hq":
          v = (a.headquarter_name ?? "").localeCompare(
            b.headquarter_name ?? "",
            "ko",
          );
          break;
        case "plan":
          v = (a.total_budget ?? 0) - (b.total_budget ?? 0);
          break;
        case "exec":
          v = a.executed_budget - b.executed_budget;
          break;
        case "rate":
          v = a._rate - b._rate;
          break;
      }
      return sortDir === "asc" ? v : -v;
    });

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 px-6 py-5">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight">투자비 현황</h1>
          <BudgetYearSelect year={fiscalYear} years={years} />
        </div>
        <p className="text-muted-foreground mt-0.5 text-[12px]">
          {fiscalYear}년 사업계획 기준 · 항목별·본부별·과제별 계획 대비 집행 현황
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
        {/* 사업계획 (클릭 → 팝업) */}
        <BudgetPlanCard year={fiscalYear} cardView={plan} view={planAll} projectOptions={projectOptions} headquarterOptions={headquarters} />

        {/* 집행 누계 = 전체 집행 + 계획/계획외 분해 */}
        <StatCard
          label={
            fiscalYear === currentYear
              ? `${fiscalYear % 100}년 ${now.getMonth() + 1}월 현재 집행 누계`
              : `${fiscalYear % 100}년 집행 누계`
          }
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

      {/* 항목별 + 본부별 + 월별 */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_1.2fr_1.3fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">CAPEX 항목별 계획 대비 집행</h2>
            <span className="text-faint text-[12px]">막대 = 계획 · 채움 = 집행</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {capex.map((c) => {
              const cRate = c.plan_won > 0 ? Math.round((c.exec_won / c.plan_won) * 100) : 0;
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-center text-[14px] font-semibold">
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
                  <span className="text-muted-foreground flex shrink-0 items-center justify-end gap-1 text-[12px] tabular-nums">
                    <span className="w-[56px] text-right">
                      {formatBudgetEok(c.exec_won)}
                    </span>
                    <span className="text-faint">/</span>
                    <span className="w-[56px] text-right">
                      {formatBudgetEok(c.plan_won)}
                    </span>
                    <b className="text-foreground w-[46px] text-right">
                      ({cRate}%)
                    </b>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">본부별 투자비 집행현황</h2>
            <span className="text-faint text-[12px]">막대 = 계획 · 채움 = 집행</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {hqBudget.map((h) => {
              const hRate =
                h.plan_won > 0
                  ? Math.round((h.exec_won / h.plan_won) * 100)
                  : 0;
              return (
                <div key={h.key} className="flex items-center gap-3">
                  <span className="w-[104px] shrink-0 whitespace-nowrap text-center text-[13px] font-semibold">
                    {h.label}
                  </span>
                  <div className="relative h-3 flex-1">
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full"
                      style={{
                        width: `${(h.plan_won / maxHqPlan) * 100}%`,
                        background: "#EEF0F3",
                      }}
                    />
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full"
                      style={{
                        width: `${(h.exec_won / maxHqPlan) * 100}%`,
                        background: ACCENT,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground flex shrink-0 items-center justify-end gap-1 text-[12px] tabular-nums">
                    <span className="w-[56px] text-right">
                      {formatBudgetEok(h.exec_won)}
                    </span>
                    <span className="text-faint">/</span>
                    <span className="w-[56px] text-right">
                      {formatBudgetEok(h.plan_won)}
                    </span>
                    <b className="text-foreground w-[46px] text-right">
                      ({hRate}%)
                    </b>
                  </span>
                </div>
              );
            })}
            {hqBudget.length === 0 && (
              <p className="text-muted-foreground text-[13px]">
                표시할 본부가 없습니다.
              </p>
            )}
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
              <MonthlyExecBars
                data={monthlyBars}
                height={120}
                barW={28}
                gap={12}
                accent={ACCENT}
                ariaLabel={`월별 집행 추이 · 누적 ${formatBudgetEok(cumulative)}`}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 과제별 투자비 집행 현황 */}
      <Card className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 text-[15px] font-bold">
          과제별 투자비 집행 현황{" "}
          <span className="text-muted-foreground font-medium">
            {byBudget.length}건
          </span>
        </div>
        <div className="text-muted-foreground flex h-9 items-center border-b bg-[#FAFAFB] px-4 text-[13px] font-semibold">
          <div className="w-[87px] shrink-0 text-center">순번</div>
          <SortTh col="mprs" label="MPRS" cls="w-[135px] shrink-0 text-center" cur={sortKey} dir={sortDir} detail={sp.detail} />
          <SortTh col="type" label="투자유형" cls="w-[111px] shrink-0 text-center" cur={sortKey} dir={sortDir} detail={sp.detail} />
          <SortTh col="name" label="과제명" cls="min-w-0 flex-1 text-center" cur={sortKey} dir={sortDir} detail={sp.detail} />
          <SortTh col="hq" label="본부" cls="w-[177px] shrink-0 text-center" cur={sortKey} dir={sortDir} detail={sp.detail} />
          <SortTh col="plan" label="계획" cls="w-[119px] shrink-0 text-center" cur={sortKey} dir={sortDir} detail={sp.detail} />
          <SortTh col="exec" label="집행" cls="w-[119px] shrink-0 text-center" cur={sortKey} dir={sortDir} detail={sp.detail} />
          <SortTh col="rate" label="집행률" cls="w-[207px] shrink-0 text-center" cur={sortKey} dir={sortDir} detail={sp.detail} />
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

function SortTh({
  col,
  label,
  cls,
  cur,
  dir,
  detail,
}: {
  col: BudgetSortKey;
  label: string;
  cls: string;
  cur: BudgetSortKey;
  dir: "asc" | "desc";
  detail?: string;
}) {
  const active = cur === col;
  const nextDir = active && dir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams({ sort: col, dir: nextDir });
  if (detail) params.set("detail", detail);
  return (
    <Link
      href={`/budget?${params.toString()}`}
      className={`${cls} hover:text-foreground inline-flex items-center justify-center gap-0.5 transition-colors`}
    >
      {label}
      <span className={active ? "text-foreground" : "text-muted-foreground/40"}>
        {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </Link>
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
