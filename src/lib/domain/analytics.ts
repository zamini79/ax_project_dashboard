import type { ProjectListItem } from "@/lib/repositories/projects";
import type { ProjectEffect } from "@/lib/repositories/effects";
import type { MonthlyExecution } from "@/lib/repositories/budget";
import { type Health } from "@/lib/domain/lifecycle";
import { type Mprs, MPRS_ORDER } from "@/lib/domain/mprs";

/**
 * 지정 연도의 1~12월 집행 시계열 (순수).
 * 데이터가 있는 달은 그대로, 실적이 없는 달은 amount 0 · projects [] 로 채운다.
 * 월별 집행 추이 막대에서 당해년도 12개월을 모두 표시하기 위함.
 */
export function monthlyExecutionForYear(
  monthly: MonthlyExecution[],
  year: number,
): MonthlyExecution[] {
  const byYm = new Map(monthly.map((m) => [m.year_month, m]));
  return Array.from({ length: 12 }, (_, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
    return byYm.get(ym) ?? { year_month: ym, amount: 0, projects: [] };
  });
}

// ============================================
// 성과 현황 요약 (진행 기반 — 정량 효과지표는 데이터 모델 확장 후 고도화)
// ============================================

export interface PerformanceSummary {
  total: number;
  completed: number;
  inProgress: number;
  completedRate: number; // %
  avgProgress: number; // %
  health: Record<Health, number>;
  atRisk: ProjectListItem[]; // 위험/주의 (red→yellow), 진행 더딘 순
}

const HEALTH_RANK: Record<Health, number> = {
  red: 0,
  yellow: 1,
  green: 2,
  completed: 3,
  none: 4,
};

export function performanceSummary(
  items: ProjectListItem[],
): PerformanceSummary {
  const total = items.length;
  const completed = items.filter((i) => i.lifecycle === "completed").length;
  const inProgress = items.filter((i) => i.lifecycle === "in_progress").length;
  const health: Record<Health, number> = {
    green: 0,
    yellow: 0,
    red: 0,
    completed: 0,
    none: 0,
  };
  let progressSum = 0;
  for (const i of items) {
    health[i.health] += 1;
    progressSum += i.progress_pct;
  }

  const atRisk = items
    .filter((i) => i.health === "red" || i.health === "yellow")
    .sort((a, b) => {
      const h = HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
      if (h !== 0) return h;
      return a.progress_pct - b.progress_pct; // 더딘 과제 먼저
    });

  return {
    total,
    completed,
    inProgress,
    completedRate: total ? Math.round((completed / total) * 100) : 0,
    avgProgress: total ? Math.round(progressSum / total) : 0,
    health,
    atRisk,
  };
}

// ============================================
// 성과(운영 효과) 요약
// ============================================

export interface EffectsSummary {
  appliedCount: number;
  operatingCount: number; // 정식 운영
  pilotCount: number;
  totalSaveCostWon: number; // 연간 절감비용 합(원)
  totalSaveHours: number; // 월 절감시간 합
  investAppliedWon: number; // 효과 발생 과제의 관련 투자비 합(원)
  items: ProjectEffect[];
}

export function effectsSummary(effects: ProjectEffect[]): EffectsSummary {
  return {
    appliedCount: effects.length,
    operatingCount: effects.filter((e) => !e.isPilot).length,
    pilotCount: effects.filter((e) => e.isPilot).length,
    totalSaveCostWon: effects.reduce((a, e) => a + e.saveCostWon, 0),
    totalSaveHours: effects.reduce((a, e) => a + e.saveHoursMonth, 0),
    investAppliedWon: effects.reduce((a, e) => a + (e.budgetWon ?? 0), 0),
    items: effects,
  };
}

// ============================================
// 투자비 현황 요약
// ============================================

export interface BudgetBucket {
  key: string;
  label: string;
  budget: number;
  executed: number;
  rate: number | null; // %
}

export interface BudgetSummary {
  totalBudget: number;
  totalExecuted: number;
  rate: number | null;
  byMprs: BudgetBucket[];
  byHeadquarter: BudgetBucket[];
  topExecuted: ProjectListItem[];
}

function rateOf(budget: number, executed: number): number | null {
  return budget > 0 ? Math.round((executed / budget) * 100) : null;
}

export function budgetSummary(items: ProjectListItem[]): BudgetSummary {
  let totalBudget = 0;
  let totalExecuted = 0;

  const mprsMap = new Map<Mprs, { budget: number; executed: number }>();
  const hqMap = new Map<string, { budget: number; executed: number }>();

  for (const i of items) {
    const b = i.total_budget ?? 0;
    const e = i.executed_budget;
    totalBudget += b;
    totalExecuted += e;

    const m = mprsMap.get(i.mprs) ?? { budget: 0, executed: 0 };
    m.budget += b;
    m.executed += e;
    mprsMap.set(i.mprs, m);

    const h = hqMap.get(i.headquarter_name) ?? { budget: 0, executed: 0 };
    h.budget += b;
    h.executed += e;
    hqMap.set(i.headquarter_name, h);
  }

  const byMprs: BudgetBucket[] = MPRS_ORDER.map((key) => {
    const v = mprsMap.get(key) ?? { budget: 0, executed: 0 };
    return { key, label: key, budget: v.budget, executed: v.executed, rate: rateOf(v.budget, v.executed) };
  });

  const byHeadquarter: BudgetBucket[] = [...hqMap.entries()]
    .map(([name, v]) => ({
      key: name,
      label: name,
      budget: v.budget,
      executed: v.executed,
      rate: rateOf(v.budget, v.executed),
    }))
    .sort((a, b) => b.budget - a.budget);

  const topExecuted = [...items]
    .filter((i) => i.executed_budget > 0 || (i.total_budget ?? 0) > 0)
    .sort((a, b) => b.executed_budget - a.executed_budget)
    .slice(0, 8);

  return {
    totalBudget,
    totalExecuted,
    rate: rateOf(totalBudget, totalExecuted),
    byMprs,
    byHeadquarter,
    topExecuted,
  };
}
