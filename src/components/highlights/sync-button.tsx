"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Info, X } from "lucide-react";

import { syncConfluenceAction } from "@/app/(main)/highlights/actions";
import type { SyncResult } from "@/lib/repositories/confluence";
import { cn } from "@/lib/utils";

/**
 * '지금 동기화' 버튼 (금주 주요 사항).
 * 클릭 → Confluence 동기화 서버 액션 실행 → 결과 메시지를 배너로 표시.
 * 현재는 사내 IP 정책으로 비활성 상태라 안내 메시지가 뜬다. (사내 이관 후 실동작)
 */
export function SyncButton({ lastSynced }: { lastSynced?: string | null }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  function run() {
    setResult(null);
    start(async () => {
      setResult(await syncConfluenceAction());
    });
  }

  const tone =
    result?.status === "synced"
      ? "ok"
      : result?.status === "error"
        ? "error"
        : "info";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2.5">
        {lastSynced && (
          <span className="text-muted-foreground text-[11.5px]">
            마지막 동기화 {lastSynced}
          </span>
        )}
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className={cn(
            "border-border-strong bg-card hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors disabled:opacity-60",
          )}
        >
          <RefreshCw size={14} className={cn(pending && "animate-spin")} />
          {pending ? "동기화 중…" : "지금 동기화"}
        </button>
      </div>

      {result && (
        <div
          role="status"
          className={cn(
            "flex max-w-[420px] items-start gap-2 rounded-lg border px-3 py-2 text-[12px] leading-relaxed",
            tone === "ok" && "border-green-300 bg-green-50 text-green-800",
            tone === "error" && "border-red-300 bg-red-50 text-red-700",
            tone === "info" && "border-amber-300 bg-amber-50 text-amber-800",
          )}
        >
          <Info size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">
            {result.status === "synced" && result.inserted != null
              ? `동기화 완료 — 새 업데이트 ${result.inserted}건 반영`
              : result.message}
          </span>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setResult(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
