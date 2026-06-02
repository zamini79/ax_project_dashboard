import { ProjectCard } from "./project-card";
import type { GroupMode } from "./url";
import type { ProjectListItem } from "@/lib/repositories/projects";
import { MPRS_ORDER, MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";

/**
 * 카드 그리드 (5열, D-023). group=mprs면 MPRS별 그룹 헤더로 분리(D-021),
 * 아니면 평면 나열.
 */
export function ProjectGrid({
  items,
  group,
}: {
  items: ProjectListItem[];
  group: GroupMode;
}) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed">
        <p className="text-sm font-medium">표시할 과제가 없습니다</p>
        <p className="text-xs">필터를 해제하거나 새 과제를 등록해 보세요.</p>
      </div>
    );
  }

  if (group === "mprs") {
    return (
      <div className="flex flex-col gap-6">
        {MPRS_ORDER.map((mprs) => {
          const groupItems = items.filter((it) => it.mprs === mprs);
          if (groupItems.length === 0) return null;
          const color = MPRS_COLORS[mprs];
          return (
            <section key={mprs}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ background: color.main }}
                />
                <h2 className="text-sm font-semibold">{MPRS_LABEL[mprs]}</h2>
                <span className="text-muted-foreground text-xs">
                  {groupItems.length}건
                </span>
              </div>
              <Grid items={groupItems} hideMprsBadge />
            </section>
          );
        })}
      </div>
    );
  }

  return <Grid items={items} />;
}

function Grid({
  items,
  hideMprsBadge = false,
}: {
  items: ProjectListItem[];
  hideMprsBadge?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <ProjectCard
          key={item.id}
          item={item}
          hideMprsBadge={hideMprsBadge}
        />
      ))}
    </div>
  );
}
