"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  addExecutionAction,
  deleteExecutionAction,
} from "@/app/projects/actions";

const inputCls =
  "border-border-strong bg-card focus-visible:ring-ring h-9 rounded-lg border px-2.5 text-[13px] outline-none focus-visible:ring-2";

/**
 * 과제 집행(지급) 실적 — 비정기 지급을 시기(년/월)·금액(원)으로 추가/삭제.
 * 비용이 없는 과제는 비워둘 수 있다.
 */
export function ExecutionEditor({
  projectId,
  entries,
}: {
  projectId: string;
  entries: { id: string; year_month: string; amount: number }[];
}) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [won, setWon] = useState(""); // 원 숫자 문자열(콤마 없음)
  const [rows, setRows] = useState(entries);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();

  const total = rows.reduce((a, e) => a + e.amount, 0);
  const sorted = [...rows].sort((a, b) =>
    a.year_month < b.year_month ? 1 : -1,
  );
  const cur = now.getFullYear();
  const years = [cur + 1, cur, cur - 1, cur - 2];
  const display = won === "" ? "" : Number(won).toLocaleString("ko-KR");

  function add() {
    setErr(undefined);
    const amt = Number(won) || 0;
    if (amt <= 0) {
      setErr("금액을 입력하세요.");
      return;
    }
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    start(async () => {
      const r = await addExecutionAction(projectId, ym, amt);
      if ("error" in r) {
        setErr(r.error);
        return;
      }
      setRows((prev) => [...prev, r.entry]);
      setWon("");
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      const r = await deleteExecutionAction(id, projectId);
      if ("error" in r) {
        setErr(r.error);
        return;
      }
      setRows((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold">집행 실적</span>
        <span className="text-muted-foreground text-[11.5px] tabular-nums">
          누계 {total.toLocaleString("ko-KR")}원
        </span>
      </div>

      {/* 추가 입력 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={cn(inputCls, "w-[84px]")}>
          {years.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={cn(inputCls, "w-[68px]")}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => setWon(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            // 금액 입력 중 Enter는 폼 저장이 아니라 '추가'로 동작
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (!pending) add();
            }
          }}
          placeholder="금액(원)"
          className={cn(inputCls, "min-w-0 flex-1 text-right")}
        />
        <button
          type="button"
          onClick={add}
          disabled={pending}
          className="bg-primary text-primary-foreground inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] font-bold disabled:opacity-50"
        >
          <Plus size={15} /> 추가
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}

      {/* 목록 */}
      {sorted.length === 0 ? (
        <p className="text-faint rounded-lg border border-dashed py-3 text-center text-[12px]">
          등록된 집행 실적이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {sorted.map((e) => (
            <li key={e.id} className="bg-card flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]">
              <span className="text-muted-foreground w-[88px] shrink-0 tabular-nums">
                {e.year_month.slice(0, 4)}년 {Number(e.year_month.slice(5))}월
              </span>
              <span className="flex-1 text-right font-semibold tabular-nums">
                {e.amount.toLocaleString("ko-KR")}원
              </span>
              <button
                type="button"
                onClick={() => remove(e.id)}
                disabled={pending}
                aria-label="삭제"
                className="text-muted-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
