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

/** 과제 집행(지급) 1건 추가 — 비정기, 같은 달 다건 허용. yearMonth: 'YYYY-MM', amount: 원 */
export async function addProjectExecution(
  projectId: string,
  yearMonth: string,
  amount: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_budget_monthly")
    .insert({ project_id: projectId, year_month: yearMonth, amount });
  if (error) throw new Error(`집행 실적 추가 실패: ${error.message}`);
}

/** 과제 집행(지급) 1건 삭제 (행 id 기준) */
export async function deleteProjectExecution(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_budget_monthly")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`집행 실적 삭제 실패: ${error.message}`);
}
