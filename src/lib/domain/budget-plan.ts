import type { PlanItemRow } from "@/lib/repositories/budget-plan";
import type { InvestmentType } from "@/lib/domain/investment";
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
  investmentType: InvestmentType | null;
  headquarterId: string | null;
  headquarterName: string | null;
  mprs: Mprs | null;
  planWon: number;
  execWon: number;
  rate: number; // 집행률 %
  projectIds: string[];
  projectNames: string[];
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
      investmentType: it.investment_type,
      headquarterId: it.headquarter_id,
      headquarterName: it.headquarter_name,
      mprs: it.mprs,
      planWon: it.plan_amount,
      execWon,
      rate: rateOf(execWon, it.plan_amount),
      projectIds: it.projects.map((p) => p.id),
      projectNames: it.projects.map((p) => p.name),
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
