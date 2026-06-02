import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { ProjectDetail } from "@/lib/repositories/projects";
import { LIFECYCLE_LABEL } from "@/lib/domain/lifecycle";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";

/** 상세 헤더: Breadcrumb · 과제명 / 라이프사이클 / MPRS / AI기술 / [편집] (§7.3) */
export function DetailHeader({ project }: { project: ProjectDetail }) {
  const mprs = MPRS_COLORS[project.mprs];

  return (
    <header className="bg-card border-b px-6 py-4">
      <nav className="text-muted-foreground mb-2 text-xs">
        <Link href="/" className="hover:text-foreground transition-colors">
          대시보드
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">과제 상세</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex h-5 items-center rounded px-1.5 text-xs font-bold"
              style={{ background: mprs.bg, color: mprs.text }}
            >
              {MPRS_LABEL[project.mprs]}
            </span>
            <Badge variant="secondary">
              {LIFECYCLE_LABEL[project.lifecycle]}
            </Badge>
            {project.ai_techs.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="truncate text-xl font-semibold">{project.name}</h1>
        </div>

        <Link
          href={`/projects/${project.id}/edit`}
          className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
        >
          편집
        </Link>
      </div>
    </header>
  );
}
