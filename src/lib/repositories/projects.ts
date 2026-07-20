import "server-only";

import { createClient } from "@/lib/supabase/server";
import { type Lifecycle, type Health, effectiveHealth } from "@/lib/domain/lifecycle";
import {
  type AttentionOverride,
  type AttentionState,
  resolveAttention,
} from "@/lib/domain/attention";

/** 오늘 ISO(YYYY-MM-DD) — 표시용 진행상태 파생에 사용 */
function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
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
  /** '확인 필요' 활성 여부 (표시용 신호등 승격에 사용, 집계엔 미반영) */
  attention_active: boolean;
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
  attention_override: AttentionOverride;
  attention_note: string | null;
  headquarters: { name: string } | null;
  project_pms: {
    people: { name: string; departments: { name: string } | null } | null;
  }[];
  project_updates: {
    update_date: string;
    created_at: string;
    issue_note: string | null;
  }[];
  project_budget_monthly: { amount: number }[];
  project_ai_techs: { ai_techs: { name: string } | null }[];
  project_tags: { tags: { name: string } | null }[];
}

const PROJECT_SELECT = `
  id, name, mprs, investment_type, lifecycle, health, progress_pct,
  start_date, end_date, total_budget, headquarter_id,
  attention_override, attention_note,
  headquarters ( name ),
  project_pms ( people ( name, departments ( name ) ) ),
  project_ai_techs ( ai_techs ( name ) ),
  project_tags ( tags ( name ) ),
  project_updates ( update_date, created_at, issue_note ),
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

  const sortedUpdates = [...(row.project_updates ?? [])].sort((a, b) => {
    if (a.update_date !== b.update_date)
      return a.update_date < b.update_date ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });
  const last_update_date = sortedUpdates[0]?.update_date ?? null;
  const attention_active = resolveAttention(
    row.attention_override,
    sortedUpdates[0]?.issue_note ?? null,
    row.attention_note,
  ).active;

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
    health: effectiveHealth(
      {
        lifecycle: row.lifecycle,
        health: row.health,
        start_date: row.start_date,
        end_date: row.end_date,
      },
      todayISODate(),
    ),
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
    attention_active,
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
// 금주 주요 사항 (과제별 최신 업데이트 집약)
// ============================================

export interface WeeklyHighlightItem {
  id: string;
  name: string;
  mprs: Mprs;
  lifecycle: Lifecycle;
  health: Health;
  progress_pct: number;
  headquarter_name: string;
  pms: string[];
  latest_date: string;
  latest_content: string;
  latest_source: UpdateSource;
  latest_source_url: string | null;
  update_count: number;
  /** '확인 필요' 유효 상태 (일정 신호등과 독립) */
  attention: AttentionState;
}

interface RawHighlightRow {
  id: string;
  name: string;
  mprs: Mprs;
  lifecycle: Lifecycle;
  health: Health;
  progress_pct: number;
  start_date: string | null;
  end_date: string | null;
  attention_override: AttentionOverride;
  attention_note: string | null;
  headquarters: { name: string } | null;
  project_pms: { people: { name: string } | null }[];
  project_updates: {
    update_date: string;
    content: string;
    source: UpdateSource;
    source_url: string | null;
    created_at: string;
    issue_note: string | null;
  }[];
}

const HIGHLIGHT_SELECT = `
  id, name, mprs, lifecycle, health, progress_pct, start_date, end_date,
  attention_override, attention_note,
  headquarters ( name ),
  project_pms ( people ( name ) ),
  project_updates ( update_date, content, source, source_url, created_at, issue_note )
` as const;

/**
 * '금주 주요 사항' 페이지용 조회.
 * 업데이트가 1건 이상 있는 비-아카이브 과제만, 과제별 '최신' 업데이트 1건과 함께 반환.
 * 최신 판정: update_date DESC → created_at DESC. 정렬·강조는 페이지(도메인)에서 처리.
 */
export async function fetchWeeklyHighlights(): Promise<WeeklyHighlightItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(HIGHLIGHT_SELECT)
    .eq("is_archived", false)
    .returns<RawHighlightRow[]>();
  if (error) throw new Error(`주요 사항 조회 실패: ${error.message}`);

  const today = todayISODate();
  const items: WeeklyHighlightItem[] = [];
  for (const row of data ?? []) {
    const updates = row.project_updates ?? [];
    if (updates.length === 0) continue;
    const latest = [...updates].sort((a, b) => {
      if (a.update_date !== b.update_date)
        return a.update_date < b.update_date ? 1 : -1;
      return a.created_at < b.created_at ? 1 : -1;
    })[0];
    items.push({
      id: row.id,
      name: row.name,
      mprs: row.mprs,
      lifecycle: row.lifecycle,
      health: effectiveHealth(
        {
          lifecycle: row.lifecycle,
          health: row.health,
          start_date: row.start_date,
          end_date: row.end_date,
        },
        today,
      ),
      progress_pct: row.progress_pct,
      headquarter_name: row.headquarters?.name ?? "-",
      pms: (row.project_pms ?? [])
        .map((pm) => pm.people?.name)
        .filter((n): n is string => n != null),
      latest_date: latest.update_date,
      latest_content: latest.content,
      latest_source: latest.source,
      latest_source_url: latest.source_url,
      update_count: updates.length,
      attention: resolveAttention(
        row.attention_override,
        latest.issue_note,
        row.attention_note,
      ),
    });
  }
  return items;
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
  issue_note: string | null;
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
  attention: AttentionState;
  attention_override: AttentionOverride;
  attention_note: string | null;
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
  attention_override: AttentionOverride;
  attention_note: string | null;
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
    issue_note: string | null;
    author: { name: string } | null;
    source_page: { page_role: PageRole; title: string | null } | null;
  }[];
}

const DETAIL_SELECT = `
  id, name, description, mprs, investment_type, lifecycle, health, progress_pct,
  start_date, end_date, total_budget, last_synced_at,
  attention_override, attention_note,
  headquarters ( name ),
  project_pms ( people ( name, departments ( name ) ) ),
  project_stakeholders ( departments ( name ), people ( name ) ),
  project_ai_techs ( ai_techs ( name ) ),
  project_tags ( tags ( name ) ),
  project_budget_monthly ( id, year_month, amount ),
  project_confluence_pages ( id, title, page_role, confluence_page_id, is_active ),
  project_updates (
    id, update_date, content, source, source_url, created_at, issue_note,
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
      issue_note: u.issue_note,
    }))
    .sort((a, b) => {
      if (a.update_date !== b.update_date)
        return a.update_date < b.update_date ? 1 : -1;
      return a.created_at < b.created_at ? 1 : -1;
    });

  const attention = resolveAttention(
    data.attention_override,
    updates[0]?.issue_note ?? null,
    data.attention_note,
  );

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    mprs: data.mprs,
    investment_type: data.investment_type,
    lifecycle: data.lifecycle,
    health: effectiveHealth(
      {
        lifecycle: data.lifecycle,
        health: data.health,
        start_date: data.start_date,
        end_date: data.end_date,
      },
      todayISODate(),
    ),
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
    attention,
    attention_override: data.attention_override,
    attention_note: data.attention_note,
  };
}

/** '확인 필요' 수동 오버라이드 저장 (auto/on/off + 메모). D-014: DB 접근은 여기 경유. */
export async function setProjectAttention(
  id: string,
  override: AttentionOverride,
  note: string | null,
): Promise<void> {
  if (!UUID_RE.test(id)) throw new Error("잘못된 과제 ID입니다.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      attention_override: override,
      attention_note: note && note.trim() ? note.trim() : null,
    })
    .eq("id", id);
  if (error) throw new Error(`확인 필요 저장 실패: ${error.message}`);
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
  hasEffect: boolean; // 성과 현황(운영 효과) 등록 여부 → "성과 현황 추가" 체크 프리필
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

/** 과제 보관(삭제) — is_archived=true. 목록·대시보드에서 제외됨 (D-027) */
export async function archiveProject(id: string): Promise<void> {
  if (!UUID_RE.test(id)) throw new Error("잘못된 과제 ID입니다.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ is_archived: true })
    .eq("id", id);
  if (error) throw new Error(`과제 삭제(보관) 실패: ${error.message}`);
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
  project_effects: { id: string }[];
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
      project_budget_monthly ( id, year_month, amount ),
      project_effects ( id )
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
    hasEffect: (data.project_effects ?? []).length > 0,
  };
}
