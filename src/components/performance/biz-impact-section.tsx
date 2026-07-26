import Link from "next/link";
import { Calculator, Activity, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { MiniBars } from "@/components/charts/charts";
import type { ProjectBizImpact } from "@/lib/repositories/biz-impact";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import { LIFECYCLE_LABEL } from "@/lib/domain/lifecycle";
import { formatManwon } from "@/lib/domain/format";

const GREEN = "var(--health-green)";
const ACCENT = "var(--primary)";
const RECENT = 14; // 추이에 표시할 최근 기간 수

/**
 * 사용성 지표 기반 Biz Impact 섹션 (성과 현황).
 * 과제별로 누계 절감효과·사용량·기간 추이와 함께 산정기준을 그대로 노출한다.
 * (수기 보고 기반 project_effects와 별개 축 — 사용량 로그 실측)
 */
export function BizImpactSection({ items }: { items: ProjectBizImpact[] }) {
  if (items.length === 0) return null;

  const totalImpact = items.reduce((s, i) => s + i.totalImpactManwon, 0);
  const totalCalls = items.reduce((s, i) => s + i.totalCalls, 0);
  const priced = items.filter((i) => i.unitValueManwon != null).length;
  const asOf = items.find((i) => i.asOf)?.asOf ?? null;

  return (
    <div>
      <div className="mb-2.5 flex items-end justify-between">
        <div>
          <h2 className="text-[13px] font-bold">사용성 지표 기반 Biz Impact</h2>
          <p className="text-muted-foreground mt-0.5 text-[11.5px]">
            운영 중 서비스의 실제 사용량(API Call)에 산정단가를 적용한 절감효과
            {asOf && ` · ${asOf} 기준`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-muted-foreground text-[10.5px]">누계 절감효과</p>
            <p
              className="text-[17px] font-extrabold tabular-nums"
              style={{ color: GREEN }}
            >
              {formatManwon(totalImpact)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10.5px]">총 사용 건수</p>
            <p className="text-[17px] font-extrabold tabular-nums">
              {totalCalls.toLocaleString("ko-KR")}건
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10.5px]">대상 과제</p>
            <p className="text-[17px] font-extrabold tabular-nums">
              {items.length}건
              {priced < items.length && (
                <span className="text-faint text-[11px] font-semibold">
                  {" "}
                  (단가 {items.length - priced} 미정)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {items.map((it) => (
          <ImpactCard key={it.projectId} it={it} />
        ))}
      </div>
    </div>
  );
}

function ImpactCard({ it }: { it: ProjectBizImpact }) {
  const mprs = MPRS_COLORS[it.mprs];
  const recent = it.points.slice(-RECENT);
  const unpriced = it.unitValueManwon == null;
  const kindLabel = it.points[0]?.periodKind === "month" ? "월별" : "주차별";
  const latestBreakdown = [...it.points].reverse().find((p) => p.breakdown)?.breakdown;

  return (
    <Card className="p-[18px]">
      {/* 헤더: 과제명 + 배지 */}
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="inline-flex h-[22px] shrink-0 items-center rounded px-1.5 text-[11px] font-bold"
          style={{ background: mprs.bg, color: mprs.text }}
        >
          {MPRS_LABEL[it.mprs]}
        </span>
        <Link
          href={`/performance?detail=${it.projectId}`}
          className="min-w-0 flex-1 truncate text-[14.5px] font-bold hover:underline"
        >
          {it.projectName}
        </Link>
        <span className="bg-muted text-muted-foreground shrink-0 rounded px-2 py-0.5 text-[10.5px] font-bold">
          {LIFECYCLE_LABEL[it.lifecycle]}
        </span>
      </div>

      {/* 핵심 수치 */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Metric
          Icon={TrendingUp}
          color={unpriced ? "var(--muted-foreground)" : GREEN}
          label="누계 절감효과"
          value={unpriced ? "산정 전" : formatManwon(it.totalImpactManwon)}
        />
        <Metric
          Icon={Activity}
          color={ACCENT}
          label={`총 ${it.unitLabel}`}
          value={`${it.totalCalls.toLocaleString("ko-KR")}건`}
        />
        <Metric
          Icon={Calculator}
          color="#0EA5E9"
          label="1건당 단가"
          value={unpriced ? "미정" : `${it.unitValueManwon!.toLocaleString("ko-KR")}만원`}
        />
      </div>

      {/* 기간 추이 */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-muted-foreground text-[11px] font-semibold">
            {kindLabel} {it.unitLabel} 추이 (최근 {recent.length})
          </span>
          <span className="text-faint text-[10.5px]">{it.periodLabel}</span>
        </div>
        <MiniBars
          data={recent.map((p) => ({ label: p.label, value: p.callCount }))}
          height={48}
          barW={12}
          gap={5}
          color="#D3D8E0"
          accentLast={ACCENT}
          showValues
          ariaLabel={`${it.projectName} ${kindLabel} ${it.unitLabel} 추이`}
        />
        <div className="text-faint mt-1 flex justify-between text-[9.5px]">
          <span>{recent[0]?.label}</span>
          <span>{recent[recent.length - 1]?.label}</span>
        </div>
      </div>

      {/* 세부 지표 (JSA 추천 유형 등) */}
      {latestBreakdown && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Object.entries(latestBreakdown).map(([k, v]) => (
            <span
              key={k}
              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10.5px] font-semibold"
            >
              {k} {v}
            </span>
          ))}
        </div>
      )}

      {/* 산정기준 — 원본 엑셀 문구 그대로 */}
      {it.basis.length > 0 && (
        <div
          className="rounded-[10px] border p-2.5"
          style={{ background: "#FAFAFB" }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <Calculator size={12} className="text-muted-foreground" />
            <span className="text-[11px] font-bold">Biz Impact 산정기준</span>
            {it.sourceFile && (
              <span className="text-faint ml-auto max-w-[45%] truncate text-[9.5px]" title={it.sourceFile}>
                {it.sourceFile}
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-1">
            {it.basis.map((b, i) => (
              <li
                key={i}
                className="flex gap-1.5 text-[11.5px] leading-relaxed text-[#454A53]"
              >
                <span
                  className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#B8BDC7]"
                  aria-hidden
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function Metric({
  Icon,
  color,
  label,
  value,
}: {
  Icon: typeof Calculator;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[11px] border p-2.5" style={{ background: "#FAFAFB" }}>
      <div className="mb-1.5 flex items-center gap-1.5" style={{ color }}>
        <Icon size={14} />
        <span className="text-muted-foreground truncate text-[10.5px] font-semibold">
          {label}
        </span>
      </div>
      <div className="text-[15px] font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
