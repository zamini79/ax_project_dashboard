import type { PlanItemRow } from "@/lib/repositories/budget-plan";
import {
  INVESTMENT_ORDER,
  INVESTMENT_LABEL,
  type InvestmentType,
} from "@/lib/domain/investment";
import type { Mprs } from "@/lib/domain/mprs";

/**
 * 사업계획 뷰 조립 (DB·UI 무관 순수 함수, D-031).
 * 계획 = 항목 입력값, 집행 = 매핑 과제의 집행 합계(자동).
 * 월별 축: 전년(합계) + 당해 1~12월 + 차년(합계) = 14칸.
 */

export interface MonthBucket {
  key: string; // '2025' | '2026-03' | '2027'
  label: string; // '25년' | '3월' | '27년'
  plan: number;
  exec: number;
}

export interface PlanItemView {
  id: string;
  name: string;
  fiscalYear: number;
  investmentType: InvestmentType | null;
  headquarterId: string | null;
  headquarterName: string | null;
  mprs: Mprs | null;
  planWon: number;
  execWon: number;
  rate: number; // 집행률 %
  projectIds: string[];
  projectNames: string[];
  projects: { id: string; name: string; execWon: number }[];
  monthly: MonthBucket[];
}

export interface BudgetPlanView {
  fiscalYear: number;
  items: PlanItemView[];
  planTotal: number; // 계획 총액
  planExec: number; // 계획 집행 (매핑 과제, 중복 제거)
  monthly: MonthBucket[]; // 항목 합산
}

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const rateOf = (exec: number, plan: number) =>
  plan > 0 ? Math.round((exec / plan) * 100) : 0;

/** 전년·1~12월·차년 버킷 키/라벨 */
export function planBuckets(year: number): { key: string; label: string }[] {
  const prev = year - 1;
  const nextY = year + 1;
  return [
    { key: `${prev}`, label: `${prev % 100}년` },
    ...Array.from({ length: 12 }, (_, i) => ({
      key: `${year}-${String(i + 1).padStart(2, "0")}`,
      label: `${i + 1}월`,
    })),
    { key: `${nextY}`, label: `${nextY % 100}년` },
  ];
}

/** 'YYYY-MM' 집행 행을 해당 연도 버킷 키로 매핑 (당해월은 그대로, 전·차년은 연합계) */
function execBucketKey(yearMonth: string, year: number): string | null {
  const yr = yearMonth.slice(0, 4);
  if (yr === String(year)) return yearMonth;
  if (yr === String(year - 1)) return `${year - 1}`;
  if (yr === String(year + 1)) return `${year + 1}`;
  return null;
}

/** 사업계획 기준 그룹 집계(투자유형별/본부별) 1행 */
export interface PlanGroupRow {
  key: string;
  label: string;
  plan_won: number; // 계획 (Σ plan_amount)
  exec_won: number; // 집행 (매핑 과제의 해당 연도 집행 합)
}

export interface PlanYearBreakdown {
  planTotal: number; // 연도 계획 총액
  planExec: number; // 연도 계획 집행 (매핑 과제 중복 제거)
  byInvestment: PlanGroupRow[]; // CAPEX 항목별 (INVESTMENT_ORDER 고정 5종 + 미지정)
  byHeadquarter: PlanGroupRow[]; // 본부별 (계획액 내림차순)
}

/**
 * 선택 연도 사업계획을 기준으로 한 투자유형별·본부별 집계 (순수, 연도 집행 기준).
 * 계획 = 항목 plan_amount, 집행 = 매핑 과제의 *해당 연도* 월별 집행 합.
 * rows 는 해당 연도(fiscal_year === year) 항목만 넘길 것.
 */
export function planYearBreakdown(
  rows: PlanItemRow[],
  year: number,
): PlanYearBreakdown {
  const pfx = `${year}-`;
  const execInYear = (monthly: { year_month: string; amount: number }[]) =>
    sum(monthly.filter((m) => m.year_month.startsWith(pfx)).map((m) => m.amount));

  // 계획 집행: 매핑 과제 중복 제거 후 해당 연도 집행 합
  const projExec = new Map<string, number>();
  for (const it of rows) {
    for (const p of it.projects) {
      if (!projExec.has(p.id)) projExec.set(p.id, execInYear(p.monthly));
    }
  }
  const planExec = sum([...projExec.values()]);

  const invPlan = new Map<InvestmentType, number>();
  const invExec = new Map<InvestmentType, number>();
  let noInvPlan = 0;
  let noInvExec = 0;
  const hqMap = new Map<string, { name: string; plan: number; exec: number }>();

  for (const it of rows) {
    const itemExec = sum(it.projects.map((p) => execInYear(p.monthly)));
    if (it.investment_type) {
      invPlan.set(
        it.investment_type,
        (invPlan.get(it.investment_type) ?? 0) + it.plan_amount,
      );
      invExec.set(
        it.investment_type,
        (invExec.get(it.investment_type) ?? 0) + itemExec,
      );
    } else {
      noInvPlan += it.plan_amount;
      noInvExec += itemExec;
    }
    const hqKey = it.headquarter_id ?? "__none__";
    const h = hqMap.get(hqKey) ?? {
      name: it.headquarter_name ?? "미지정",
      plan: 0,
      exec: 0,
    };
    h.plan += it.plan_amount;
    h.exec += itemExec;
    hqMap.set(hqKey, h);
  }

  const byInvestment: PlanGroupRow[] = INVESTMENT_ORDER.map((t) => ({
    key: t,
    label: INVESTMENT_LABEL[t],
    plan_won: invPlan.get(t) ?? 0,
    exec_won: invExec.get(t) ?? 0,
  }));
  if (noInvPlan > 0 || noInvExec > 0) {
    byInvestment.push({
      key: "none",
      label: "미지정",
      plan_won: noInvPlan,
      exec_won: noInvExec,
    });
  }

  const byHeadquarter: PlanGroupRow[] = [...hqMap.entries()]
    .map(([key, v]) => ({
      key,
      label: v.name,
      plan_won: v.plan,
      exec_won: v.exec,
    }))
    .sort((a, b) => b.plan_won - a.plan_won);

  return {
    planTotal: sum(rows.map((it) => it.plan_amount)),
    planExec,
    byInvestment,
    byHeadquarter,
  };
}

export function buildBudgetPlanView(
  fiscalYear: number,
  rows: PlanItemRow[],
): BudgetPlanView {
  const buckets = planBuckets(fiscalYear);

  const items: PlanItemView[] = rows.map((it) => {
    const execWon = sum(
      it.projects.map((p) => sum(p.monthly.map((m) => m.amount))),
    );
    const planByKey = new Map(it.monthlyPlan.map((m) => [m.year_month, m.plan_amount]));
    const execByKey = new Map<string, number>();
    for (const p of it.projects) {
      for (const m of p.monthly) {
        const k = execBucketKey(m.year_month, fiscalYear);
        if (k) execByKey.set(k, (execByKey.get(k) ?? 0) + m.amount);
      }
    }
    return {
      id: it.id,
      name: it.name,
      fiscalYear: it.fiscal_year,
      investmentType: it.investment_type,
      headquarterId: it.headquarter_id,
      headquarterName: it.headquarter_name,
      mprs: it.mprs,
      planWon: it.plan_amount,
      execWon,
      rate: rateOf(execWon, it.plan_amount),
      projectIds: it.projects.map((p) => p.id),
      projectNames: it.projects.map((p) => p.name),
      projects: it.projects.map((p) => ({
        id: p.id,
        name: p.name,
        execWon: sum(p.monthly.map((m) => m.amount)),
      })),
      monthly: buckets.map((b) => ({
        key: b.key,
        label: b.label,
        plan: planByKey.get(b.key) ?? 0,
        exec: execByKey.get(b.key) ?? 0,
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

  // 항목 합산 월별
  const planByKeyAll = new Map<string, number>();
  for (const it of rows) {
    for (const m of it.monthlyPlan) {
      planByKeyAll.set(m.year_month, (planByKeyAll.get(m.year_month) ?? 0) + m.plan_amount);
    }
  }
  const execByKeyAll = new Map<string, number>();
  const seen = new Set<string>();
  for (const it of rows) {
    for (const p of it.projects) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      for (const m of p.monthly) {
        const k = execBucketKey(m.year_month, fiscalYear);
        if (k) execByKeyAll.set(k, (execByKeyAll.get(k) ?? 0) + m.amount);
      }
    }
  }

  return {
    fiscalYear,
    items,
    planTotal,
    planExec,
    monthly: buckets.map((b) => ({
      key: b.key,
      label: b.label,
      plan: planByKeyAll.get(b.key) ?? 0,
      exec: execByKeyAll.get(b.key) ?? 0,
    })),
  };
}
