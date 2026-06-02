import type { Enums } from "@/lib/supabase/types";

export type Mprs = Enums<"mprs_category">;

/** MPRS 표시 순서 (Marketing / Production / Research / Support) */
export const MPRS_ORDER: readonly Mprs[] = [
  "marketing",
  "production",
  "research",
  "support",
] as const;

/** 전역 색 매핑 (D-022). 동적 인라인 style로 사용. */
export const MPRS_COLORS: Record<
  Mprs,
  { main: string; bg: string; text: string }
> = {
  marketing: { main: "#1D9E75", bg: "#E2F4EC", text: "#085041" },
  production: { main: "#534AB7", bg: "#ECEAFA", text: "#3C3489" },
  research: { main: "#D4537E", bg: "#FBE6EE", text: "#72243E" },
  support: { main: "#D85A30", bg: "#FBE9E0", text: "#712B13" },
};

/** 한국어 라벨 (원어 그대로 영문 도메인 용어 유지) */
export const MPRS_LABEL: Record<Mprs, string> = {
  marketing: "Marketing",
  production: "Production",
  research: "Research",
  support: "Support",
};

/** 카드 배지용 1글자 (M/P/R/S) — D-023 */
export const MPRS_LETTER: Record<Mprs, string> = {
  marketing: "M",
  production: "P",
  research: "R",
  support: "S",
};
