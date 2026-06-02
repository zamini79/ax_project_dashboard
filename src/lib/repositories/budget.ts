import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface MonthlyExecution {
  year_month: string; // "YYYY-MM"
  amount: number; // 원
}

/**
 * 전체 과제 월별 집행액 합계 (year_month 기준 집계, 오름차순).
 * ★ Supabase 호출은 repositories/ 에만 (D-014). 집계는 행 수가 적어 JS에서 처리.
 */
export async function fetchMonthlyExecution(): Promise<MonthlyExecution[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_budget_monthly")
    .select("year_month, amount");

  if (error) throw new Error(`월별 집행 조회 실패: ${error.message}`);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.year_month, (map.get(row.year_month) ?? 0) + (row.amount ?? 0));
  }

  return [...map.entries()]
    .map(([year_month, amount]) => ({ year_month, amount }))
    .sort((a, b) => (a.year_month < b.year_month ? -1 : 1));
}

export interface CapexItem {
  id: string;
  category: string;
  plan_won: number;
  exec_won: number;
  sort: number;
}

/** CAPEX 항목별 계획/집행 (sort 순) */
export async function fetchCapexItems(): Promise<CapexItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("capex_items")
    .select("id, category, plan_won, exec_won, sort")
    .order("sort", { ascending: true });
  if (error) throw new Error(`CAPEX 항목 조회 실패: ${error.message}`);
  return data ?? [];
}
