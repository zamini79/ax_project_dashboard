import type { ProjectListItem } from "@/lib/repositories/projects";
import type { ProjectEffect } from "@/lib/repositories/effects";
import type { MonthlyExecution } from "@/lib/repositories/budget";
import { type Health, displayHealth } from "@/lib/domain/lifecycle";
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

  // 위험·주의 피드는 '표시용' 신호등 기준 — 일정은 정상이나 이슈가 있어
  // 주의로 승격된 과제도 포함해 표·카드의 신호등 색과 어긋나지 않게 한다.
  // (health 카운트·KPI 필터는 원본 health 기준 유지 — 집계 왜곡 방지)
  const atRisk = items
    .filter((i) => {
      const dh = displayHealth(i.health, i.attention_active);
      return dh === "red" || dh === "yellow";
    })
    .sort((a, b) => {
      const h =
        HEALTH_RANK[displayHealth(a.health, a.attention_active)] -
        HEALTH_RANK[displayHealth(b.health, b.attention_active)];
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
// 사용성 지표 기반 Biz Impact 요약 + 성과 KPI 합산
// ============================================

const MANWON = 10_000; // 1만원
const HOURLY_WON = 33_700; // 시간당 인건비 3.37만원 (산정기준 공통 전제)

export interface BizImpactSummary {
  projectCount: number;
  /** 누계 실측 절감효과(원) */
  cumulativeWon: number;
  /** 연환산 절감효과(원) — 관측 기간을 1년으로 환산 */
  annualizedWon: number;
  /** 연환산 절감시간(h/년) — unit_hours가 있는 과제만 */
  annualizedHours: number;
  /** 시간 환산이 가능한 과제 수 */
  hoursProjectCount: number;
  /** 단가 미정(효과 산정 전) 과제 수 */
  unpricedCount: number;
  /** 대상 과제 투자비 합(원) */
  budgetWon: number;
}

/**
 * 기간 실측치를 연 단위로 환산 (순수).
 * 관측 기간이 1년 이상이면 최근 1년 실적을, 미만이면 기간 평균 × 1년으로 환산한다.
 * (과제별 관측 기간이 21~46주로 달라 단순 합산은 연간 지표로 쓸 수 없음)
 */
function annualize(
  values: number[],
  periodsPerYear: number,
): number {
  if (values.length === 0) return 0;
  if (values.length >= periodsPerYear) {
    return values.slice(-periodsPerYear).reduce((a, v) => a + v, 0);
  }
  const sum = values.reduce((a, v) => a + v, 0);
  return (sum / values.length) * periodsPerYear;
}

/** 사용성 지표 기반 Biz Impact 요약 (순수). 금액은 만원→원으로 환산해 반환. */
export function bizImpactSummary(
  items: {
    unitHours: number | null;
    budgetWon: number | null;
    unitValueManwon: number | null;
    points: { periodKind: "week" | "month"; callCount: number; impactManwon: number }[];
  }[],
): BizImpactSummary {
  let cumulativeManwon = 0;
  let annualizedManwon = 0;
  let annualizedHours = 0;
  let hoursProjectCount = 0;
  let unpricedCount = 0;
  let budgetWon = 0;

  for (const it of items) {
    const perYear = it.points[0]?.periodKind === "month" ? 12 : 52;
    cumulativeManwon += it.points.reduce((a, p) => a + p.impactManwon, 0);
    annualizedManwon += annualize(
      it.points.map((p) => p.impactManwon),
      perYear,
    );
    if (it.unitHours != null) {
      const annualCalls = annualize(
        it.points.map((p) => p.callCount),
        perYear,
      );
      annualizedHours += annualCalls * it.unitHours;
      hoursProjectCount += 1;
    }
    if (it.unitValueManwon == null) unpricedCount += 1;
    budgetWon += it.budgetWon ?? 0;
  }

  return {
    projectCount: items.length,
    cumulativeWon: Math.round(cumulativeManwon * MANWON),
    annualizedWon: Math.round(annualizedManwon * MANWON),
    annualizedHours: Math.round(annualizedHours),
    hoursProjectCount,
    unpricedCount,
    budgetWon,
  };
}

export interface CombinedPerformanceKpi {
  /** 효과가 확인된 과제 수 (성과보고 ∪ 사용성 지표) */
  appliedCount: number;
  reportedCount: number;
  usageCount: number;
  /** 연간 절감비용(원) — 성과보고 + 사용성 지표 연환산 */
  annualSaveWon: number;
  /** 그중 사용성 지표 연환산분(원) */
  usageAnnualWon: number;
  /** 사용성 지표 누계 실측(원) */
  usageCumulativeWon: number;
  /** 월 업무시간 절감(h) — 성과보고 + 사용성 지표 환산 */
  monthlyHours: number;
  usageMonthlyHours: number;
  hoursProjectCount: number;
  /** 관련 투자비 합(원) */
  investWon: number;
  /** 연간 효과 / 관련 투자 (%) — 투자비 0이면 null */
  recoverPct: number | null;
  unpricedCount: number;
}

/**
 * 성과 현황 상단 KPI (순수) — 수기 성과보고와 사용성 지표를 한 화면 기준으로 합산.
 * 과제 중복(양쪽 모두 등록)은 projectId 기준으로 1건으로 센다.
 */
export function combinedPerformanceKpi(
  effects: EffectsSummary,
  effectProjectIds: string[],
  biz: BizImpactSummary,
  bizProjectIds: string[],
): CombinedPerformanceKpi {
  const union = new Set([...effectProjectIds, ...bizProjectIds]);
  const annualSaveWon = effects.totalSaveCostWon + biz.annualizedWon;
  const usageMonthlyHours = Math.round(biz.annualizedHours / 12);
  const investWon = effects.investAppliedWon + biz.budgetWon;

  return {
    appliedCount: union.size,
    reportedCount: effectProjectIds.length,
    usageCount: bizProjectIds.length,
    annualSaveWon,
    usageAnnualWon: biz.annualizedWon,
    usageCumulativeWon: biz.cumulativeWon,
    monthlyHours: effects.totalSaveHours + usageMonthlyHours,
    usageMonthlyHours,
    hoursProjectCount: biz.hoursProjectCount,
    investWon,
    recoverPct:
      investWon > 0 ? Math.round((annualSaveWon / investWon) * 100) : null,
    unpricedCount: biz.unpricedCount,
  };
}

/** 시간당 인건비 전제 (산정기준 표기용) */
export const BIZ_HOURLY_WON = HOURLY_WON;

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
