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
  fetchHeadquarters,
  type ProjectWriteInput,
} from "@/lib/repositories/projects";
import {
  fetchDepartments,
  fetchPeople,
  fetchAiTechs,
} from "@/lib/repositories/masters";
import {
  setProjectPlanItem,
  fetchPlanItemOptions,
} from "@/lib/repositories/budget-plan";

export type FormActionResult = { error: string } | void;

/**
 * 편집 진입 시 ?from= 으로 넘어온 복귀 경로를 검증한다.
 * 오픈 리다이렉트 방지: 같은 사이트 내부 경로("/...")만 허용, "//"(프로토콜-상대)는 차단.
 */
function safeReturnTo(from: string | undefined, fallback: string): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return fallback;
}

function toWriteInput(v: ProjectFormValues): ProjectWriteInput {
  return {
    name: v.name,
    description: v.description?.trim() ? v.description.trim() : null,
    mprs: v.mprs,
    investmentType: v.investmentType,
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
    await setProjectPlanItem(id, parsed.data.budgetPlanItemId || null);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "과제 생성에 실패했습니다." };
  }

  revalidatePath("/");
  revalidatePath("/budget");
  // navful 화면(목록+드로어)으로 — 단독 상세 페이지는 상단 내비가 없어 갇히는 문제 회피
  redirect(`/projects?detail=${id}`);
}

/**
 * 모달(전체 팝업)용 과제 생성 — redirect 없이 결과만 반환.
 * 클라이언트가 모달을 닫고 배경 화면을 refresh 한다.
 */
export async function createProjectModalAction(
  values: ProjectFormValues,
): Promise<{ error: string } | { ok: true; id: string }> {
  const parsed = projectFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  let id: string;
  try {
    id = await createProject(toWriteInput(parsed.data));
    await setProjectPlanItem(id, parsed.data.budgetPlanItemId || null);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "과제 생성에 실패했습니다." };
  }
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/budget");
  return { ok: true, id };
}

/** 과제 폼 옵션 일괄 로드 (모달 오픈 시 호출) */
export async function loadProjectFormOptions() {
  const fiscalYear = new Date().getFullYear();
  const [headquarters, departments, people, aiTechs, planItems] =
    await Promise.all([
      fetchHeadquarters(),
      fetchDepartments(),
      fetchPeople(),
      fetchAiTechs(),
      fetchPlanItemOptions(fiscalYear),
    ]);
  return { headquarters, departments, people, aiTechs, planItems };
}

/** 과제 수정 → 성공 시 편집 진입 출처(returnTo)로 복귀, 없으면 상세로 이동 */
export async function updateProjectAction(
  id: string,
  values: ProjectFormValues,
  returnTo?: string,
): Promise<FormActionResult> {
  const parsed = projectFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  try {
    await updateProject(id, toWriteInput(parsed.data));
    await setProjectPlanItem(id, parsed.data.budgetPlanItemId || null);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "과제 수정에 실패했습니다." };
  }

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/budget");
  revalidatePath(`/projects/${id}`);
  redirect(safeReturnTo(returnTo, `/projects/${id}`));
}
