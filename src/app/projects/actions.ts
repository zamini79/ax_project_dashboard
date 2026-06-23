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
  fetchTags,
} from "@/lib/repositories/masters";
import {
  setProjectPlanItem,
  fetchPlanItemOptions,
} from "@/lib/repositories/budget-plan";
import {
  addProjectExecution,
  deleteProjectExecution,
} from "@/lib/repositories/budget";
import { setProjectEffectMembership } from "@/lib/repositories/effects";
import {
  uploadProjectAttachment,
  deleteProjectAttachment,
  fetchProjectAttachments,
  type ProjectAttachment,
} from "@/lib/repositories/attachments";

export type FormActionResult = { error: string } | void;

/**
 * 성과 현황(운영 효과) 등록 동기화.
 * 운영 단계 + "성과 현황 추가" 체크일 때만 등록, 그 외에는 해제(행 제거).
 */
async function syncEffectMembership(
  projectId: string,
  v: ProjectFormValues,
): Promise<void> {
  await setProjectEffectMembership(
    projectId,
    v.lifecycle === "operating" && v.addToPerformance,
  );
}

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
    tagIds: v.tagIds,
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
    await syncEffectMembership(id, parsed.data);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "과제 생성에 실패했습니다.",
    };
  }

  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/performance");
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
    await syncEffectMembership(id, parsed.data);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "과제 생성에 실패했습니다.",
    };
  }
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/budget");
  revalidatePath("/performance");
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
    await syncEffectMembership(id, parsed.data);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "과제 수정에 실패했습니다.",
    };
  }
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/budget");
  revalidatePath("/performance");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

/** 편집 모달용 — 현재 값(폼 형태) + 옵션 로드. 없으면 null */
export async function loadProjectEditData(id: string) {
  const edit = await fetchProjectEditData(id);
  if (!edit) return null;
  const options = await loadProjectFormOptions();
  const attachments = await fetchProjectAttachments(id);
  const values: ProjectFormValues = {
    name: edit.name,
    description: edit.description ?? "",
    mprs: edit.mprs,
    investmentType: edit.investment_type,
    headquarterId: edit.headquarter_id,
    lifecycle: edit.lifecycle,
    health: edit.health,
    addToPerformance: edit.hasEffect,
    startDate: edit.start_date ?? "",
    endDate: edit.end_date ?? "",
    budgetEok: wonToEok(edit.total_budget),
    progressPct: edit.progress_pct,
    pmIds: edit.pmIds,
    departmentIds: edit.departmentIds,
    aiTechIds: edit.aiTechIds,
    tagIds: edit.tagIds,
    budgetPlanItemId: edit.budgetPlanItemId,
  };
  return { values, options, executions: edit.executions, attachments };
}

/** 과제 폼 옵션 일괄 로드 (모달 오픈 시 호출) */
export async function loadProjectFormOptions() {
  const [headquarters, departments, people, aiTechs, tags, planItems] =
    await Promise.all([
      fetchHeadquarters(),
      fetchDepartments(),
      fetchPeople(),
      fetchAiTechs(),
      fetchTags(),
      fetchPlanItemOptions(),
    ]);
  return { headquarters, departments, people, aiTechs, tags, planItems };
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
    await syncEffectMembership(id, parsed.data);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "과제 수정에 실패했습니다.",
    };
  }

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/budget");
  revalidatePath("/performance");
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
): Promise<
  | { error: string }
  | { ok: true; entry: { id: string; year_month: string; amount: number } }
> {
  if (!YM_RE.test(yearMonth))
    return { error: "지급 시기(년/월)를 확인하세요." };
  if (!(amount > 0)) return { error: "금액을 입력하세요." };
  let entry: { id: string; year_month: string; amount: number };
  try {
    entry = await addProjectExecution(projectId, yearMonth, Math.round(amount));
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "집행 추가에 실패했습니다.",
    };
  }
  revalidateExecution(projectId);
  return { ok: true, entry };
}

/** 집행 1건 삭제 (행 id) */
export async function deleteExecutionAction(
  id: string,
  projectId: string,
): Promise<ExecutionActionResult> {
  try {
    await deleteProjectExecution(id);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "집행 삭제에 실패했습니다.",
    };
  }
  revalidateExecution(projectId);
  return { ok: true };
}

// ── 과제 첨부파일 ──

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB

/** 첨부 업로드 (FormData의 file) → 메타 반환 */
export async function uploadAttachmentAction(
  projectId: string,
  formData: FormData,
): Promise<{ ok: true; attachment: ProjectAttachment } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "파일을 선택하세요." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: "파일은 25MB 이하만 업로드할 수 있습니다." };
  }
  let attachment: ProjectAttachment;
  try {
    attachment = await uploadProjectAttachment(projectId, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "업로드에 실패했습니다." };
  }
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, attachment };
}

/** 첨부 삭제 */
export async function deleteAttachmentAction(
  id: string,
  projectId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await deleteProjectAttachment(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "삭제에 실패했습니다." };
  }
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
