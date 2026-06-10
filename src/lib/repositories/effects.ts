import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Mprs } from "@/lib/domain/mprs";

export interface EffectMetric {
  kind: string; // 'won' | 'time' | 'target'
  label: string;
  value: string;
}

export interface ProjectEffect {
  id: string;
  projectId: string;
  projectName: string;
  mprs: Mprs;
  hq: string;
  pms: string[];
  budgetWon: number | null;
  appliedYm: string | null;
  isPilot: boolean;
  saveCostWon: number;
  saveHoursMonth: number;
  note: string | null;
  metrics: EffectMetric[];
}

interface RawEffectRow {
  id: string;
  applied_ym: string | null;
  is_pilot: boolean;
  save_cost_won: number;
  save_hours_month: number;
  note: string | null;
  project_id: string;
  projects: {
    name: string;
    mprs: Mprs;
    total_budget: number | null;
    headquarters: { name: string } | null;
    project_pms: { people: { name: string } | null }[];
  } | null;
  project_effect_metrics: {
    kind: string;
    label: string;
    value: string;
    sort: number;
  }[];
}

const EFFECT_SELECT = `
  id, applied_ym, is_pilot, save_cost_won, save_hours_month, note, project_id,
  projects ( name, mprs, total_budget, headquarters ( name ), project_pms ( people ( name ) ) ),
  project_effect_metrics ( kind, label, value, sort )
` as const;

function mapEffect(row: RawEffectRow): ProjectEffect {
  const pms = (row.projects?.project_pms ?? [])
    .map((pm) => pm.people?.name)
    .filter((n): n is string => n != null);
  const metrics = [...(row.project_effect_metrics ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map((m) => ({ kind: m.kind, label: m.label, value: m.value }));

  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.projects?.name ?? "-",
    mprs: row.projects?.mprs ?? "production",
    hq: row.projects?.headquarters?.name ?? "-",
    pms,
    budgetWon: row.projects?.total_budget ?? null,
    appliedYm: row.applied_ym,
    isPilot: row.is_pilot,
    saveCostWon: row.save_cost_won,
    saveHoursMonth: row.save_hours_month,
    note: row.note,
    metrics,
  };
}

/** 전체 운영 효과 (성과 현황·벤토용) */
export async function fetchProjectEffects(): Promise<ProjectEffect[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_effects")
    .select(EFFECT_SELECT)
    .returns<RawEffectRow[]>();
  if (error) throw new Error(`운영 효과 조회 실패: ${error.message}`);
  return (data ?? []).map(mapEffect);
}

/** 과제에 운영 효과(성과 현황) 행이 있는지 여부 */
export async function projectHasEffect(projectId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("project_effects")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) throw new Error(`성과 등록 여부 조회 실패: ${error.message}`);
  return (count ?? 0) > 0;
}

/**
 * 성과 현황 등록 여부 동기화.
 * - member=true: 효과 행이 없으면 기본 행 생성(절감액 등은 0, 추후 입력).
 * - member=false: 해당 과제의 효과 행을 모두 제거(성과 현황에서 빠짐).
 */
export async function setProjectEffectMembership(
  projectId: string,
  member: boolean,
): Promise<void> {
  const supabase = await createClient();
  if (member) {
    if (await projectHasEffect(projectId)) return;
    const { error } = await supabase
      .from("project_effects")
      .insert({ project_id: projectId });
    if (error) throw new Error(`성과 현황 등록 실패: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("project_effects")
      .delete()
      .eq("project_id", projectId);
    if (error) throw new Error(`성과 현황 해제 실패: ${error.message}`);
  }
}

/** 단일 과제의 운영 효과 (상세 드로어용). 없으면 null */
export async function fetchEffectForProject(
  projectId: string,
): Promise<ProjectEffect | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_effects")
    .select(EFFECT_SELECT)
    .eq("project_id", projectId)
    .maybeSingle<RawEffectRow>();
  if (error) throw new Error(`운영 효과 조회 실패: ${error.message}`);
  return data ? mapEffect(data) : null;
}
