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

/** 사업계획 서버 액션 (D-031). 화면은 억 단위 입력 → 저장은 원 단위. */

const EOK = 100_000_000;
const toWon = (eok: number) => Math.round((eok || 0) * EOK);

export type PlanActionResult = { error: string } | { ok: true };

export interface PlanItemForm {
  name: string;
  planEok: number;
  investmentType: InvestmentType | null;
  headquarterId: string | null;
  mprs: Mprs | null;
}

const toAttrs = (f: PlanItemForm) => ({
  name: f.name.trim(),
  planAmount: toWon(f.planEok),
  investmentType: f.investmentType,
  headquarterId: f.headquarterId,
  mprs: f.mprs,
});

export async function createPlanItemAction(
  fiscalYear: number,
  form: PlanItemForm,
): Promise<PlanActionResult> {
  if (!form.name.trim()) return { error: "항목명(계획명)을 입력하세요." };
  try {
    await createPlanItem({ fiscalYear, ...toAttrs(form) });
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
  monthly: { year_month: string; eok: number }[],
): Promise<PlanActionResult> {
  try {
    await setItemMonthlyPlan(
      itemId,
      monthly.map((m) => ({ year_month: m.year_month, plan_amount: toWon(m.eok) })),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "월별 계획 저장 실패" };
  }
  revalidatePath("/budget");
  return { ok: true };
}
