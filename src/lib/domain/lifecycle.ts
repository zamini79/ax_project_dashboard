import type { Enums } from "@/lib/supabase/types";

export type Lifecycle = Enums<"project_lifecycle">;
export type Health = Enums<"project_health">;

/**
 * 디폴트 표시 정렬 우선순위 (D-020): 진행 중 → 검토 중 → 진행 전 → 완료.
 * enum 정의 순서(상태 전이)와 다르므로 별도 매핑 (D-016).
 */
export const LIFECYCLE_SORT_RANK: Record<Lifecycle, number> = {
  in_progress: 1,
  under_review: 2,
  not_started: 3,
  completed: 4,
};

/** 한국어 라벨 */
export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  not_started: "진행 전",
  under_review: "검토 중",
  in_progress: "진행 중",
  completed: "완료",
};

/** KPI "과제 현황" 블록 표시 순서 (전체는 별도 처리) */
export const LIFECYCLE_KPI_ORDER: readonly Lifecycle[] = [
  "not_started",
  "under_review",
  "in_progress",
  "completed",
] as const;

export const HEALTH_LABEL: Record<Health, string> = {
  green: "정상",
  yellow: "주의",
  red: "위험",
};

/** 헬스 의미 (툴팁·도움말용) */
export const HEALTH_HELP: Record<Health, string> = {
  green: "진행에 이상 없음",
  yellow: "지연·리스크 주의 필요",
  red: "즉시 조치 필요",
};

/** 헬스 → CSS 변수 색 (좌측 컬러바, D-023) */
export const HEALTH_COLOR_VAR: Record<Health, string> = {
  green: "var(--health-green)",
  yellow: "var(--health-yellow)",
  red: "var(--health-red)",
};

/** 진행 현황 KPI 표시 순서 (위험 → 주의 → 정상) */
export const HEALTH_KPI_ORDER: readonly Health[] = [
  "red",
  "yellow",
  "green",
] as const;

/**
 * 디폴트 정렬 비교 함수 (D-020): 라이프사이클 우선순위 → 시작일 최신 순(DESC, null 마지막).
 * 순수 함수 (클라이언트 재정렬 시에도 사용).
 */
export function compareByDefault(
  a: { lifecycle: Lifecycle; start_date: string | null },
  b: { lifecycle: Lifecycle; start_date: string | null },
): number {
  const rankDiff =
    LIFECYCLE_SORT_RANK[a.lifecycle] - LIFECYCLE_SORT_RANK[b.lifecycle];
  if (rankDiff !== 0) return rankDiff;

  // 같은 단계 내 시작일 최신 순(내림차순). null은 마지막.
  if (a.start_date === b.start_date) return 0;
  if (a.start_date === null) return 1;
  if (b.start_date === null) return -1;
  return a.start_date > b.start_date ? -1 : 1;
}
