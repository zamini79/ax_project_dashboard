import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { InvestmentType } from "@/lib/domain/investment";
import type { Mprs } from "@/lib/domain/mprs";

/**
 * 투자비 사업계획 저장소 (D-031). ★ Supabase 호출은 repositories/ 에만 (D-014).
 * 계획은 수기 입력, 집행은 매핑된 과제의 project_budget_monthly에서 자동 산출.
 */

export interface PlanItemProject {
  id: string;
  name: string;
  monthly: { year_month: string; amount: number }[];
}

export interface PlanItemRow {
  id: string;
  name: string;
  plan_amount: number;
  sort: number;
  investment_type: InvestmentType | null;
  headquarter_id: string | null;
  headquarter_name: string | null;
  mprs: Mprs | null;
  projects: PlanItemProject[];
  monthlyPlan: { year_month: string; plan_amount: number }[];
}

interface RawPlanItem {
  id: string;
  name: string;
  plan_amount: number;
  sort: number;
  investment_type: InvestmentType | null;
  headquarter_id: string | null;
  mprs: Mprs | null;
  headquarters: { name: string } | null;
  budget_plan_item_projects: {
    project_id: string;
    projects: {
      name: string;
      project_budget_monthly: { year_month: string; amount: number }[];
    } | null;
  }[];
  budget_plan_item_monthly: { year_month: string; plan_amount: number }[];
}

const PLAN_SELECT = `
  id, name, plan_amount, sort, investment_type, headquarter_id, mprs,
  headquarters ( name ),
  budget_plan_item_projects (
    project_id,
    projects ( name, project_budget_monthly ( year_month, amount ) )
  ),
  budget_plan_item_monthly ( year_month, plan_amount )
` as const;

/** 연도별 사업계획 항목 + 매핑 과제(+월별 집행) + 월별 계획 */
export async function fetchBudgetPlanItems(
  fiscalYear: number,
): Promise<PlanItemRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_plan_items")
    .select(PLAN_SELECT)
    .eq("fiscal_year", fiscalYear)
    .order("sort", { ascending: true })
    .returns<RawPlanItem[]>();

  if (error) throw new Error(`사업계획 조회 실패: ${error.message}`);

  return (data ?? []).map((it) => ({
    id: it.id,
    name: it.name,
    plan_amount: it.plan_amount,
    sort: it.sort,
    investment_type: it.investment_type,
    headquarter_id: it.headquarter_id,
    headquarter_name: it.headquarters?.name ?? null,
    mprs: it.mprs,
    projects: (it.budget_plan_item_projects ?? [])
      .filter((p) => p.projects != null)
      .map((p) => ({
        id: p.project_id,
        name: p.projects!.name,
        monthly: (p.projects!.project_budget_monthly ?? []).map((m) => ({
          year_month: m.year_month,
          amount: m.amount ?? 0,
        })),
      })),
    monthlyPlan: (it.budget_plan_item_monthly ?? []).map((m) => ({
      year_month: m.year_month,
      plan_amount: m.plan_amount ?? 0,
    })),
  }));
}

/** 과제 폼용 — 연도별 사업계획 항목 옵션(id, name) */
export async function fetchPlanItemOptions(
  fiscalYear: number,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_plan_items")
    .select("id, name")
    .eq("fiscal_year", fiscalYear)
    .order("sort", { ascending: true });
  if (error) throw new Error(`사업계획 옵션 조회 실패: ${error.message}`);
  return data ?? [];
}

/**
 * 과제의 사업계획 매핑 설정 (과제 1개 ↔ 사업계획 항목 1개).
 * 기존 매핑 모두 제거 후, itemId가 있으면 새로 연결. null = 사업계획 외 과제.
 */
export async function setProjectPlanItem(
  projectId: string,
  itemId: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("budget_plan_item_projects")
    .delete()
    .eq("project_id", projectId);
  if (delErr) throw new Error(`사업계획 매핑 갱신 실패: ${delErr.message}`);

  if (itemId) {
    const { error: insErr } = await supabase
      .from("budget_plan_item_projects")
      .insert({ item_id: itemId, project_id: projectId });
    if (insErr) throw new Error(`사업계획 매핑 저장 실패: ${insErr.message}`);
  }
}

export interface PlanItemAttrs {
  name: string;
  planAmount: number; // 원
  investmentType: InvestmentType | null;
  headquarterId: string | null;
  mprs: Mprs | null;
}

function attrColumns(a: PlanItemAttrs) {
  return {
    name: a.name,
    plan_amount: a.planAmount,
    investment_type: a.investmentType,
    headquarter_id: a.headquarterId,
    mprs: a.mprs,
  };
}

/** 항목 생성 → id 반환 */
export async function createPlanItem(
  input: PlanItemAttrs & { fiscalYear: number },
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_plan_items")
    .insert({ fiscal_year: input.fiscalYear, ...attrColumns(input) })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`사업계획 항목 생성 실패: ${error?.message ?? "알 수 없음"}`);
  }
  return data.id;
}

/** 항목 수정 (속성) */
export async function updatePlanItem(
  id: string,
  patch: PlanItemAttrs,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_plan_items")
    .update(attrColumns(patch))
    .eq("id", id);
  if (error) throw new Error(`사업계획 항목 수정 실패: ${error.message}`);
}

/** 항목 삭제 (매핑·월별계획은 ON DELETE CASCADE) */
export async function deletePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_plan_items")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`사업계획 항목 삭제 실패: ${error.message}`);
}

/** 항목의 과제 매핑 교체 (delete 후 insert) */
export async function setItemProjects(
  itemId: string,
  projectIds: string[],
): Promise<void> {
  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("budget_plan_item_projects")
    .delete()
    .eq("item_id", itemId);
  if (delErr) throw new Error(`과제 매핑 갱신 실패: ${delErr.message}`);

  if (projectIds.length > 0) {
    const { error: insErr } = await supabase
      .from("budget_plan_item_projects")
      .insert(projectIds.map((project_id) => ({ item_id: itemId, project_id })));
    if (insErr) throw new Error(`과제 매핑 저장 실패: ${insErr.message}`);
  }
}

/** 항목의 월별 계획 교체 (delete 후 insert) */
export async function setItemMonthlyPlan(
  itemId: string,
  monthly: { year_month: string; plan_amount: number }[],
): Promise<void> {
  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("budget_plan_item_monthly")
    .delete()
    .eq("item_id", itemId);
  if (delErr) throw new Error(`월별 계획 갱신 실패: ${delErr.message}`);

  const rows = monthly.filter((m) => m.plan_amount > 0);
  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from("budget_plan_item_monthly")
      .insert(rows.map((m) => ({ item_id: itemId, ...m })));
    if (insErr) throw new Error(`월별 계획 저장 실패: ${insErr.message}`);
  }
}
