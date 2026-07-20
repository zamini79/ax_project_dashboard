"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check } from "lucide-react";

import { setAttentionAction } from "@/app/projects/actions";
import { resolveAttention, type AttentionOverride } from "@/lib/domain/attention";
import { cn } from "@/lib/utils";

const OPTIONS: { value: AttentionOverride; label: string }[] = [
  { value: "auto", label: "자동" },
  { value: "on", label: "확인 필요" },
  { value: "off", label: "해제" },
];

/**
 * '확인 필요' 하이브리드 컨트롤 (과제 상세).
 * 자동(주간보고 이슈 감지) / 확인 필요(강조) / 해제를 PM이 지정.
 * 일정 신호등(health)과 독립된 축.
 */
export function AttentionControl({
  projectId,
  override,
  note,
  autoIssue,
}: {
  projectId: string;
  override: AttentionOverride;
  note: string | null;
  autoIssue: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  const [draftNote, setDraftNote] = useState(note ?? "");

  const state = resolveAttention(override, autoIssue, note);

  function save(next: AttentionOverride, nextNote: string | null) {
    setErr(undefined);
    start(async () => {
      const r = await setAttentionAction(projectId, next, nextNote);
      if ("error" in r) {
        setErr(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="rounded-[12px] border p-3.5"
      style={
        state.active
          ? { borderColor: "#F59E0B", background: "#FFFCF5" }
          : undefined
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-bold">
          <AlertTriangle
            size={14}
            style={{ color: state.active ? "#B45309" : "var(--muted-foreground)" }}
          />
          확인 필요 상태
        </span>
        {state.active ? (
          <span
            className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
            style={{ background: "#FEF3C7", color: "#B45309" }}
          >
            {state.source === "manual" ? "지정됨(PM)" : "자동 감지"}
          </span>
        ) : (
          <span className="text-faint text-[10.5px] font-semibold">해당 없음</span>
        )}
      </div>

      {/* 세그먼트 선택 */}
      <div className="bg-muted inline-flex rounded-lg p-0.5">
        {OPTIONS.map((o) => {
          const active = override === o.value;
          return (
            <button
              key={o.value}
              type="button"
              disabled={pending}
              onClick={() =>
                save(o.value, o.value === "on" ? draftNote || null : null)
              }
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors disabled:opacity-50",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* 자동 감지된 이슈 안내 */}
      {override === "auto" && autoIssue && (
        <p className="text-muted-foreground mt-2 text-[11.5px] leading-relaxed">
          주간보고에서 감지된 이슈: <span className="text-[#7C4A03]">{autoIssue}</span>
        </p>
      )}
      {override === "auto" && !autoIssue && (
        <p className="text-faint mt-2 text-[11.5px]">
          최신 주간보고에 감지된 이슈가 없습니다.
        </p>
      )}

      {/* 수동 지정 시 메모 */}
      {override === "on" && (
        <div className="mt-2.5 flex flex-col gap-1.5">
          <textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="확인이 필요한 사유 (선택)"
            rows={2}
            className="border-border-strong bg-card focus-visible:ring-ring w-full resize-none rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none focus-visible:ring-2"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => save("on", draftNote || null)}
            className="bg-primary text-primary-foreground inline-flex h-8 w-fit items-center gap-1 self-end rounded-lg px-3 text-[12px] font-bold disabled:opacity-50"
          >
            <Check size={14} /> 사유 저장
          </button>
        </div>
      )}

      {err && <p className="mt-1.5 text-xs text-red-600">{err}</p>}
    </div>
  );
}
