/**
 * 표시용 포맷터 (DB·UI 무관 순수 함수).
 * 통화: DB는 원 단위 NUMERIC, 화면은 억 단위 표시 (CLAUDE.md 컨벤션).
 */

const EOK = 100_000_000; // 1억

/**
 * 원 단위 금액 → "12.34억" 형태 문자열.
 * null/0 처리. 억 단위, 소수가 있으면 최대 2자리(불필요한 0 제거).
 */
export function formatBudgetEok(won: number | null | undefined): string {
  if (won == null || won === 0) return "-";
  const eok = Math.round((won / EOK) * 100) / 100;
  const str = eok.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  return `${str}억`;
}

/** 집행률(%) = 집행액 / 예산. 예산 0이면 null. */
export function executionRate(
  budget: number | null | undefined,
  executed: number | null | undefined,
): number | null {
  if (!budget || budget <= 0) return null;
  return Math.round(((executed ?? 0) / budget) * 100);
}

/** ISO 날짜 문자열 → "2026.05" (종료월 표시용) */
export function formatYearMonth(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [y, m] = iso.split("-");
  if (!y || !m) return "-";
  return `${y}.${m}`;
}

/** ISO 날짜/타임스탬프 → "5월 29일" 등 상대 친화 표기 (간단판) */
export function formatDateKo(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** "n일 전" / "오늘" 형태 (최근 업데이트 표시용). now 주입 가능(테스트). */
export function formatRelativeDays(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "업데이트 없음";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "업데이트 없음";
  const days = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return formatYearMonth(iso);
}
