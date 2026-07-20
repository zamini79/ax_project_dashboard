import Link from "next/link";
import { Building2, User, CalendarDays, AlertTriangle } from "lucide-react";

import {
  fetchWeeklyHighlights,
  fetchProjectDetail,
  type WeeklyHighlightItem,
} from "@/lib/repositories/projects";
import { fetchEffectForProject } from "@/lib/repositories/effects";
import { ProjectDetailDrawer } from "@/components/project-detail/project-detail-drawer";
import { Card } from "@/components/ui/card";
import { MPRS_COLORS, MPRS_LABEL } from "@/lib/domain/mprs";
import {
  LIFECYCLE_LABEL,
  HEALTH_LABEL,
  HEALTH_COLOR_VAR,
  displayHealth,
  type Health,
} from "@/lib/domain/lifecycle";

export const dynamic = "force-dynamic";

/** 위험 → 주의 → 정상 → 완료 → 미진행 순으로 강조 (상단에 조치 필요 과제) */
const HEALTH_RANK: Record<Health, number> = {
  red: 0,
  yellow: 1,
  green: 2,
  completed: 3,
  none: 4,
};

/** content 앞머리의 [주차·날짜] 태그와 본문을 분리 */
function splitTag(content: string): { tag: string | null; body: string } {
  const m = content.match(/^\s*\[([^\]]+)\]\s*([\s\S]*)$/);
  return m ? { tag: m[1], body: m[2] } : { tag: null, body: content };
}

/**
 * 요약 본문을 문장 단위 줄(불릿)로 분리. 마침표+공백(". ")에서 끊는다.
 * 소수점(v0.74)·날짜(7/13)에는 뒤 공백이 없어 잘리지 않는다.
 */
function toLines(body: string): string[] {
  return body
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

type SearchParams = Promise<{ detail?: string; only?: string }>;

export default async function HighlightsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const items = await fetchWeeklyHighlights();
  const onlyAttention = sp.only === "attention";

  const attentionCount = items.filter((i) => i.attention.active).length;
  const latestDate = items.reduce(
    (acc, i) => (i.latest_date > acc ? i.latest_date : acc),
    "",
  );

  const base = onlyAttention ? items.filter((i) => i.attention.active) : items;
  const sorted = [...base].sort((a, b) => {
    // 확인 필요 과제를 최상단으로
    if (a.attention.active !== b.attention.active)
      return a.attention.active ? -1 : 1;
    const r = HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
    if (r !== 0) return r;
    if (a.latest_date !== b.latest_date)
      return a.latest_date < b.latest_date ? 1 : -1;
    return a.name < b.name ? -1 : 1;
  });

  const detail = sp.detail ? await fetchProjectDetail(sp.detail) : null;
  const detailEffect = detail ? await fetchEffectForProject(detail.id) : null;
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 px-6 py-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">금주 주요 사항</h1>
        <p className="text-muted-foreground mt-0.5 text-[12.5px]">
          과제별 최신 진척·이슈를 한눈에 모아 봅니다. (Confluence 주간보고 동기화
          내용 기준)
        </p>
      </div>

      {/* 요약 스트립 */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <StatCard label="진척 반영 과제" value={`${items.length}건`} sub="업데이트 1건 이상" />
        <Link href={onlyAttention ? "/highlights" : "/highlights?only=attention"}>
          <StatCard
            label="확인 필요 과제"
            value={`${attentionCount}건`}
            valueColor={attentionCount > 0 ? "#B45309" : undefined}
            sub={onlyAttention ? "↩ 전체 보기" : "이슈·확인 항목 · 눌러서 필터"}
            highlight={onlyAttention}
          />
        </Link>
        <StatCard
          label="최신 반영일"
          value={latestDate || "-"}
          sub="가장 최근 동기화된 주차"
        />
      </div>

      {sorted.length === 0 ? (
        <Card className="text-muted-foreground p-8 text-center text-sm">
          {onlyAttention
            ? "확인 필요로 표시된 과제가 없습니다."
            : "아직 반영된 진척 내용이 없습니다."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
          {sorted.map((it) => (
            <HighlightCard key={it.id} it={it} />
          ))}
        </div>
      )}

      {detail && (
        <ProjectDetailDrawer
          detail={detail}
          effect={detailEffect}
          closeHref="/highlights"
          todayISO={todayISO}
        />
      )}
    </main>
  );
}

function HighlightCard({ it }: { it: WeeklyHighlightItem }) {
  const mprs = MPRS_COLORS[it.mprs];
  const { tag, body } = splitTag(it.latest_content);
  const attn = it.attention;
  const dh = displayHealth(it.health, attn.active);
  return (
    <Link href={`/highlights?detail=${it.id}`}>
      <Card
        className="p-hovercard relative overflow-hidden p-[18px] pl-[22px]"
        style={
          attn.active
            ? { boxShadow: "inset 0 0 0 1.5px #F59E0B", background: "#FFFCF5" }
            : undefined
        }
      >
        {/* 좌측 헬스 컬러바 */}
        <span
          className="absolute inset-y-0 left-0 w-[5px]"
          style={{ background: HEALTH_COLOR_VAR[dh] }}
          aria-hidden
        />
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-flex h-[22px] shrink-0 items-center rounded px-1.5 text-[11px] font-bold"
            style={{ background: mprs.bg, color: mprs.text }}
          >
            {MPRS_LABEL[it.mprs]}
          </span>
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold">
            {it.name}
          </span>
          {attn.active && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
              style={{ background: "#FEF3C7", color: "#B45309" }}
              title={attn.source === "manual" ? "PM 지정" : "주간보고 이슈 자동 감지"}
            >
              <AlertTriangle size={11} />
              확인 필요
            </span>
          )}
        </div>

        <div className="text-muted-foreground mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
          <span
            className="inline-flex items-center gap-1 font-semibold"
            style={{ color: healthTextColor(dh) }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: HEALTH_COLOR_VAR[dh] }}
            />
            {HEALTH_LABEL[dh]}
          </span>
          <span className="text-border-strong">·</span>
          <span>{LIFECYCLE_LABEL[it.lifecycle]}</span>
          <span className="flex items-center gap-1">
            <Building2 size={13} />
            {it.headquarter_name}
          </span>
          <span className="flex items-center gap-1">
            <User size={13} />
            {it.pms.join(", ") || "PM 미정"}
          </span>
        </div>

        <div className="mb-1.5 flex items-center gap-1.5">
          {tag && (
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-bold">
              <CalendarDays size={11} />
              {tag}
            </span>
          )}
          {it.update_count > 1 && (
            <span className="text-faint text-[10.5px]">
              업데이트 {it.update_count}건
            </span>
          )}
        </div>
        {attn.active && attn.note && (
          <p
            className="mb-2 flex gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium leading-relaxed"
            style={{ background: "#FEF3C7", color: "#7C4A03" }}
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{attn.note}</span>
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {toLines(body).map((ln, i) => (
            <li
              key={i}
              className="flex gap-1.5 text-[12.5px] leading-relaxed text-[#454A53]"
            >
              <span
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#B8BDC7]"
                aria-hidden
              />
              <span>{ln}</span>
            </li>
          ))}
        </ul>
      </Card>
    </Link>
  );
}

function healthTextColor(h: Health): string {
  if (h === "red") return "var(--health-red)";
  if (h === "yellow") return "#92660A";
  if (h === "green") return "var(--health-green)";
  return "var(--muted-foreground)";
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className="p-4 transition-colors"
      style={
        highlight
          ? { boxShadow: "inset 0 0 0 1.5px #F59E0B", background: "#FFFCF5" }
          : undefined
      }
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className="mt-1 text-2xl font-extrabold tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </Card>
  );
}
