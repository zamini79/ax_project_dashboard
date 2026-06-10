import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface MasterOption {
  id: string;
  name: string;
}

export interface PersonOption {
  id: string;
  name: string;
  email: string | null;
  department: string | null;
}

/** 부서 마스터 목록 (폼 셀렉트용) */
export async function fetchDepartments(): Promise<MasterOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(`부서 목록 조회 실패: ${error.message}`);
  return data ?? [];
}

/** 사람 마스터 목록 (+ 소속 부서명) */
export async function fetchPeople(): Promise<PersonOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, name, email, departments ( name )")
    .order("name", { ascending: true });
  if (error) throw new Error(`사람 목록 조회 실패: ${error.message}`);
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email ?? null,
    department:
      (p.departments as { name: string } | null)?.name ?? null,
  }));
}

/** AI기술 마스터 목록 */
export async function fetchAiTechs(): Promise<MasterOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_techs")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(`AI기술 목록 조회 실패: ${error.message}`);
  return data ?? [];
}

/** 속성(태그) 마스터 목록 — sort_order 우선, 그 안에서 이름순 */
export async function fetchTags(): Promise<MasterOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`속성 목록 조회 실패: ${error.message}`);
  return data ?? [];
}

// ── 관리 화면용 조회 (관계 id 포함, 프리필용) ──

export interface DepartmentAdmin {
  id: string;
  name: string;
  headquarter_id: string | null;
}

export interface PersonAdmin {
  id: string;
  name: string;
  email: string | null;
  department_id: string | null;
  position: string | null;
}

export async function fetchDepartmentsAdmin(): Promise<DepartmentAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, headquarter_id")
    .order("name", { ascending: true });
  if (error) throw new Error(`부서 조회 실패: ${error.message}`);
  return data ?? [];
}

export async function fetchPeopleAdmin(): Promise<PersonAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, name, email, department_id, position")
    .order("name", { ascending: true });
  if (error) throw new Error(`사람 조회 실패: ${error.message}`);
  return data ?? [];
}

// ============================================
// 마스터 CRUD (마스터 관리 화면)
// ============================================

/** 공용 입력 시그니처 (엔티티별로 필요한 필드만 사용) */
export interface MasterInput {
  name: string;
  email?: string | null;
  relationId?: string | null; // dept→headquarter, person→department
  position?: string | null; // person 직책
}

/** PostgREST 에러를 친절한 한국어로 변환 (중복/참조 제약) */
function writeError(
  error: { code?: string; message: string },
  fallback: string,
): Error {
  if (error.code === "23505") return new Error("이미 같은 이름이 있습니다.");
  if (error.code === "23503") return new Error("다른 데이터가 참조 중입니다.");
  return new Error(`${fallback}: ${error.message}`);
}

function deleteError(error: { code?: string; message: string }): Error {
  if (error.code === "23503") {
    return new Error("사용 중인 항목이라 삭제할 수 없습니다. (과제·담당 등에서 참조 중)");
  }
  return new Error(`삭제 실패: ${error.message}`);
}

// ── 본부 ──
export async function createHeadquarter(input: MasterInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("headquarters")
    .insert({ name: input.name });
  if (error) throw writeError(error, "본부 추가 실패");
}

export async function updateHeadquarter(
  id: string,
  input: MasterInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("headquarters")
    .update({ name: input.name })
    .eq("id", id);
  if (error) throw writeError(error, "본부 수정 실패");
}

export async function deleteHeadquarter(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("headquarters").delete().eq("id", id);
  if (error) throw deleteError(error);
}

// ── 부서 ──
export async function createDepartment(input: MasterInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .insert({ name: input.name, headquarter_id: input.relationId ?? null });
  if (error) throw writeError(error, "부서 추가 실패");
}

export async function updateDepartment(
  id: string,
  input: MasterInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({ name: input.name, headquarter_id: input.relationId ?? null })
    .eq("id", id);
  if (error) throw writeError(error, "부서 수정 실패");
}

export async function deleteDepartment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) throw deleteError(error);
}

// ── 사람 ──
export async function createPerson(input: MasterInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("people").insert({
    name: input.name,
    email: input.email?.trim() ? input.email.trim() : null,
    department_id: input.relationId ?? null,
    position: input.position?.trim() ? input.position.trim() : null,
  });
  if (error) throw writeError(error, "사람 추가 실패");
}

export async function updatePerson(
  id: string,
  input: MasterInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("people")
    .update({
      name: input.name,
      email: input.email?.trim() ? input.email.trim() : null,
      department_id: input.relationId ?? null,
      position: input.position?.trim() ? input.position.trim() : null,
    })
    .eq("id", id);
  if (error) throw writeError(error, "사람 수정 실패");
}

export async function deletePerson(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw deleteError(error);
}

// ── AI기술 ──
export async function createAiTech(input: MasterInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_techs").insert({ name: input.name });
  if (error) throw writeError(error, "AI기술 추가 실패");
}

export async function updateAiTech(
  id: string,
  input: MasterInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_techs")
    .update({ name: input.name })
    .eq("id", id);
  if (error) throw writeError(error, "AI기술 수정 실패");
}

export async function deleteAiTech(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_techs").delete().eq("id", id);
  if (error) throw deleteError(error);
}

// ── 속성(태그) ──
export async function createTag(input: MasterInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").insert({ name: input.name });
  if (error) throw writeError(error, "속성 추가 실패");
}

export async function updateTag(
  id: string,
  input: MasterInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tags")
    .update({ name: input.name })
    .eq("id", id);
  if (error) throw writeError(error, "속성 수정 실패");
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw deleteError(error);
}
