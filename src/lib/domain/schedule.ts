/**
 * 과제 일정 → 특정 연도(1~12월) 내 점유 구간 계산 (순수 함수).
 * 연도를 벗어나면 막대 끝을 '열린' 형태로 표시(extendsBefore/After)해 연속임을 알림.
 */

export interface MonthSpan {
  startMonth: number; // 1~12
  endMonth: number; // 1~12
  extendsBefore: boolean; // 시작이 해당 연도 이전
  extendsAfter: boolean; // 종료가 해당 연도 이후
}

function parseYM(iso: string): { y: number; m: number } | null {
  const [y, m] = iso.split("-");
  const yi = Number(y);
  const mi = Number(m);
  if (!Number.isInteger(yi) || !Number.isInteger(mi)) return null;
  return { y: yi, m: mi };
}

/**
 * start/end(ISO date) 중 일부가 null이어도 처리:
 * - 시작 미정: 연초부터(열림), 종료 미정: 연말까지(열림)
 * - 둘 다 null이면 일정 없음(null 반환)
 * - 해당 연도와 겹치지 않으면 null
 */
export function monthSpanForYear(
  start: string | null,
  end: string | null,
  year: number,
): MonthSpan | null {
  if (!start && !end) return null;

  const s = start ? parseYM(start) : null;
  const e = end ? parseYM(end) : null;

  let startMonth: number;
  let extendsBefore = false;
  if (s) {
    if (s.y > year) return null; // 해당 연도 이후 시작 → 겹침 없음
    if (s.y < year) {
      startMonth = 1;
      extendsBefore = true;
    } else {
      startMonth = s.m;
    }
  } else {
    startMonth = 1;
    extendsBefore = true;
  }

  let endMonth: number;
  let extendsAfter = false;
  if (e) {
    if (e.y < year) return null; // 해당 연도 이전 종료 → 겹침 없음
    if (e.y > year) {
      endMonth = 12;
      extendsAfter = true;
    } else {
      endMonth = e.m;
    }
  } else {
    endMonth = 12;
    extendsAfter = true;
  }

  if (startMonth > endMonth) return null;
  return { startMonth, endMonth, extendsBefore, extendsAfter };
}
