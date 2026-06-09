import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ProjectDetail } from "@/lib/repositories/projects";
import { HEALTH_LABEL, HEALTH_COLOR_VAR } from "@/lib/domain/lifecycle";
import { INVESTMENT_LABEL } from "@/lib/domain/investment";
import { PAGE_ROLE_LABEL } from "@/lib/domain/updates";
import {
  formatBudgetEok,
  executionRate,
  formatYearMonth,
} from "@/lib/domain/format";

/** 좌측 메타 패널 (280px). 순서 D-024: 진행률→본부→일정→투자비→PM→유관부서→연결페이지 */
export function MetaPanel({ project }: { project: ProjectDetail }) {
  const rate = executionRate(project.total_budget, project.executed_budget);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[280px]">
      {/* 진행률 + 헬스 */}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <Field>진행률</Field>
          <span
            className="inline-flex items-center gap-1 text-xs font-medium"
            title={`헬스: ${HEALTH_LABEL[project.health]}`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: HEALTH_COLOR_VAR[project.health] }}
            />
            {HEALTH_LABEL[project.health]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={project.progress_pct} className="flex-1" />
          <span className="w-10 text-right text-sm font-semibold tabular-nums">
            {project.progress_pct}%
          </span>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        {/* 주관 본부 */}
        <Row label="주관 본부">{project.headquarter_name}</Row>

        {/* 투자 유형 */}
        <Row label="투자 유형">
          {INVESTMENT_LABEL[project.investment_type]}
        </Row>

        {/* 일정 */}
        <Row label="일정">
          {formatYearMonth(project.start_date)} ~{" "}
          {formatYearMonth(project.end_date)}
        </Row>

        {/* 투자비 / 집행 */}
        <Row label="투자비 / 집행">
          <span>
            {formatBudgetEok(project.executed_budget)} /{" "}
            {formatBudgetEok(project.total_budget)}
            {rate != null && (
              <span className="text-muted-foreground ml-1">({rate}%)</span>
            )}
          </span>
        </Row>

        {/* PM */}
        <Row label="PM">
          {project.pms.length === 0 ? (
            <span className="text-muted-foreground">미정</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              {project.pms.map((pm) => (
                <span key={pm.name}>
                  {pm.name}
                  {pm.department && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {pm.department}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </Row>

        {/* 유관부서 / 담당자 */}
        <Row label="유관부서 / 담당자">
          {project.stakeholders.length === 0 ? (
            <span className="text-muted-foreground">없음</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              {project.stakeholders.map((s, i) => (
                <span key={`${s.department}-${i}`}>
                  {s.department}
                  <span className="text-muted-foreground">
                    {" "}
                    · {s.person ?? "담당자 미정"}
                  </span>
                </span>
              ))}
            </div>
          )}
        </Row>
      </Card>

      {/* 연결된 페이지 */}
      <Card className="p-4">
        <Field>연결된 페이지</Field>
        <div className="mt-2">
          {project.pages.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              연결된 Confluence 페이지 없음
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {project.pages.map((p) => (
                <li key={p.id} className="flex items-center gap-1.5 text-xs">
                  <Badge variant="outline">{PAGE_ROLE_LABEL[p.page_role]}</Badge>
                  <span className="truncate">{p.title ?? p.confluence_page_id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </aside>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground text-xs font-medium">{children}</span>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Field>{label}</Field>
      <div className="text-sm">{children}</div>
    </div>
  );
}
