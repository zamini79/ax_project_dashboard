import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { Mprs } from "@/lib/domain/mprs";
import type { Lifecycle } from "@/lib/domain/lifecycle";

/**
 * 사용성 지표 기반 Biz Impact 저장소 (D-014: DB 접근은 repositories 경유).
 * 원본 엑셀(주차별/월별 API Call + 산정기준)을 적재한 결과를 화면용으로 평탄화한다.
 * 누계는 저장하지 않고 기간순 합으로 계산 (D-007과 동일 원칙).
 */

export type BizPeriodKind = Enums<"biz_period_kind">;

export interface BizImpactPoint {
  periodKind: BizPeriodKind;
  year: number;
  periodNo: number;
  /** "26년 W30" / "26년 7월" */
  label: string;
  callCount: number;
  impactManwon: number;
  /** 지표 세부(예: JSA 추천 유형별 건수) */
  breakdown: Record<string, number> | null;
}

export interface ProjectBizImpact {
  projectId: string;
  projectName: string;
  mprs: Mprs;
  lifecycle: Lifecycle;
  unitLabel: string;
  /** 1건당 절감액(만원). null이면 산정기준 미정 */
  unitValueManwon: number | null;
  /** 1건당 절감시간(h). 산정기준이 시간×인건비로 분해되는 경우만 */
  unitHours: number | null;
  /** 과제 투자비(원) — '연간 효과 / 관련 투자' 비율 계산용 */
  budgetWon: number | null;
  basis: string[];
  sourceFile: string | null;
  asOf: string | null;
  points: BizImpactPoint[];
  totalCalls: number;
  /** 누계 절감효과(만원) */
  totalImpactManwon: number;
  /** 기간 표기 ("25년 W37 ~ 26년 W30") */
  periodLabel: string;
}

interface RawRow {
  project_id: string;
  unit_label: string;
  unit_value_manwon: number | null;
  unit_hours: number | null;
  basis: string[] | null;
  source_file: string | null;
  as_of: string | null;
  projects: {
    name: string;
    mprs: Mprs;
    lifecycle: Lifecycle;
    total_budget: number | null;
  } | null;
  project_biz_impact_points: {
    period_kind: BizPeriodKind;
    year: number;
    period_no: number;
    call_count: number;
    impact_manwon: number;
    breakdown: unknown;
  }[];
}

const SELECT = `
  project_id, unit_label, unit_value_manwon, unit_hours, basis, source_file, as_of,
  projects ( name, mprs, lifecycle, total_budget ),
  project_biz_impact_points ( period_kind, year, period_no, call_count, impact_manwon, breakdown )
` as const;

function pointLabel(kind: BizPeriodKind, year: number, no: number): string {
  const yy = String(year).slice(2);
  return kind === "week" ? `${yy}년 W${no}` : `${yy}년 ${no}월`;
}

function toBreakdown(v: unknown): Record<string, number> | null {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, number> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n)) out[k] = n;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Biz Impact가 등록된 과제 전체 조회 (누계 큰 순).
 * 아카이브 과제는 제외한다.
 */
export async function fetchProjectBizImpacts(): Promise<ProjectBizImpact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_biz_impacts")
    .select(SELECT)
    .returns<RawRow[]>();
  if (error) throw new Error(`Biz Impact 조회 실패: ${error.message}`);

  const items: ProjectBizImpact[] = [];
  for (const row of data ?? []) {
    if (!row.projects) continue; // 아카이브·삭제된 과제
    const points = (row.project_biz_impact_points ?? [])
      .map((p) => ({
        periodKind: p.period_kind,
        year: p.year,
        periodNo: p.period_no,
        label: pointLabel(p.period_kind, p.year, p.period_no),
        callCount: Number(p.call_count),
        impactManwon: Number(p.impact_manwon),
        breakdown: toBreakdown(p.breakdown),
      }))
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.periodNo - b.periodNo));

    items.push({
      projectId: row.project_id,
      projectName: row.projects.name,
      mprs: row.projects.mprs,
      lifecycle: row.projects.lifecycle,
      unitLabel: row.unit_label,
      unitValueManwon:
        row.unit_value_manwon == null ? null : Number(row.unit_value_manwon),
      unitHours: row.unit_hours == null ? null : Number(row.unit_hours),
      budgetWon:
        row.projects.total_budget == null ? null : Number(row.projects.total_budget),
      basis: row.basis ?? [],
      sourceFile: row.source_file,
      asOf: row.as_of,
      points,
      totalCalls: points.reduce((s, p) => s + p.callCount, 0),
      totalImpactManwon: points.reduce((s, p) => s + p.impactManwon, 0),
      periodLabel:
        points.length === 0
          ? "-"
          : points.length === 1
            ? points[0].label
            : `${points[0].label} ~ ${points[points.length - 1].label}`,
    });
  }

  return items.sort((a, b) => b.totalImpactManwon - a.totalImpactManwon);
}
