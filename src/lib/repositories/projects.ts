import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Lifecycle, Health } from "@/lib/domain/lifecycle";
import type { Mprs } from "@/lib/domain/mprs";
import type { InvestmentType } from "@/lib/domain/investment";
import type { Enums } from "@/lib/supabase/types";

export type UpdateSource = Enums<"update_source">;
export type PageRole = Enums<"confluence_page_role">;

/**
 * 대시보드 카드/목록용 과제 표현.
 * DB row를 화면 친화 형태로 평탄화한 결과 (조인 결과 포함).
 * ★ Supabase 호출은 이 파일(repositories/)에만 존재 — 포터빌리티 철칙 (D-014).
 */
export interface ProjectListItem {
  id: string;
  name: string;
  mprs: Mprs;
  investment_type: InvestmentType;
  lifecycle: Lifecycle;
  health: Health;
  progress_pct: number;
  start_date: string | null;
  end_date: string | null;
  total_budget: number | null;
  headquarter_id: string;
  headquarter_name: string;
  pms: { name: string; department: string | null }[];
  ai_techs: string[];
  tags: string[];
  executed_budget: number;
  last_update_date: string | null;
}

export interface Headquarter {
  id: string;
  name: string;
}

/** PostgREST 중첩 select 결과의 원시 형태 (매핑 전) */
interface RawProjectRow {
  id: string;
  name: string;
  mprs: Mprs;
  investment_type: InvestmentType;
  lifecycle: Lifecycle;
  health: Health;
  progress_pct: number;
  start_date: string | null;
  end_date: string | null;
  total_budget: number | null;
  headquarter_id: string;
  headquarters: { name: string } | null;
  project_pms: {
    people: { name: string; departments: { name: string } | null } | null;
  }[];
  project_updates: { update_date: string }[];
  project_budget_monthly: { amount: number }[];
  project_ai_techs: { ai_techs: { name: string } | null }[];
  project_tags: { tags: { name: string } | null }[];
}

const PROJECT_SELECT = `
  id, name, mprs, investment_type, lifecycle, health, progress_pct,
  start_date, end_date, total_budget, headquarter_id,
  headquarters ( name ),
  project_pms ( people ( name, departments ( name ) ) ),
  project_ai_techs ( ai_techs ( name ) ),
  project_tags ( tags ( name ) ),
  project_updates ( update_date ),
  project_budget_monthly ( amount )
` as const;

/**
 * 비-아카이브 과제 전체를 카드/KPI 산출에 필요한 조인과 함께 조회.
 * 정렬·필터·집계는 domain/ 순수 함수에서 처리 (여기선 raw 데이터 + 평탄화만).
 */
export async function fetchProjectList(): Promise<ProjectListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("is_archived", false)
    .returns<RawProjectRow[]>();

  if (error) {
    throw new Error(`과제 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(mapRowToItem);
}

function mapRowToItem(row: RawProjectRow): ProjectListItem {
  const pms = (row.project_pms ?? [])
    .map((pm) => pm.people)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({ name: p.name, department: p.departments?.name ?? null }));

  const executed_budget = (row.project_budget_monthly ?? []).reduce(
    (sum, b) => sum + (b.amount ?? 0),
    0,
  );

  const last_update_date =
    (row.project_updates ?? [])
      .map((u) => u.update_date)
      .sort()
      .at(-1) ?? null;

  const ai_techs = (row.project_ai_techs ?? [])
    .map((t) => t.ai_techs?.name)
    .filter((n): n is string => n != null);

  const tags = (row.project_tags ?? [])
    .map((t) => t.tags?.name)
    .filter((n): n is string => n != null);

  return {
    id: row.id,
    name: row.name,
    mprs: row.mprs,
    investment_type: row.investment_type,
    lifecycle: row.lifecycle,
    health: row.health,
    progress_pct: row.progress_pct,
    start_date: row.start_date,
    end_date: row.end_date,
    total_budget: row.total_budget,
    headquarter_id: row.headquarter_id,
    headquarter_name: row.headquarters?.name ?? "-",
    pms,
    ai_techs,
    tags,
    executed_budget,
    last_update_date,
  };
}

/** 본부 마스터 전체 (KPI "본부별 과제" 블록은 과제 0건 본부도 표시해야 함) */
export async function fetchHeadquarters(): Promise<Headquarter[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("headquarters")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`본부 목록 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

// ============================================
// 과제 상세 (D-024 / §7.3)
// ============================================

export interface ProjectUpdateItem {
  id: string;
  update_date: string;
  content: string;
  source: UpdateSource;
  source_url: string | null;
  author_name: string | null;
  page_role: PageRole | null;
  page_title: string | null;
  created_at: string;
}

export interface ProjectConnectedPage {
  id: string;
  title: string | null;
  page_role: PageRole;
  confluence_page_id: string;
  is_active: boolean;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  mprs: Mprs;
  investment_type: InvestmentType;
  lifecycle: Lifecycle;
  health: Health;
  progress_pct: number;
  start_date: string | null;
  end_date: string | null;
  total_budget: number | null;
  last_synced_at: string | null;
  headquarter_name: string;
  pms: { name: string; department: string | null }[];
  stakeholders: { department: string; person: string | null }[];
  ai_techs: string[];
  tags: string[];
  executed_budget: number;
  monthly: { id: string; year_month: string; amount: number }[];
  pages: ProjectConnectedPage[];
  updates: ProjectUpdateItem[];
}

interface RawDetailRow {
  id: string;
  name: string;
  description: string | null;
  mprs: Mprs;
  investment_type: InvestmentType;
  lifecycle: Lifecycle;
  health: Health;
  progress_pct: number;
  start_date: string | null;
  end_date: string | null;
  total_budget: number | null;
  last_synced_at: string | null;
  headquarters: { name: string } | null;
  project_pms: {
    people: { name: string; departments: { name: string } | null } | null;
  }[];
  project_stakeholders: {
    departments: { name: string } | null;
    people: { name: string } | null;
  }[];
  project_ai_techs: { ai_techs: { name: string } | null }[];
  project_tags: { tags: { name: string } | null }[];
  project_budget_monthly: { id: string; year_month: string; amount: number }[];
  project_confluence_pages: {
    id: string;
    title: string | null;
    page_role: PageRole;
    confluence_page_id: string;
    is_active: boolean;
  }[];
  project_updates: {
    id: string;
    update_date: string;
    content: string;
    source: UpdateSource;
    source_url: string | null;
    created_at: string;
    author: { name: string } | null;
    source_page: { page_role: PageRole; title: string | null } | null;
  }[];
}

const DETAIL_SELECT = `
  id, name, description, mprs, investment_type, lifecycle, health, progress_pct,
  start_date, end_date, total_budget, last_synced_at,
  headquarters ( name ),
  project_pms ( people ( name, departments ( name ) ) ),
  project_stakeholders ( departments ( name ), people ( name ) ),
  project_ai_techs ( ai_techs ( name ) ),
  project_tags ( tags ( name ) ),
  project_budget_monthly ( id, year_month, amount ),
  project_confluence_pages ( id, title, page_role, confluence_page_id, is_active ),
  project_updates (
    id, update_date, content, source, source_url, created_at,
    author:people!project_updates_author_id_fkey ( name ),
    source_page:project_confluence_pages!project_updates_source_page_id_fkey ( page_role, title )
  )
` as const;

/**
 * 과제 1건의 모든 상세 정보 + 업데이트 타임라인 조회.
 * 없거나 아카이브면 null (호출부에서 notFound 처리).
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchProjectDetail(
  id: string,
): Promise<ProjectDetail | null> {
  // UUID가 아니면 DB 조회 없이 없음 처리 (잘못된 경로 방어)
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .eq("is_archived", false)
    .maybeSingle<RawDetailRow>();

  if (error) {
    throw new Error(`과제 상세 조회 실패: ${error.message}`);
  }
  if (!data) return null;

  const pms = (data.project_pms ?? [])
    .map((pm) => pm.people)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({ name: p.name, department: p.departments?.name ?? null }));

  const stakeholders = (data.project_stakeholders ?? [])
    .filter((s) => s.departments != null)
    .map((s) => ({
      department: s.departments!.name,
      person: s.people?.name ?? null,
    }));

  const ai_techs = (data.project_ai_techs ?? [])
    .map((t) => t.ai_techs?.name)
    .filter((n): n is string => n != null);

  const tags = (data.project_tags ?? [])
    .map((t) => t.tags?.name)
    .filter((n): n is string => n != null);

  const monthly = (data.project_budget_monthly ?? [])
    .map((m) => ({ id: m.id, year_month: m.year_month, amount: m.amount }))
    .sort((a, b) => (a.year_month < b.year_month ? -1 : 1));

  const executed_budget = monthly.reduce((sum, m) => sum + (m.amount ?? 0), 0);

  const pages = (data.project_confluence_pages ?? []).filter((p) => p.is_active);

  // 타임라인: update_date DESC, 동률이면 created_at DESC
  const updates: ProjectUpdateItem[] = (data.project_updates ?? [])
    .map((u) => ({
      id: u.id,
      update_date: u.update_date,
      content: u.content,
      source: u.source,
      source_url: u.source_url,
      author_name: u.author?.name ?? null,
      page_role: u.source_page?.page_role ?? null,
      page_title: u.source_page?.title ?? null,
      created_at: u.created_at,
    }))
    .sort((a, b) => {
      if (a.update_date !== b.update_date)
        return a.update_date < b.update_date ? 1 : -1;
      return a.created_at < b.created_at ? 1 : -1;
    });

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    mprs: data.mprs,
    investment_type: data.investment_type,
    lifecycle: data.lifecycle,
    health: data.health,
    progress_pct: data.progress_pct,
    start_date: data.start_date,
    end_date: data.end_date,
    total_budget: data.total_budget,
    last_synced_at: data.last_synced_at,
    headquarter_name: data.headquarters?.name ?? "-",
    pms,
    stakeholders,
    ai_techs,
    tags,
    executed_budget,
    monthly,
    pages,
    updates,
  };
}

// ============================================
// 과제 생성 / 수정 (D-029 — 기존 마스터 선택)
// ============================================

export interface ProjectWriteInput {
  name: string;
  description: string | null;
  mprs: Mprs;
  investmentType: InvestmentType;
  headquarterId: string;
  lifecycle: Lifecycle;
  health: Health;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number | null; // 원 단위
  progressPct: number;
  pmIds: string[];
  departmentIds: string[];
  aiTechIds: string[];
  tagIds: string[];
}

export interface ProjectEditData {
  id: string;
  name: string;
  description: string | null;
  mprs: Mprs;
  investment_type: InvestmentType;
  headquarter_id: string;
  lifecycle: Lifecycle;
  health: Health;
  start_date: string | null;
  end_date: string | null;
  total_budget: number | null;
  progress_pct: number;
  pmIds: string[];
  departmentIds: string[];
  aiTechIds: string[];
  tagIds: string[];
  budgetPlanItemId: string; // "" = 사업계획 외 과제
  executions: { id: string; year_month: string; amount: number }[];
}

type DbClient = Awaited<ReturnType<typeof createClient>>;

function scalarColumns(input: ProjectWriteInput) {
  return {
    name: input.name,
    description: input.description,
    mprs: input.mprs,
    investment_type: input.investmentType,
    headquarter_id: input.headquarterId,
    lifecycle: input.lifecycle,
    health: input.health,
    start_date: input.startDate,
    end_date: input.endDate,
    total_budget: input.totalBudget,
    progress_pct: input.progressPct,
  };
}

/** M:N 관계를 입력값으로 교체 (생성=빈 상태에서 insert, 수정=delete 후 insert) */
async function replaceRelations(
  supabase: DbClient,
  projectId: string,
  input: ProjectWriteInput,
): Promise<void> {
  await Promise.all([
    supabase.from("project_pms").delete().eq("project_id", projectId),
    supabase.from("project_ai_techs").delete().eq("project_id", projectId),
    supabase.from("project_tags").delete().eq("project_id", projectId),
    supabase
      .from("project_stakeholders")
      .delete()
      .eq("project_id", projectId),
  ]);

  const ops: PromiseLike<{ error: { message: string } | null }>[] = [];

  if (input.pmIds.length) {
    ops.push(
      supabase
        .from("project_pms")
        .insert(
          input.pmIds.map((person_id) => ({ project_id: projectId, person_id })),
        ),
    );
  }
  if (input.aiTechIds.length) {
    ops.push(
      supabase
        .from("project_ai_techs")
        .insert(
          input.aiTechIds.map((ai_tech_id) => ({
            project_id: projectId,
            ai_tech_id,
          })),
        ),
    );
  }
  if (input.tagIds.length) {
    ops.push(
      supabase.from("project_tags").insert(
        input.tagIds.map((tag_id) => ({
          project_id: projectId,
          tag_id,
        })),
      ),
    );
  }
  if (input.departmentIds.length) {
    ops.push(
      supabase.from("project_stakeholders").insert(
        input.departmentIds.map((department_id) => ({
          project_id: projectId,
          department_id,
          person_id: null,
        })),
      ),
    );
  }

  const results = await Promise.all(ops);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`관계 저장 실패: ${failed.error.message}`);
  }
}

/** 과제 생성 → 새 id 반환 */
export async function createProject(
  input: ProjectWriteInput,
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .insert(scalarColumns(input))
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`과제 생성 실패: ${error?.message ?? "알 수 없는 오류"}`);
  }

  await replaceRelations(supabase, data.id, input);
  return data.id;
}

/** 과제 수정 */
export async function updateProject(
  id: string,
  input: ProjectWriteInput,
): Promise<void> {
  if (!UUID_RE.test(id)) throw new Error("잘못된 과제 ID입니다.");
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update(scalarColumns(input))
    .eq("id", id);

  if (error) {
    throw new Error(`과제 수정 실패: ${error.message}`);
  }

  await replaceRelations(supabase, id, input);
}

interface RawEditRow {
  id: string;
  name: string;
  description: string | null;
  mprs: Mprs;
  investment_type: InvestmentType;
  headquarter_id: string;
  lifecycle: Lifecycle;
  health: Health;
  start_date: string | null;
  end_date: string | null;
  total_budget: number | null;
  progress_pct: number;
  project_pms: { person_id: string }[];
  project_stakeholders: { department_id: string }[];
  project_ai_techs: { ai_tech_id: string }[];
  project_tags: { tag_id: string }[];
  budget_plan_item_projects: { item_id: string }[];
  project_budget_monthly: { id: string; year_month: string; amount: number }[];
}

/** 편집 폼 프리필용 데이터 (스칼라 + 선택된 M:N id 목록) */
export async function fetchProjectEditData(
  id: string,
): Promise<ProjectEditData | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id, name, description, mprs, investment_type, headquarter_id, lifecycle, health,
      start_date, end_date, total_budget, progress_pct,
      project_pms ( person_id ),
      project_stakeholders ( department_id ),
      project_ai_techs ( ai_tech_id ),
      project_tags ( tag_id ),
      budget_plan_item_projects ( item_id ),
      project_budget_monthly ( id, year_month, amount )
    `,
    )
    .eq("id", id)
    .eq("is_archived", false)
    .maybeSingle<RawEditRow>();

  if (error) throw new Error(`과제 편집 데이터 조회 실패: ${error.message}`);
  if (!data) return null;

  const unique = (arr: string[]) => Array.from(new Set(arr));

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    mprs: data.mprs,
    investment_type: data.investment_type,
    headquarter_id: data.headquarter_id,
    lifecycle: data.lifecycle,
    health: data.health,
    start_date: data.start_date,
    end_date: data.end_date,
    total_budget: data.total_budget,
    progress_pct: data.progress_pct,
    pmIds: unique((data.project_pms ?? []).map((p) => p.person_id)),
    departmentIds: unique(
      (data.project_stakeholders ?? []).map((s) => s.department_id),
    ),
    aiTechIds: unique((data.project_ai_techs ?? []).map((t) => t.ai_tech_id)),
    tagIds: unique((data.project_tags ?? []).map((t) => t.tag_id)),
    budgetPlanItemId: data.budget_plan_item_projects?.[0]?.item_id ?? "",
    executions: (data.project_budget_monthly ?? []).map((m) => ({
      id: m.id,
      year_month: m.year_month,
      amount: m.amount,
    })),
  };
}
