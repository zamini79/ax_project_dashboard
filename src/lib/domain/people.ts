/** 사람 마스터 직책 목록 (UI 고정 선택지). */
export const POSITIONS = [
  "CEO",
  "대표",
  "COO",
  "본부장",
  "실장",
  "전문위원",
  "그룹장",
  "팀장/PL",
  "매니저",
] as const;

export type Position = (typeof POSITIONS)[number];
