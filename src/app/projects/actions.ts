"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  projectFormSchema,
  eokToWon,
  wonToEok,
  type ProjectFormValues,
} from "@/lib/domain/project-form";
import {
  createProject,
  updateProject,
  fetchHeadquarters,
  fetchProjectEditData,
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
import {
  addProjectExecution,
  deleteProjectExecution,
} from "@/lib/repositories/budget";

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

/** 모달(전체 팝업)용 과제 수정 — redirect 없이 결과만 반환. */
export async function updateProjectModalAction(
  id: string,
  values: ProjectFormValues,
): Promise<{ error: string } | { ok: true }> {
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
  return { ok: true };
}

/** 편집 모달용 — 현재 값(폼 형태) + 옵션 로드. 없으면 null */
export async function loadProjectEditData(id: string) {
  const edit = await fetchProjectEditData(id);
  if (!edit) return null;
  const options = await loadProjectFormOptions();
  const values: ProjectFormValues = {
    name: edit.name,
    description: edit.description ?? "",
    mprs: edit.mprs,
    investmentType: edit.investment_type,
    headquarterId: edit.headquarter_id,
    lifecycle: edit.lifecycle,
    health: edit.health,
    startDate: edit.start_date ?? "",
    endDate: edit.end_date ?? "",
    budgetEok: wonToEok(edit.total_budget),
    progressPct: edit.progress_pct,
    pmIds: edit.pmIds,
    departmentIds: edit.departmentIds,
    aiTechIds: edit.aiTechIds,
    budgetPlanItemId: edit.budgetPlanItemId,
  };
  return { values, options };
}

/** 과제 폼 옵션 일괄 로드 (모달 오픈 시 호출) */
export async function loadProjectFormOptions() {
  const [headquarters, departments, people, aiTechs, planItems] =
    await Promise.all([
      fetchHeadquarters(),
      fetchDepartments(),
      fetchPeople(),
      fetchAiTechs(),
      fetchPlanItemOptions(),
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

// ── 과제 집행(지급) 실적 ──

export type ExecutionActionResult = { error: string } | { ok: true };

function revalidateExecution(projectId: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/budget");
  revalidatePath("/performance");
  revalidatePath(`/projects/${projectId}`);
}

const YM_RE = /^\d{4}-\d{2}$/;

/** 집행 1건 추가 (비정기 지급). yearMonth='YYYY-MM', amount=원 */
export async function addExecutionAction(
  projectId: string,
  yearMonth: string,
  amount: number,
): Promise<ExecutionActionResult> {
  if (!YM_RE.test(yearMonth)) return { error: "지급 시기(년/월)를 확인하세요." };
  if (!(amount > 0)) return { error: "금액을 입력하세요." };
  try {
    await addProjectExecution(projectId, yearMonth, Math.round(amount));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "집행 추가에 실패했습니다." };
  }
  revalidateExecution(projectId);
  return { ok: true };
}

/** 집행 1건 삭제 (행 id) */
export async function deleteExecutionAction(
  id: string,
  projectId: string,
): Promise<ExecutionActionResult> {
  try {
    await deleteProjectExecution(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "집행 삭제에 실패했습니다." };
  }
  revalidateExecution(projectId);
  return { ok: true };
}
