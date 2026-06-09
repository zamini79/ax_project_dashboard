"use server";

import { revalidatePath } from "next/cache";

import {
  createPlanItem,
  updatePlanItem,
  deletePlanItem,
  setItemProjects,
  setItemMonthlyPlan,
} from "@/lib/repositories/budget-plan";
import type { InvestmentType } from "@/lib/domain/investment";
import type { Mprs } from "@/lib/domain/mprs";

/** 사업계획 서버 액션 (D-031). 투자비 금액은 원 단위로 입력·저장. */

export type PlanActionResult = { error: string } | { ok: true };

export interface PlanItemForm {
  fiscalYear: number;
  name: string;
  planWon: number; // 원
  investmentType: InvestmentType | null;
  headquarterId: string | null;
  mprs: Mprs | null;
}

const toAttrs = (f: PlanItemForm) => ({
  fiscalYear: f.fiscalYear,
  name: f.name.trim(),
  planAmount: Math.round(f.planWon || 0),
  investmentType: f.investmentType,
  headquarterId: f.headquarterId,
  mprs: f.mprs,
});

export async function createPlanItemAction(
  form: PlanItemForm,
): Promise<PlanActionResult> {
  if (!form.name.trim()) return { error: "항목명(계획명)을 입력하세요." };
  try {
    await createPlanItem(toAttrs(form));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "항목 생성 실패" };
  }
  revalidatePath("/budget");
  return { ok: true };
}

export async function updatePlanItemAction(
  id: string,
  form: PlanItemForm,
): Promise<PlanActionResult> {
  if (!form.name.trim()) return { error: "항목명(계획명)을 입력하세요." };
  try {
    await updatePlanItem(id, toAttrs(form));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "항목 수정 실패" };
  }
  revalidatePath("/budget");
  return { ok: true };
}

export async function deletePlanItemAction(id: string): Promise<PlanActionResult> {
  try {
    await deletePlanItem(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "항목 삭제 실패" };
  }
  revalidatePath("/budget");
  return { ok: true };
}

export async function setItemProjectsAction(
  itemId: string,
  projectIds: string[],
): Promise<PlanActionResult> {
  try {
    await setItemProjects(itemId, projectIds);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "과제 매핑 실패" };
  }
  revalidatePath("/budget");
  return { ok: true };
}

export async function setItemMonthlyPlanAction(
  itemId: string,
  monthly: { year_month: string; won: number }[],
): Promise<PlanActionResult> {
  try {
    await setItemMonthlyPlan(
      itemId,
      monthly.map((m) => ({ year_month: m.year_month, plan_amount: Math.round(m.won || 0) })),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "월별 계획 저장 실패" };
  }
  revalidatePath("/budget");
  return { ok: true };
}
