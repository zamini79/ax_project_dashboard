"use client";

/**
 * 일정 타임라인을 "현재"(표시 연도 1월) 위치로 스크롤.
 * ProjectTable의 스크롤 컨테이너(#schedule-timeline)의 data-home(px)을 읽어 이동 —
 * 컨트롤이 FilterControls 줄에 있어도 타임라인을 제어할 수 있게 DOM으로 분리.
 */
export function ScheduleHomeButton() {
  function goHome() {
    const el = document.getElementById("schedule-timeline");
    if (!el) return;
    const home = Number(el.dataset.home ?? "0");
    el.scrollTo({ left: home, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={goHome}
      title="현재 기간으로 이동"
      className="bg-card hover:bg-muted rounded-md border px-3 py-1 text-xs font-medium transition-colors"
    >
      현재
    </button>
  );
}
