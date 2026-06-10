"use server";

import { revalidatePath } from "next/cache";

import {
  type MasterInput,
  createHeadquarter,
  updateHeadquarter,
  deleteHeadquarter,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createPerson,
  updatePerson,
  deletePerson,
  createAiTech,
  updateAiTech,
  deleteAiTech,
  createTag,
  updateTag,
  deleteTag,
} from "@/lib/repositories/masters";

export type MasterActionResult = { error?: string };

/** create/update 공용 결과 래퍼 */
async function run(fn: () => Promise<void>): Promise<MasterActionResult> {
  try {
    await fn();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "처리에 실패했습니다." };
  }
  revalidatePath("/masters");
  revalidatePath("/"); // KPI(본부별) 영향
  return {};
}

function validateName(input: MasterInput): string | null {
  return input.name.trim() ? null : "이름을 입력하세요.";
}

// ── 본부 ──
export async function createHeadquarterAction(input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => createHeadquarter({ ...input, name: input.name.trim() }));
}
export async function updateHeadquarterAction(id: string, input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => updateHeadquarter(id, { ...input, name: input.name.trim() }));
}
export async function deleteHeadquarterAction(id: string) {
  return run(() => deleteHeadquarter(id));
}

// ── 부서 ──
export async function createDepartmentAction(input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => createDepartment({ ...input, name: input.name.trim() }));
}
export async function updateDepartmentAction(id: string, input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => updateDepartment(id, { ...input, name: input.name.trim() }));
}
export async function deleteDepartmentAction(id: string) {
  return run(() => deleteDepartment(id));
}

// ── 사람 ──
export async function createPersonAction(input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => createPerson({ ...input, name: input.name.trim() }));
}
export async function updatePersonAction(id: string, input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => updatePerson(id, { ...input, name: input.name.trim() }));
}
export async function deletePersonAction(id: string) {
  return run(() => deletePerson(id));
}

// ── AI기술 ──
export async function createAiTechAction(input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => createAiTech({ ...input, name: input.name.trim() }));
}
export async function updateAiTechAction(id: string, input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => updateAiTech(id, { ...input, name: input.name.trim() }));
}
export async function deleteAiTechAction(id: string) {
  return run(() => deleteAiTech(id));
}

// ── 속성(태그) ──
export async function createTagAction(input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => createTag({ ...input, name: input.name.trim() }));
}
export async function updateTagAction(id: string, input: MasterInput) {
  const err = validateName(input);
  if (err) return { error: err };
  return run(() => updateTag(id, { ...input, name: input.name.trim() }));
}
export async function deleteTagAction(id: string) {
  return run(() => deleteTag(id));
}
