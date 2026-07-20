import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ProjectUpdateItem,
  UpdateSource,
} from "@/lib/repositories/projects";
import {
  SOURCE_LABEL,
  SOURCE_ICON,
  PAGE_ROLE_LABEL,
} from "@/lib/domain/updates";
import { formatDateKo } from "@/lib/domain/format";
import { UpdateCompose } from "./update-compose";

export type SourceFilter = "all" | UpdateSource;

export function parseSourceFilter(value: string | undefined): SourceFilter {
  return value === "manual" || value === "atlassian_sync" ? value : "all";
}

/**
 * 우측 업데이트 타임라인 (D-024): 수동 + Atlassian 시간순 혼합,
 * 출처 아이콘 + 역할 배지 + 원본 링크. 출처 필터는 URL 기반.
 */
export function UpdateTimeline({
  projectId,
  updates,
  activeSource,
}: {
  projectId: string;
  updates: ProjectUpdateItem[];
  activeSource: SourceFilter;
}) {
  const visible =
    activeSource === "all"
      ? updates
      : updates.filter((u) => u.source === activeSource);

  // 오늘 날짜(로컬) — 모달 기본값
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <section className="min-w-0 flex-1">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="bg-muted inline-flex rounded-md p-0.5 text-xs font-medium">
          <SourceTab projectId={projectId} value="all" active={activeSource === "all"}>
            전체
          </SourceTab>
          <SourceTab
            projectId={projectId}
            value="manual"
            active={activeSource === "manual"}
          >
            수동
          </SourceTab>
          <SourceTab
            projectId={projectId}
            value="atlassian_sync"
            active={activeSource === "atlassian_sync"}
          >
            Confluence
          </SourceTab>
        </div>

        <UpdateCompose projectId={projectId} defaultDate={todayISO} />
      </div>

      {visible.length === 0 ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-sm">
          {updates.length === 0
            ? "아직 업데이트가 없습니다."
            : "해당 출처의 업데이트가 없습니다."}
        </div>
      ) : (
        <ol className="border-border relative ml-2 border-l pl-5">
          {visible.map((u) => (
            <li key={u.id} className="relative pb-5 last:pb-0">
              {/* 타임라인 점 */}
              <span className="bg-background border-border absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2" />
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span title={SOURCE_LABEL[u.source]}>{SOURCE_ICON[u.source]}</span>
                <Badge variant="secondary">{SOURCE_LABEL[u.source]}</Badge>
                {u.page_role && (
                  <Badge variant="outline">{PAGE_ROLE_LABEL[u.page_role]}</Badge>
                )}
                <span className="text-muted-foreground">
                  {formatDateKo(u.update_date)}
                </span>
                {u.author_name && (
                  <span className="text-muted-foreground">· {u.author_name}</span>
                )}
                {u.source_url && (
                  <a
                    href={u.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    원본
                  </a>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                {u.content}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SourceTab({
  projectId,
  value,
  active,
  children,
}: {
  projectId: string;
  value: SourceFilter;
  active: boolean;
  children: React.ReactNode;
}) {
  const href =
    value === "all" ? `/projects/${projectId}` : `/projects/${projectId}?source=${value}`;
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "rounded px-3 py-1 transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
