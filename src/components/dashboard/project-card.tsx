import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProjectListItem } from "@/lib/repositories/projects";
import {
  LIFECYCLE_LABEL,
  HEALTH_COLOR_VAR,
  HEALTH_LABEL,
} from "@/lib/domain/lifecycle";
import { MPRS_COLORS, MPRS_LETTER, MPRS_LABEL } from "@/lib/domain/mprs";
import { formatYearMonth, formatRelativeDays } from "@/lib/domain/format";

/**
 * 과제 카드 (D-023, 5열 컴팩트).
 * 좌측 컬러바=헬스 / 상단 배지=MPRS·라이프사이클·본부 / 본문=과제명·PM·진행률·종료월·최근업데이트.
 * 그룹이 MPRS일 때는 MPRS 배지 제거(중복 회피) → hideMprsBadge.
 */
export function ProjectCard({
  item,
  hideMprsBadge = false,
}: {
  item: ProjectListItem;
  hideMprsBadge?: boolean;
}) {
  const mprs = MPRS_COLORS[item.mprs];
  const pmLabel =
    item.pms.length === 0
      ? "PM 미정"
      : item.pms.map((p) => p.name).join(", ");
  const pmDept = item.pms.find((p) => p.department)?.department ?? null;

  return (
    <Link href={`/projects/${item.id}`} className="group block">
      <Card className="relative h-full overflow-hidden pl-3 transition-shadow group-hover:shadow-md">
        {/* 좌측 헬스 컬러바 */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ background: HEALTH_COLOR_VAR[item.health] }}
          title={`헬스: ${HEALTH_LABEL[item.health]}`}
        />

        <div className="flex flex-col gap-2 p-3">
          {/* 상단 배지 */}
          <div className="flex flex-wrap items-center gap-1">
            {!hideMprsBadge && (
              <span
                className="inline-flex h-[18px] w-[18px] items-center justify-center rounded text-[11px] font-bold leading-none"
                style={{ background: mprs.bg, color: mprs.text }}
                title={MPRS_LABEL[item.mprs]}
              >
                {MPRS_LETTER[item.mprs]}
              </span>
            )}
            <Badge variant="secondary">{LIFECYCLE_LABEL[item.lifecycle]}</Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {item.headquarter_name}
            </Badge>
          </div>

          {/* 과제명 */}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {item.name}
          </h3>

          {/* PM · 부서 */}
          <p className="text-muted-foreground truncate text-xs">
            {pmLabel}
            {pmDept ? ` · ${pmDept}` : ""}
          </p>

          {/* 진행률 */}
          <div className="flex items-center gap-2">
            <Progress
              value={item.progress_pct}
              indicatorClassName=""
              className="flex-1"
            />
            <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
              {item.progress_pct}%
            </span>
          </div>

          {/* 종료월 · 최근 업데이트 */}
          <div className="text-muted-foreground flex items-center justify-between text-[11px]">
            <span>종료 {formatYearMonth(item.end_date)}</span>
            <span>{formatRelativeDays(item.last_update_date)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
