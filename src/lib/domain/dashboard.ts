import type { ProjectListItem, Headquarter } from "@/lib/repositories/projects";
import {
  type Lifecycle,
  type Health,
  compareByDefault,
  LIFECYCLE_SORT_RANK,
  LIFECYCLE_KPI_ORDER,
  HEALTH_KPI_ORDER,
} from "@/lib/domain/lifecycle";
import { type Mprs, MPRS_ORDER } from "@/lib/domain/mprs";

/**
 * 드릴다운 필터 상태 (D-019).
 * - 같은 블록 내 단일 선택 / 블록 간 AND 교차.
 * - 슬롯 3개: lifecycle(블록1) / progress(블록2) / headquarter(블록3).
 * - "진행현황" 블록은 헬스 3개 + 금주 업데이트가 한 블록이므로 progress 슬롯 하나에 통합.
 */
export interface DashboardFilter {
  lifecycle: Lifecycle | null;
  progress: Health | "this_week" | null;
  headquarterId: string | null;
  /** 과제 속성(태그) 필터 — 선택된 태그명 목록. 빈 배열 = 전체. OR 매칭. */
  tags: string[];
}

export const EMPTY_FILTER: DashboardFilter = {
  lifecycle: null,
  progress: null,
  headquarterId: null,
  tags: [],
};

const HEALTH_SET = new Set<string>(["green", "yellow", "red"]);

/** URL searchParams → 필터 (순수 파싱, 잘못된 값은 무시) */
export function parseFilter(params: {
  lifecycle?: string;
  progress?: string;
  hq?: string;
  tags?: string;
}): DashboardFilter {
  const lifecycle = (
    ["not_started", "under_review", "in_progress", "completed"] as const
  ).includes(params.lifecycle as Lifecycle)
    ? (params.lifecycle as Lifecycle)
    : null;

  const progress =
    params.progress === "this_week" || HEALTH_SET.has(params.progress ?? "")
      ? (params.progress as Health | "this_week")
      : null;

  return {
    lifecycle,
    progress,
    headquarterId: params.hq?.trim() || null,
    tags: parseTagFilter(params.tags),
  };
}

/** 콤마 구분 태그명 목록 파싱 — 빈 값 제거, 중복 제거. */
export function parseTagFilter(value: string | undefined): string[] {
  if (!value) return [];
  const set = new Set<string>();
  for (const raw of value.split(",")) {
    const t = raw.trim();
    if (t) set.add(t);
  }
  return [...set];
}

export function hasAnyFilter(f: DashboardFilter): boolean {
  return Boolean(
    f.lifecycle || f.progress || f.headquarterId || f.tags.length > 0,
  );
}

/**
 * 금주 시작일(월요일) ISO(YYYY-MM-DD). Postgres date_trunc('week') 와 동일 기준.
 * now 주입 가능(테스트/SSR 일관성).
 */
export function weekStartISO(now: Date = new Date()): string {
  const d = new Date(now);
  const day = d.getDay(); // 0=일 ~ 6=토
  const diff = (day + 6) % 7; // 월요일까지 거슬러갈 일수
  d.setDate(d.getDate() - diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function isUpdatedThisWeek(item: ProjectListItem, weekStart: string): boolean {
  return item.last_update_date != null && item.last_update_date >= weekStart;
}

// ============================================
// 컬럼별 정렬 (표 보기)
// ============================================

export type SortKey =
  | "mprs"
  | "hq"
  | "name"
  | "aitech"
  | "lifecycle"
  | "health"
  | "schedule";
export type SortDir = "asc" | "desc";

const HEALTH_RANK: Record<Health, number> = { red: 0, yellow: 1, green: 2 };

/**
 * 컬럼 기준 정렬 (순수). 동률은 과제명으로 안정 정렬.
 * 일정(schedule)의 시작일 null은 방향과 무관하게 항상 마지막.
 */
export function sortProjectList(
  items: ProjectListItem[],
  key: SortKey,
  dir: SortDir,
): ProjectListItem[] {
  const sign = dir === "desc" ? -1 : 1;
  const nameCmp = (a: ProjectListItem, b: ProjectListItem) =>
    a.name.localeCompare(b.name, "ko");

  return [...items].sort((a, b) => {
    if (key === "schedule") {
      const as = a.start_date;
      const bs = b.start_date;
      if (as === null && bs === null) return nameCmp(a, b);
      if (as === null) return 1; // null은 항상 마지막
      if (bs === null) return -1;
      const c = as < bs ? -1 : as > bs ? 1 : 0;
      return (c || nameCmp(a, b)) * sign;
    }

    let c = 0;
    switch (key) {
      case "mprs":
        c = MPRS_ORDER.indexOf(a.mprs) - MPRS_ORDER.indexOf(b.mprs);
        break;
      case "hq":
        c = a.headquarter_name.localeCompare(b.headquarter_name, "ko");
        break;
      case "name":
        c = nameCmp(a, b);
        break;
      case "aitech":
        c = a.ai_techs.join(", ").localeCompare(b.ai_techs.join(", "), "ko");
        break;
      case "lifecycle":
        c = LIFECYCLE_SORT_RANK[a.lifecycle] - LIFECYCLE_SORT_RANK[b.lifecycle];
        break;
      case "health":
        c = HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
        break;
    }
    return (c || nameCmp(a, b)) * sign;
  });
}

/** AND 교차 필터 적용 후 디폴트 정렬 (D-020) */
export function applyFilter(
  items: ProjectListItem[],
  filter: DashboardFilter,
  now: Date = new Date(),
): ProjectListItem[] {
  const weekStart = weekStartISO(now);

  const filtered = items.filter((it) => {
    if (filter.lifecycle && it.lifecycle !== filter.lifecycle) return false;
    if (filter.headquarterId && it.headquarter_id !== filter.headquarterId)
      return false;
    if (filter.progress) {
      if (filter.progress === "this_week") {
        if (!isUpdatedThisWeek(it, weekStart)) return false;
      } else if (it.health !== filter.progress) {
        return false;
      }
    }
    // 속성(태그) 필터: 선택된 태그 중 하나라도 가지면 통과 (OR)
    if (
      filter.tags.length > 0 &&
      !filter.tags.some((t) => it.tags.includes(t))
    )
      return false;
    return true;
  });

  return filtered.sort(compareByDefault);
}

// ============================================
// KPI 집계 (D-018) — 항상 전체(비필터) 기준
// ============================================

export interface DashboardKpis {
  total: number;
  lifecycle: { key: Lifecycle; count: number }[];
  health: { key: Health; count: number }[];
  thisWeekCount: number;
  byHeadquarter: { id: string; name: string; count: number }[];
  budgetByMprs: {
    key: Mprs;
    budget: number;
    executed: number;
  }[];
  budgetTotal: { budget: number; executed: number };
}

export function computeKpis(
  items: ProjectListItem[],
  headquarters: Headquarter[],
  now: Date = new Date(),
): DashboardKpis {
  const weekStart = weekStartISO(now);

  const lifecycleCount = new Map<Lifecycle, number>();
  const healthCount = new Map<Health, number>();
  const hqCount = new Map<string, number>();
  const budgetMap = new Map<Mprs, { budget: number; executed: number }>();
  let thisWeekCount = 0;
  let budgetTotal = 0;
  let executedTotal = 0;

  for (const it of items) {
    lifecycleCount.set(
      it.lifecycle,
      (lifecycleCount.get(it.lifecycle) ?? 0) + 1,
    );
    healthCount.set(it.health, (healthCount.get(it.health) ?? 0) + 1);
    hqCount.set(it.headquarter_id, (hqCount.get(it.headquarter_id) ?? 0) + 1);
    if (isUpdatedThisWeek(it, weekStart)) thisWeekCount += 1;

    const prev = budgetMap.get(it.mprs) ?? { budget: 0, executed: 0 };
    prev.budget += it.total_budget ?? 0;
    prev.executed += it.executed_budget;
    budgetMap.set(it.mprs, prev);

    budgetTotal += it.total_budget ?? 0;
    executedTotal += it.executed_budget;
  }

  return {
    total: items.length,
    lifecycle: LIFECYCLE_KPI_ORDER.map((key) => ({
      key,
      count: lifecycleCount.get(key) ?? 0,
    })),
    health: HEALTH_KPI_ORDER.map((key) => ({
      key,
      count: healthCount.get(key) ?? 0,
    })),
    thisWeekCount,
    byHeadquarter: headquarters.map((h) => ({
      id: h.id,
      name: h.name,
      count: hqCount.get(h.id) ?? 0,
    })),
    budgetByMprs: MPRS_ORDER.map((key) => {
      const b = budgetMap.get(key) ?? { budget: 0, executed: 0 };
      return { key, budget: b.budget, executed: b.executed };
    }),
    budgetTotal: { budget: budgetTotal, executed: executedTotal },
  };
}
