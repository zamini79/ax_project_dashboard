import type { PlanItemRow } from "@/lib/repositories/budget-plan";

/**
 * 사업계획 뷰 조립 (DB·UI 무관 순수 함수, D-031).
 * 계획 = 항목 입력값, 집행 = 매핑 과제의 월별 집행 합계(자동).
 * 연간 수치는 전 기간 합계(페이지의 '전체 집행'과 동일 기준), 월별 차트는 해당 연도 12개월.
 */

export interface PlanItemView {
  id: string;
  name: string;
  planWon: number;
  execWon: number;
  rate: number; // 집행률 %
  projectIds: string[];
  projectNames: string[];
  monthly: { ym: string; plan: number; exec: number }[];
}

export interface BudgetPlanView {
  fiscalYear: number;
  items: PlanItemView[];
  planTotal: number; // 계획 총액
  planExec: number; // 계획 집행 (매핑 과제 집행 합계, 과제 중복 제거)
  monthly: { ym: string; plan: number; exec: number }[]; // 항목 합산 월별
}

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const rateOf = (exec: number, plan: number) =>
  plan > 0 ? Math.round((exec / plan) * 100) : 0;

/** 해당 연도 12개월 'YYYY-MM' 축 */
function yearMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

export function buildBudgetPlanView(
  fiscalYear: number,
  rows: PlanItemRow[],
): BudgetPlanView {
  const months = yearMonths(fiscalYear);

  const items: PlanItemView[] = rows.map((it) => {
    // 항목 집행 = 매핑 과제 전 기간 집행 합계
    const execWon = sum(
      it.projects.map((p) => sum(p.monthly.map((m) => m.amount))),
    );
    const planByMonth = new Map(
      it.monthlyPlan.map((m) => [m.year_month, m.plan_amount]),
    );
    const execByMonth = new Map<string, number>();
    for (const p of it.projects) {
      for (const m of p.monthly) {
        execByMonth.set(m.year_month, (execByMonth.get(m.year_month) ?? 0) + m.amount);
      }
    }
    return {
      id: it.id,
      name: it.name,
      planWon: it.plan_amount,
      execWon,
      rate: rateOf(execWon, it.plan_amount),
      projectIds: it.projects.map((p) => p.id),
      projectNames: it.projects.map((p) => p.name),
      monthly: months.map((ym) => ({
        ym,
        plan: planByMonth.get(ym) ?? 0,
        exec: execByMonth.get(ym) ?? 0,
      })),
    };
  });

  const planTotal = sum(items.map((i) => i.planWon));

  // 계획 집행: 매핑 과제 중복 제거 후 전 기간 집행 합계
  const execByProject = new Map<string, number>();
  for (const it of rows) {
    for (const p of it.projects) {
      if (!execByProject.has(p.id)) {
        execByProject.set(p.id, sum(p.monthly.map((m) => m.amount)));
      }
    }
  }
  const planExec = sum([...execByProject.values()]);

  // 항목 합산 월별 (계획=항목합, 집행=중복제거 과제 합)
  const planByMonthAll = new Map<string, number>();
  for (const it of rows) {
    for (const m of it.monthlyPlan) {
      planByMonthAll.set(m.year_month, (planByMonthAll.get(m.year_month) ?? 0) + m.plan_amount);
    }
  }
  const execByMonthAll = new Map<string, number>();
  const seen = new Set<string>();
  for (const it of rows) {
    for (const p of it.projects) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      for (const m of p.monthly) {
        execByMonthAll.set(m.year_month, (execByMonthAll.get(m.year_month) ?? 0) + m.amount);
      }
    }
  }

  return {
    fiscalYear,
    items,
    planTotal,
    planExec,
    monthly: months.map((ym) => ({
      ym,
      plan: planByMonthAll.get(ym) ?? 0,
      exec: execByMonthAll.get(ym) ?? 0,
    })),
  };
}
