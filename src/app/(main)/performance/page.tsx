import Link from "next/link";

import { fetchProjectList } from "@/lib/repositories/projects";
import { performanceSummary } from "@/lib/domain/analytics";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  HEALTH_LABEL,
  HEALTH_COLOR_VAR,
  LIFECYCLE_LABEL,
  HEALTH_KPI_ORDER,
} from "@/lib/domain/lifecycle";
import { formatRelativeDays } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const projects = await fetchProjectList();
  const s = performanceSummary(projects);
  const maxHealth = Math.max(1, ...HEALTH_KPI_ORDER.map((h) => s.health[h]));

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-6 py-5">
      <p className="text-muted-foreground text-xs">
        진행 기반 성과 요약입니다. 정량 효과지표(ROI·도입 효과 등)는 데이터 모델 확장 후 고도화 예정입니다.
      </p>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="전체 과제" value={`${s.total}건`} />
        <StatCard
          label="완료"
          value={`${s.completed}건`}
          sub={`완료율 ${s.completedRate}%`}
        />
        <StatCard label="진행 중" value={`${s.inProgress}건`} />
        <StatCard label="평균 진행률" value={`${s.avgProgress}%`}>
          <Progress value={s.avgProgress} className="mt-2" />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* 헬스 분포 */}
        <Card className="p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">진행 현황(헬스) 분포</h2>
          <div className="flex flex-col gap-3">
            {HEALTH_KPI_ORDER.map((h) => (
              <div key={h} className="flex items-center gap-2">
                <span className="text-muted-foreground w-8 text-xs">
                  {HEALTH_LABEL[h]}
                </span>
                <div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.health[h] / maxHealth) * 100}%`,
                      background: HEALTH_COLOR_VAR[h],
                    }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-semibold tabular-nums">
                  {s.health[h]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* 위험·주의 과제 */}
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">
            주의가 필요한 과제{" "}
            <span className="text-muted-foreground font-normal">
              ({s.atRisk.length}건)
            </span>
          </h2>
          {s.atRisk.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              위험·주의 과제가 없습니다. 👍
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {s.atRisk.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="hover:bg-muted/50 flex items-center gap-3 rounded px-1 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: HEALTH_COLOR_VAR[p.health] }}
                      title={HEALTH_LABEL[p.health]}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {p.name}
                    </span>
                    <Badge variant="secondary">
                      {LIFECYCLE_LABEL[p.lifecycle]}
                    </Badge>
                    <span className="text-muted-foreground hidden w-24 truncate text-xs sm:block">
                      {p.headquarter_name}
                    </span>
                    <div className="w-24 shrink-0">
                      <Progress value={p.progress_pct} />
                    </div>
                    <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                      {p.progress_pct}%
                    </span>
                    <span className="text-muted-foreground hidden w-16 text-right text-xs lg:block">
                      {formatRelativeDays(p.last_update_date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      {children}
    </Card>
  );
}
