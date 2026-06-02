"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  projectFormSchema,
  eokToWon,
  type ProjectFormValues,
} from "@/lib/domain/project-form";
import {
  createProject,
  updateProject,
  type ProjectWriteInput,
} from "@/lib/repositories/projects";

export type FormActionResult = { error: string } | void;

function toWriteInput(v: ProjectFormValues): ProjectWriteInput {
  return {
    name: v.name,
    description: v.description?.trim() ? v.description.trim() : null,
    mprs: v.mprs,
    headquarterId: v.headquarterId,
    lifecycle: v.lifecycle,
    health: v.health,
    startDate: v.startDate || null,
    endDate: v.endDate || null,
    totalBudget: eokToWon(v.budgetEok),
    fte: v.fte ?? null,
    progressPct: v.progressPct,
    pmIds: v.pmIds,
    departmentIds: v.departmentIds,
    aiTechIds: v.aiTechIds,
  };
}

/** 과제 생성 → 성공 시 상세로 이동, 실패 시 에러 반환 */
export async function createProjectAction(
  values: ProjectFormValues,
): Promise<FormActionResult> {
  const parsed = projectFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  let id: string;
  try {
    id = await createProject(toWriteInput(parsed.data));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "과제 생성에 실패했습니다." };
  }

  revalidatePath("/");
  redirect(`/projects/${id}`);
}

/** 과제 수정 → 성공 시 상세로 이동 */
export async function updateProjectAction(
  id: string,
  values: ProjectFormValues,
): Promise<FormActionResult> {
  const parsed = projectFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  try {
    await updateProject(id, toWriteInput(parsed.data));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "과제 수정에 실패했습니다." };
  }

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}
