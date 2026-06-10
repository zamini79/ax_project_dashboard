import "server-only";

import { createClient } from "@/lib/supabase/server";

/** 월별 집행에 기여한 과제별 합계 (해당 월 한정) */
export interface MonthlyExecutionProject {
  id: string;
  name: string;
  amount: number; // 원
}

export interface MonthlyExecution {
  year_month: string; // "YYYY-MM"
  amount: number; // 원
  /** 해당 월 집행 과제별 합계 — 금액 내림차순 (막대 호버 팝업용) */
  projects: MonthlyExecutionProject[];
}

/**
 * 전체 과제 월별 집행액 합계 (year_month 기준 집계, 오름차순).
 * 월별 합계와 함께 해당 월에 기여한 과제별 합계도 반환 (막대 호버 팝업용).
 * ★ Supabase 호출은 repositories/ 에만 (D-014). 집계는 행 수가 적어 JS에서 처리.
 */
export async function fetchMonthlyExecution(): Promise<MonthlyExecution[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_budget_monthly")
    .select("year_month, amount, project_id, projects(name)");

  if (error) throw new Error(`월별 집행 조회 실패: ${error.message}`);

  // 월 → { 합계, 과제id → { 과제명, 합계 } }
  const months = new Map<
    string,
    { amount: number; projects: Map<string, MonthlyExecutionProject> }
  >();
  for (const row of data ?? []) {
    const amt = row.amount ?? 0;
    let m = months.get(row.year_month);
    if (!m) {
      m = { amount: 0, projects: new Map() };
      months.set(row.year_month, m);
    }
    m.amount += amt;

    if (row.project_id) {
      const prev = m.projects.get(row.project_id);
      if (prev) {
        prev.amount += amt;
      } else {
        m.projects.set(row.project_id, {
          id: row.project_id,
          name: row.projects?.name ?? "(이름 없음)",
          amount: amt,
        });
      }
    }
  }

  return [...months.entries()]
    .map(([year_month, m]) => ({
      year_month,
      amount: m.amount,
      projects: [...m.projects.values()].sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => (a.year_month < b.year_month ? -1 : 1));
}

/** 과제 집행(지급) 1건 추가 — 비정기, 같은 달 다건 허용. yearMonth: 'YYYY-MM', amount: 원 */
export async function addProjectExecution(
  projectId: string,
  yearMonth: string,
  amount: number,
): Promise<{ id: string; year_month: string; amount: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_budget_monthly")
    .insert({ project_id: projectId, year_month: yearMonth, amount })
    .select("id, year_month, amount")
    .single();
  if (error || !data) {
    throw new Error(`집행 실적 추가 실패: ${error?.message ?? "알 수 없음"}`);
  }
  return data;
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
