import type {
  DashboardFilter,
  SortKey,
  SortDir,
} from "@/lib/domain/dashboard";
import { MPRS_ORDER, type Mprs } from "@/lib/domain/mprs";

export type GroupMode = "all" | "mprs";
export type ViewMode = "card" | "table" | "map";

const SORT_KEYS: readonly SortKey[] = [
  "mprs",
  "hq",
  "name",
  "pm",
  "aitech",
  "lifecycle",
  "health",
  "schedule",
];

export function parseGroup(value: string | undefined): GroupMode {
  return value === "mprs" ? "mprs" : "all";
}

export function parseView(value: string | undefined): ViewMode {
  if (value === "map") return "map";
  if (value === "card") return "card";
  return "table";
}

export function parseSort(value: string | undefined): SortKey | null {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : null;
}

export function parseDir(value: string | undefined): SortDir {
  return value === "desc" ? "desc" : "asc";
}

/**
 * mprs 파라미터 파싱 (맵 MPRS 필터, D-019 공유·영속).
 * 콤마 구분 목록 → 유효 MPRS만 중복 없이. 빈 배열 = 전체(필터 없음).
 */
export function parseMprs(value: string | undefined): Mprs[] {
  if (!value) return [];
  const set = new Set<Mprs>();
  for (const raw of value.split(",")) {
    const k = raw.trim() as Mprs;
    if (MPRS_ORDER.includes(k)) set.add(k);
  }
  return [...set];
}

/** year 파라미터 파싱 (유효하지 않으면 fallback) */
export function parseYear(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : fallback;
}

export interface DashboardState {
  filter: DashboardFilter;
  group: GroupMode;
  view: ViewMode;
  year: number;
  sort?: SortKey | null;
  dir?: SortDir;
  mprs?: Mprs[]; // 맵 MPRS 필터 (빈 배열 = 전체)
  base?: string; // 링크 기본 경로 (기본 "/"; 과제현황은 "/projects")
  detail?: string | null; // 상세 드로어 대상 과제 id
}

type Override = Partial<{
  lifecycle: DashboardFilter["lifecycle"];
  progress: DashboardFilter["progress"];
  headquarterId: DashboardFilter["headquarterId"];
  group: GroupMode;
  view: ViewMode;
  year: number;
  sort: SortKey | null;
  dir: SortDir;
  mprs: Mprs[];
  tags: string[];
  hideCompleted: boolean;
  detail: string | null;
}>;

/**
 * 현재 상태 + override → 대시보드 href 문자열 (순수).
 * 드릴다운/그룹토글/뷰토글/연도이동 링크에서 공통 사용. 디폴트는 쿼리에서 생략.
 * view/year는 표 보기일 때만 URL에 반영(카드 보기는 깔끔하게 생략).
 */
export function dashboardHref(
  state: DashboardState,
  override: Override = {},
): string {
  const lifecycle =
    "lifecycle" in override ? override.lifecycle : state.filter.lifecycle;
  const progress =
    "progress" in override ? override.progress : state.filter.progress;
  const headquarterId =
    "headquarterId" in override
      ? override.headquarterId
      : state.filter.headquarterId;
  const group = override.group ?? state.group;
  const view = override.view ?? state.view;
  const year = override.year ?? state.year;
  const sort = "sort" in override ? override.sort : (state.sort ?? null);
  const dir = override.dir ?? state.dir ?? "asc";
  const mprs = "mprs" in override ? override.mprs : (state.mprs ?? []);
  const tags =
    "tags" in override ? override.tags : (state.filter.tags ?? []);
  const hideCompleted =
    "hideCompleted" in override
      ? override.hideCompleted
      : state.filter.hideCompleted;
  const detail = "detail" in override ? override.detail : (state.detail ?? null);
  const base = state.base ?? "/";

  const params = new URLSearchParams();
  if (lifecycle) params.set("lifecycle", lifecycle);
  if (progress) params.set("progress", progress);
  if (headquarterId) params.set("hq", headquarterId);
  if (group === "mprs") params.set("group", "mprs");
  if (view === "table" || view === "map" || view === "card") {
    params.set("view", view);
    if (view === "table") params.set("year", String(year));
  }
  // 정렬은 표/카드에 적용
  if (sort) {
    params.set("sort", sort);
    if (dir === "desc") params.set("dir", "desc");
  }
  // MPRS 필터는 부분 선택일 때만 (전체/빈 = 생략)
  if (mprs && mprs.length > 0 && mprs.length < MPRS_ORDER.length) {
    params.set("mprs", mprs.join(","));
  }
  // 과제 속성(태그) 필터 — 선택된 게 있을 때만
  if (tags && tags.length > 0) {
    params.set("tags", tags.join(","));
  }
  if (hideCompleted) params.set("hideDone", "1");
  if (detail) params.set("detail", detail);

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** 슬롯 토글: 현재 값과 같으면 해제(null), 다르면 설정 */
export function toggle<T extends string>(current: T | null, value: T): T | null {
  return current === value ? null : value;
}
