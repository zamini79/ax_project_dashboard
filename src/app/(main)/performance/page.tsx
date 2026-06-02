import Link from "next/link";
import {
  Building2,
  CalendarDays,
  User,
  Sparkles,
  Target,
  CircleDollarSign,
  Clock,
} from "lucide-react";

import { fetchProjectEffects } from "@/lib/repositories/effects";
import { effectsSummary } from "@/lib/domain/analytics";
import { Card } from "@/components/ui/card";
import { Bar } from "@/components/charts/charts";
import { formatBudgetEok } from "@/lib/domain/format";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";

export const dynamic = "force-dynamic";

const GREEN = "#16A34A";
const ACCENT = "#534AB7";
const CYAN = "#0EA5E9";
const metricStyle: Record<string, { color: string; Icon: typeof Target }> = {
  won: { color: GREEN, Icon: CircleDollarSign },
  time: { color: ACCENT, Icon: Clock },
  target: { color: CYAN, Icon: Target },
};

export default async function PerformancePage() {
  const effects = await fetchProjectEffects();
  const s = effectsSummary(effects);
  const recoverPct =
    s.investAppliedWon > 0
      ? Math.round((s.totalSaveCostWon / s.investAppliedWon) * 100)
      : 0;
  const maxSave = Math.max(1, ...s.items.map((e) => e.saveCostWon));
  const sortedBySave = [...s.items].sort((a, b) => b.saveCostWon - a.saveCostWon);

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-6 py-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">성과 현황</h1>
        <p className="text-muted-foreground mt-0.5 text-[12.5px]">
          완료·운영 적용된 과제가 실제 운영되며 만들어낸 효과 (운영{" "}
          {s.operatingCount} · 파일럿 {s.pilotCount})
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <StatCard
          label="운영 적용 과제"
          value={`${s.appliedCount}건`}
          sub={`운영 ${s.operatingCount} · 파일럿 ${s.pilotCount}`}
        />
        <StatCard
          label="연간 절감비용 (환산)"
          value={formatBudgetEok(s.totalSaveCostWon)}
          valueColor={GREEN}
          sub="확정·추정 합산"
        />
        <StatCard
          label="월 업무시간 절감"
          value={`${s.totalSaveHours.toLocaleString()}시간`}
          valueColor={ACCENT}
          sub="반복 업무 자동화 기준"
        />
        <StatCard
          label="연간 효과 / 관련 투자"
          value={`${recoverPct}%`}
          sub={`연 ${formatBudgetEok(s.totalSaveCostWon)} 효과 / ${formatBudgetEok(s.investAppliedWon)} 투자`}
        >
          <Bar value={Math.min(100, recoverPct)} color={GREEN} height={6} />
        </StatCard>
      </div>

      {/* 효과 카드 */}
      <div>
        <h2 className="mb-2.5 text-[13px] font-bold">과제별 운영 효과</h2>
        {s.items.length === 0 ? (
          <Card className="text-muted-foreground p-6 text-center text-sm">
            아직 등록된 운영 효과가 없습니다.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            {s.items.map((e) => {
              const mprs = MPRS_COLORS[e.mprs];
              return (
                <Link key={e.id} href={`/projects?detail=${e.projectId}`}>
                  <Card className="p-[18px] transition-shadow hover:shadow-md">
                    <div className="mb-2.5 flex items-center gap-2">
                      <span
                        className="inline-flex h-[22px] items-center rounded px-1.5 text-[11px] font-bold"
                        style={{ background: mprs.bg, color: mprs.text }}
                      >
                        {MPRS_LABEL[e.mprs]}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold">
                        {e.projectName}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                        style={
                          e.isPilot
                            ? { background: "#FEF3C7", color: "#92660A" }
                            : { background: "#DCFCE7", color: "#0E7A4E" }
                        }
                      >
                        {e.isPilot ? "파일럿 운영" : "운영 적용"}
                      </span>
                    </div>
                    <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-3 text-[11.5px]">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} />
                        {e.hq}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />
                        {e.appliedYm} 적용
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        {e.pms.join(", ") || "PM 미정"}
                      </span>
                    </div>
                    <div className="mb-3 flex gap-2">
                      {e.metrics.map((m, i) => {
                        const ms = metricStyle[m.kind] ?? metricStyle.target;
                        return (
                          <div
                            key={i}
                            className="min-w-0 flex-1 rounded-[11px] border p-2.5"
                            style={{ background: "#FAFAFB" }}
                          >
                            <div
                              className="mb-1.5 flex items-center gap-1.5"
                              style={{ color: ms.color }}
                            >
                              <ms.Icon size={15} />
                              <span className="text-muted-foreground text-[10.5px] font-semibold">
                                {m.label}
                              </span>
                            </div>
                            <div className="text-[17px] font-extrabold tabular-nums">
                              {m.value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {e.note && (
                      <p className="flex gap-1.5 text-xs leading-relaxed text-[#454A53]">
                        <Sparkles
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: GREEN }}
                        />
                        {e.note}
                      </p>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 환산 요약 + 안내 */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold">과제별 연간 절감비용 (환산)</h2>
            <span className="text-faint text-[11px]">단위: 억</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {sortedBySave.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <span className="w-[150px] truncate text-xs font-semibold">
                  {e.projectName}
                </span>
                <div className="flex-1">
                  <Bar
                    value={(e.saveCostWon / maxSave) * 100}
                    color={MPRS_COLORS[e.mprs].main}
                    height={10}
                  />
                </div>
                <span className="w-12 text-right text-[12.5px] font-bold tabular-nums">
                  {formatBudgetEok(e.saveCostWon)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4" style={{ background: "#FAFAFB" }}>
          <div className="mb-2.5 flex items-center gap-2">
            <Target size={17} style={{ color: ACCENT }} />
            <span className="text-[13px] font-bold">정량 효과지표 확장 예정</span>
          </div>
          <p className="text-muted-foreground m-0 text-[12.5px] leading-relaxed">
            현재는 운영 부서가 보고한{" "}
            <b className="text-foreground">절감 시간·비용·정확도</b> 중심으로
            집계합니다. 향후 ROI·도입 효과·만족도 등 정량 지표를 데이터 모델에
            추가해 과제 단위로 자동 추적하도록 고도화할 예정입니다.
          </p>
          <div className="mt-3.5 flex flex-col gap-2.5 border-t pt-3.5">
            {[
              ["측정 지표", "절감시간 · 절감비용 · 정확도"],
              ["집계 주기", "월간 (운영 부서 보고)"],
              ["검증", "재무·현업 교차 확인"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className="mt-1 text-2xl font-extrabold tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      {children && <div className="mt-2.5">{children}</div>}
    </Card>
  );
}
