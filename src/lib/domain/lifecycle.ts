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
  operating: 5, // 완료 다음(맨 끝)
};

/** 한국어 라벨 */
export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  not_started: "진행 전",
  under_review: "검토 중",
  in_progress: "진행 중",
  completed: "완료",
  operating: "운영",
};

/** KPI "과제 현황" 블록 표시 순서 (전체는 별도 처리) */
export const LIFECYCLE_KPI_ORDER: readonly Lifecycle[] = [
  "not_started",
  "under_review",
  "in_progress",
  "completed",
  "operating",
] as const;

export const HEALTH_LABEL: Record<Health, string> = {
  green: "정상",
  yellow: "주의",
  red: "위험",
  completed: "완료",
  none: "-",
};

/** 헬스 의미 (툴팁·도움말용) */
export const HEALTH_HELP: Record<Health, string> = {
  green: "진행에 이상 없음",
  yellow: "지연·리스크 주의 필요",
  red: "즉시 조치 필요",
  completed: "완료된 과제",
  none: "아직 진행 전",
};

/** 헬스 → CSS 변수 색 (좌측 컬러바, D-023). none은 색 없음(transparent). */
export const HEALTH_COLOR_VAR: Record<Health, string> = {
  green: "var(--health-green)",
  yellow: "var(--health-yellow)",
  red: "var(--health-red)",
  completed: "var(--health-gray)",
  none: "transparent",
};

/** 진행 현황 KPI 표시 순서 (위험 → 주의 → 정상 → 완료 → 미진행) */
export const HEALTH_KPI_ORDER: readonly Health[] = [
  "red",
  "yellow",
  "green",
  "completed",
  "none",
] as const;

/**
 * 표시용 진행 상태(신호등) 파생 (순수). DB 저장값은 변경하지 않음.
 * 1) 일정(시작·종료일) 미입력 → "-"(none): 신호로 판단할 근거가 없음.
 * 2) 진행 전·검토 중인데 시작일이 이미 지났으면 → "주의(yellow)".
 *    단, 이미 "위험(red)"이면 더 심각하므로 그대로 둔다.
 */
export function effectiveHealth(
  item: {
    lifecycle: Lifecycle;
    health: Health;
    start_date: string | null;
    end_date: string | null;
  },
  todayISO: string,
): Health {
  if (item.start_date == null && item.end_date == null) return "none";

  const notStartedYet =
    item.lifecycle === "not_started" || item.lifecycle === "under_review";
  const startPassed = item.start_date != null && item.start_date < todayISO;
  if (notStartedYet && startPassed && item.health !== "red") return "yellow";
  return item.health;
}

/**
 * 지연 여부 (순수): 종료일이 오늘보다 이전인데 아직 완료되지 않은 과제.
 * 날짜는 ISO "YYYY-MM-DD" 문자열 비교(사전식 = 시간순). 종료일 없으면 지연 아님.
 */
export function isOverdue(
  item: { lifecycle: Lifecycle; end_date: string | null },
  todayISO: string,
): boolean {
  // 완료·운영은 개발 일정이 마무리된 단계 → 지연 아님
  return (
    item.lifecycle !== "completed" &&
    item.lifecycle !== "operating" &&
    item.end_date != null &&
    item.end_date < todayISO
  );
}

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
