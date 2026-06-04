import type { Enums } from "@/lib/supabase/types";

export type InvestmentType = Enums<"investment_type">;

/** 투자 유형 표시 순서 (AI / DT / IT / 보안 / 인프라) */
export const INVESTMENT_ORDER: readonly InvestmentType[] = [
  "ai",
  "dt",
  "it",
  "security",
  "infra",
] as const;

/** 한국어 라벨 */
export const INVESTMENT_LABEL: Record<InvestmentType, string> = {
  ai: "AI",
  dt: "DT",
  it: "IT",
  security: "보안",
  infra: "인프라",
};

export interface CapexByType {
  type: InvestmentType;
  label: string;
  plan_won: number;
  exec_won: number;
}

/**
 * 투자 유형별 CAPEX 집계 (계획=Σ투자비, 집행=Σ집행액).
 * 5개 유형을 항상 INVESTMENT_ORDER 순서로 반환(0 포함). DB·UI 무관 순수 함수.
 */
export function capexByInvestmentType(
  projects: {
    investment_type: InvestmentType;
    total_budget: number | null;
    executed_budget: number;
  }[],
): CapexByType[] {
  const plan = new Map<InvestmentType, number>();
  const exec = new Map<InvestmentType, number>();

  for (const p of projects) {
    plan.set(
      p.investment_type,
      (plan.get(p.investment_type) ?? 0) + (p.total_budget ?? 0),
    );
    exec.set(
      p.investment_type,
      (exec.get(p.investment_type) ?? 0) + p.executed_budget,
    );
  }

  return INVESTMENT_ORDER.map((type) => ({
    type,
    label: INVESTMENT_LABEL[type],
    plan_won: plan.get(type) ?? 0,
    exec_won: exec.get(type) ?? 0,
  }));
}
