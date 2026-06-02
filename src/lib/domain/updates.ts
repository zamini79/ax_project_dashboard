import type { UpdateSource, PageRole } from "@/lib/repositories/projects";

/** 업데이트 출처 라벨 (수동 / Atlassian 자동) */
export const SOURCE_LABEL: Record<UpdateSource, string> = {
  manual: "수동",
  atlassian_sync: "Atlassian",
};

/** 출처 아이콘 (이모지 — 추후 lucide 아이콘으로 교체 가능) */
export const SOURCE_ICON: Record<UpdateSource, string> = {
  manual: "✍️",
  atlassian_sync: "🔗",
};

/** Confluence 페이지 역할 라벨 (D-009) */
export const PAGE_ROLE_LABEL: Record<PageRole, string> = {
  root: "루트",
  weekly_report: "주간보고",
  issue: "이슈",
  meeting_note: "회의록",
  other: "기타",
};
