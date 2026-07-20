import type { Enums } from "@/lib/supabase/types";

/** '확인 필요' 수동 오버라이드 값 */
export type AttentionOverride = Enums<"attention_override">;

export interface AttentionState {
  active: boolean;
  /** 활성 근거: 'manual'(PM 지정) | 'auto'(주간보고 이슈) | null(비활성) */
  source: "manual" | "auto" | null;
  /** 표시할 이슈/사유 텍스트 (없으면 null) */
  note: string | null;
}

/**
 * '확인 필요' 유효 상태 파생 (순수, 하이브리드 규칙).
 * - override 'on'  → 강조(수동). 사유는 수동 메모, 없으면 최신 자동 이슈.
 * - override 'off' → 해제.
 * - override 'auto'→ 최신 업데이트의 issue_note가 있으면 자동 활성.
 * 일정 신호등(health)과 독립된 축.
 */
export function resolveAttention(
  override: AttentionOverride,
  latestIssueNote: string | null,
  manualNote: string | null,
): AttentionState {
  if (override === "on") {
    return { active: true, source: "manual", note: manualNote ?? latestIssueNote ?? null };
  }
  if (override === "off") {
    return { active: false, source: null, note: null };
  }
  if (latestIssueNote) {
    return { active: true, source: "auto", note: latestIssueNote };
  }
  return { active: false, source: null, note: null };
}
