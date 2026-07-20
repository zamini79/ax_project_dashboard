import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Donut } from "@/components/charts/charts";
import type { ProjectListItem } from "@/lib/repositories/projects";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import {
  LIFECYCLE_LABEL,
  HEALTH_LABEL,
  HEALTH_COLOR_VAR,
  displayHealth,
  isOverdue,
} from "@/lib/domain/lifecycle";
import { dashboardHref, type DashboardState } from "./url";

/** ISO "YYYY-MM-DD" → "YY.MM" (없으면 null) */
function ym(iso: string | null): string | null {
  return iso ? `${iso.slice(2, 4)}.${iso.slice(5, 7)}` : null;
}

/**
 * 과제 카드 그리드 뷰 — 표/맵과 나란한 3번째 뷰.
 * 레이아웃은 카드 킷 #22(뮤트 인트로 줄 + 헤드라인 + 본문) 기반,
 * 우측에 진행률 링(MPRS 색). 좌측 컬러바=헬스, 상단 배지=MPRS·라이프사이클 규칙 유지.
 */
export function ProjectCards({
  items,
  state,
  todayISO,
}: {
  items: ProjectListItem[];
  state: DashboardState;
  todayISO: string;
}) {
  if (items.length === 0) {
    return (
      <Card className="text-muted-foreground p-8 text-center text-sm">
        조건에 맞는 과제가 없습니다.
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <ProjectCard
          key={item.id}
          item={item}
          state={state}
          todayISO={todayISO}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  item,
  state,
  todayISO,
}: {
  item: ProjectListItem;
  state: DashboardState;
  todayISO: string;
}) {
  const mprs = MPRS_COLORS[item.mprs];
  const dh = displayHealth(item.health, item.attention_active);
  const pct = Math.min(100, Math.max(0, item.progress_pct));
  const start = ym(item.start_date);
  const end = ym(item.end_date);
  const period = start || end ? `${start ?? "?"} ~ ${end ?? "?"}` : "일정 미정";

  return (
    <Link href={dashboardHref(state, { detail: item.id })} scroll={false}>
      <Card className="p-hovercard relative flex h-full flex-col overflow-hidden rounded-[20px] p-[18px] pl-[22px]">
        {/* 좌측 헬스 컬러바 */}
        <span
          className="absolute inset-y-0 left-0 w-[5px]"
          style={{ background: HEALTH_COLOR_VAR[dh] }}
          title={HEALTH_LABEL[dh]}
          aria-hidden
        />

        {/* 상단 배지 줄 — MPRS · 라이프사이클 (+ 지연 / 확인 필요) */}
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10.5px] font-bold"
            style={{ background: mprs.bg, color: mprs.text }}
          >
            {MPRS_LABEL[item.mprs]}
          </span>
          <span className="bg-muted text-muted-foreground inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10.5px] font-semibold">
            {LIFECYCLE_LABEL[item.lifecycle]}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {isOverdue(item, todayISO) && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                style={{ background: "var(--health-red)" }}
                title={`종료 예정일(${item.end_date})이 지났으나 미완료`}
              >
                지연
              </span>
            )}
            {item.attention_active && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                style={{ background: "#FEF3C7", color: "#B45309" }}
                title="확인 필요"
              >
                <AlertTriangle size={10} />
                확인
              </span>
            )}
          </span>
        </div>

        {/* 본문 — 좌: 인트로(본부)·헤드라인·PM·기간 / 우: 진행률 링 */}
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-[11.5px]">
              {item.headquarter_name}
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-[14px] leading-snug font-bold">
              {item.name}
            </h3>
            <p className="text-muted-foreground mt-1.5 truncate text-[11.5px]">
              {item.pms.length
                ? item.pms.map((p) => p.name).join(", ")
                : "PM 미지정"}
            </p>
            <p className="text-faint mt-0.5 text-[11px] tabular-nums">
              {period}
            </p>
          </div>
          <div className="shrink-0 self-center">
            <Donut
              size={56}
              thickness={6}
              gap={0}
              ariaLabel={`진행률 ${pct}%`}
              segments={[
                { value: pct, color: mprs.main },
                { value: 100 - pct, color: "transparent" },
              ]}
            >
              <span className="text-[12px] font-extrabold tabular-nums">
                {pct}%
              </span>
            </Donut>
          </div>
        </div>
      </Card>
    </Link>
  );
}
