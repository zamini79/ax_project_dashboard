"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/repositories/projects";
import type { SortKey } from "@/lib/domain/dashboard";
import {
  LIFECYCLE_LABEL,
  HEALTH_COLOR_VAR,
  HEALTH_LABEL,
} from "@/lib/domain/lifecycle";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import { dashboardHref, type DashboardState } from "./url";

const MONTH_W = 44; // 월당 px
const ROW_H = 40; // 행 높이 px
const HEAD_H = 40; // 헤더 높이 px
const TIMELINE_W = 640; // 일정(타임라인) 고정 표시 폭 px — 전체 폭은 유지, 남는 폭은 좌측 컬럼이 흡수
const PAD_MONTHS = 1; // 데이터 범위 양쪽 여유 개월
const BAR_COLOR = "#475569";
const TODAY_COLOR = "#B70000";

interface LeftCol {
  key: string;
  label: string;
  width: string;
  sort: SortKey | null;
  align?: "center";
}

const LEFT_COLS: LeftCol[] = [
  { key: "idx", label: "순번", width: "w-12 shrink-0", sort: null, align: "center" },
  { key: "mprs", label: "MPRS", width: "w-28 shrink-0", sort: "mprs" },
  { key: "hq", label: "본부", width: "w-36 shrink-0", sort: "hq" },
  { key: "name", label: "과제명", width: "flex-1 min-w-0", sort: "name" },
  { key: "aitech", label: "AI기술", width: "w-28 shrink-0", sort: "aitech" },
  { key: "lifecycle", label: "과제현황", width: "w-24 shrink-0", sort: "lifecycle" },
  { key: "health", label: "진행", width: "w-16 shrink-0", sort: "health", align: "center" },
];

/** "YYYY-MM-DD" → 절대 월 인덱스 (연*12 + (월-1)) */
function ymIndex(iso: string): number {
  const [y, m] = iso.split("-");
  return Number(y) * 12 + (Number(m) - 1);
}

/** 오늘을 소수 월 인덱스로 (일자 비율 포함) */
function todayFracIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return y * 12 + (m - 1) + (d - 1) / daysInMonth;
}

export function ProjectTable({
  items,
  state,
  todayISO,
}: {
  items: ProjectListItem[];
  state: DashboardState;
  todayISO: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startScroll: number } | null>(null);

  // ── 타임라인 범위 계산 (모든 과제 일정 + 표시연도 + 오늘 포함) ──
  const idxs: number[] = [];
  for (const it of items) {
    if (it.start_date) idxs.push(ymIndex(it.start_date));
    if (it.end_date) idxs.push(ymIndex(it.end_date));
  }
  const yearJan = state.year * 12;
  const yearDec = state.year * 12 + 11;
  const todayFrac = todayFracIndex(todayISO);
  const todayFloor = Math.floor(todayFrac);

  const minIdx =
    Math.min(yearJan, todayFloor, ...(idxs.length ? idxs : [yearJan])) -
    PAD_MONTHS;
  const maxIdx =
    Math.max(yearDec, todayFloor, ...(idxs.length ? idxs : [yearDec])) +
    PAD_MONTHS;
  const monthCount = maxIdx - minIdx + 1;
  const innerW = monthCount * MONTH_W;
  const todayLeft = (todayFrac - minIdx) * MONTH_W;
  const homeLeft = Math.max(0, (yearJan - minIdx) * MONTH_W); // "현재"(표시연도 1월) 스크롤 위치

  // 헤더용 월/연 목록
  const months = Array.from({ length: monthCount }, (_, i) => {
    const abs = minIdx + i;
    return { abs, year: Math.floor(abs / 12), month: (abs % 12) + 1 };
  });
  const yearGroups: { year: number; count: number }[] = [];
  for (const mo of months) {
    const last = yearGroups[yearGroups.length - 1];
    if (last && last.year === mo.year) last.count += 1;
    else yearGroups.push({ year: mo.year, count: 1 });
  }

  function scrollToYear(smooth: boolean) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: homeLeft, behavior: smooth ? "smooth" : "auto" });
  }

  // 마운트 / 연도 변경 시 해당 연도 1월로 정렬
  useEffect(() => {
    scrollToYear(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.year, minIdx]);

  // ── 드래그 패닝 ──
  function onPointerDown(e: React.PointerEvent) {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startScroll: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = scrollRef.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  }
  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    scrollRef.current?.releasePointerCapture(e.pointerId);
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed">
        <p className="text-sm font-medium">표시할 과제가 없습니다</p>
        <p className="text-xs">필터를 해제하거나 새 과제를 등록해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="bg-card flex overflow-hidden rounded-lg border text-sm">
        {/* ── 좌측 정보 컬럼 (남는 폭 흡수) ── */}
        <div className="grow min-w-0 border-r">
          {/* 헤더 */}
          <div
            className="text-muted-foreground flex items-end border-b text-xs"
            style={{ height: HEAD_H }}
          >
            {LEFT_COLS.map((c) => (
              <div
                key={c.key}
                className={cn(
                  "px-3 pb-2 font-medium",
                  c.width,
                  c.align === "center" && "text-center",
                )}
              >
                {c.sort ? (
                  <SortLabel state={state} sortKey={c.sort}>
                    {c.label}
                  </SortLabel>
                ) : (
                  <Link
                    href={dashboardHref(state, { sort: null })}
                    title="기본 정렬로 초기화"
                    className="hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          {/* 행 */}
          {items.map((item, idx) => {
            const mprs = MPRS_COLORS[item.mprs];
            return (
              <div
                key={item.id}
                className="hover:bg-muted/50 flex items-center border-b transition-colors last:border-b-0"
                style={{ height: ROW_H }}
              >
                <Cell col="w-12 shrink-0" center muted>
                  {idx + 1}
                </Cell>
                <Cell col="w-28 shrink-0">
                  <span
                    className="inline-flex h-5 items-center rounded px-1.5 text-xs font-semibold"
                    style={{ background: mprs.bg, color: mprs.text }}
                  >
                    {MPRS_LABEL[item.mprs]}
                  </span>
                </Cell>
                <Cell col="w-36 shrink-0" muted truncate>
                  {item.headquarter_name}
                </Cell>
                <Cell col="flex-1 min-w-0" truncate>
                  <Link
                    href={`/projects/${item.id}`}
                    className="font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                </Cell>
                <Cell col="w-28 shrink-0" muted truncate>
                  <span title={item.ai_techs.join(", ")}>
                    {item.ai_techs.length ? item.ai_techs.join(", ") : "-"}
                  </span>
                </Cell>
                <Cell col="w-24 shrink-0" truncate>
                  {LIFECYCLE_LABEL[item.lifecycle]}
                </Cell>
                <Cell col="w-16 shrink-0" center>
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: HEALTH_COLOR_VAR[item.health] }}
                    title={HEALTH_LABEL[item.health]}
                  />
                </Cell>
              </div>
            );
          })}
        </div>

        {/* ── 우측 타임라인 (드래그 패닝) ── */}
        <div
          ref={scrollRef}
          id="schedule-timeline"
          data-home={String(homeLeft)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="shrink-0 cursor-grab touch-pan-y select-none overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
          style={{ width: TIMELINE_W, scrollbarWidth: "none" }}
        >
          <div className="relative" style={{ width: innerW }}>
            {/* 헤더: 연도 줄 + 월 줄 */}
            <div
              className="text-muted-foreground border-b"
              style={{ height: HEAD_H }}
            >
              <div className="flex" style={{ height: HEAD_H / 2 }}>
                {yearGroups.map((g) => (
                  <div
                    key={g.year}
                    className="flex items-center justify-center border-l text-xs font-semibold first:border-l-0"
                    style={{ width: g.count * MONTH_W }}
                  >
                    {g.year}
                  </div>
                ))}
              </div>
              <div className="flex" style={{ height: HEAD_H / 2 }}>
                {months.map((mo) => (
                  <div
                    key={mo.abs}
                    className="flex items-center justify-center border-l text-[10px] first:border-l-0"
                    style={{ width: MONTH_W }}
                  >
                    {mo.month}
                  </div>
                ))}
              </div>
            </div>

            {/* 행별 막대 */}
            {items.map((item) => {
              const sIso = item.start_date ?? item.end_date;
              const eIso = item.end_date ?? item.start_date;
              const hasBar = sIso != null && eIso != null;
              const left = hasBar ? (ymIndex(sIso!) - minIdx) * MONTH_W : 0;
              const width = hasBar
                ? (ymIndex(eIso!) - ymIndex(sIso!) + 1) * MONTH_W
                : 0;
              return (
                <div
                  key={item.id}
                  className="relative border-b last:border-b-0"
                  style={{ height: ROW_H }}
                  title={`${item.start_date ?? "?"} ~ ${item.end_date ?? "?"}`}
                >
                  {/* 월 구분선 */}
                  <div className="pointer-events-none absolute inset-0 flex">
                    {months.map((mo) => (
                      <div
                        key={mo.abs}
                        className="border-border/30 border-l first:border-l-0"
                        style={{ width: MONTH_W }}
                      />
                    ))}
                  </div>
                  {hasBar && (
                    <div
                      className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full"
                      style={{ left, width, background: BAR_COLOR }}
                    />
                  )}
                </div>
              );
            })}

            {/* 오늘 세로선 (전체 높이) + 라벨 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-20"
              style={{
                left: todayLeft,
                width: 3,
                transform: "translateX(-50%)",
                background: TODAY_COLOR,
                opacity: 0.4,
              }}
            />
            <div
              aria-label="오늘"
              className="pointer-events-none absolute top-0 z-20 flex flex-col items-center"
              style={{ left: todayLeft, transform: "translateX(-50%)" }}
            >
              <span
                className="rounded px-1 text-[10px] font-bold leading-tight text-white"
                style={{ background: TODAY_COLOR }}
              >
                오늘
              </span>
              <span className="text-[10px] leading-none" style={{ color: TODAY_COLOR }}>
                ▼
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}

function Cell({
  col,
  children,
  center,
  muted,
  truncate,
}: {
  col: string;
  children: React.ReactNode;
  center?: boolean;
  muted?: boolean;
  truncate?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-3",
        col,
        center && "text-center",
        muted && "text-muted-foreground",
        truncate && "truncate",
      )}
    >
      {truncate ? <div className="truncate">{children}</div> : children}
    </div>
  );
}

/** 정렬 토글 href: 현재 컬럼이면 asc→desc→해제, 아니면 asc */
function sortHref(state: DashboardState, key: SortKey): string {
  if (state.sort === key) {
    return state.dir !== "desc"
      ? dashboardHref(state, { sort: key, dir: "desc" })
      : dashboardHref(state, { sort: null });
  }
  return dashboardHref(state, { sort: key, dir: "asc" });
}

function SortLabel({
  state,
  sortKey,
  children,
}: {
  state: DashboardState;
  sortKey: SortKey;
  children: React.ReactNode;
}) {
  const active = state.sort === sortKey;
  return (
    <Link
      href={sortHref(state, sortKey)}
      className={cn(
        "hover:text-foreground inline-flex items-center gap-1",
        active && "text-foreground",
      )}
    >
      {children}
      <span className={cn("text-[10px]", !active && "opacity-40")}>
        {active ? (state.dir === "desc" ? "▼" : "▲") : "↕"}
      </span>
    </Link>
  );
}
