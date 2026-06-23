"use client";

import { useRef, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import {
  uploadAttachmentAction,
  deleteAttachmentAction,
} from "@/app/projects/actions";
import type { ProjectAttachment } from "@/lib/repositories/attachments";

function formatBytes(n: number | null): string {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** 과제 첨부파일 — 업로드 / 목록 / 링크 복사 / 삭제 (편집 모드, 저장된 과제) */
export function AttachmentsField({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectAttachment[];
}) {
  const [items, setItems] = useState<ProjectAttachment[]>(initial);
  const [error, setError] = useState<string>();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadAttachmentAction(projectId, fd);
      if ("error" in res) setError(res.error);
      else setItems((prev) => [res.attachment, ...prev]);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onDelete(id: string) {
    setError(undefined);
    startTransition(async () => {
      const res = await deleteAttachmentAction(id, projectId);
      if ("error" in res) setError(res.error);
      else setItems((prev) => prev.filter((a) => a.id !== id));
    });
  }

  async function copyLink(a: ProjectAttachment) {
    try {
      await navigator.clipboard.writeText(a.url);
      setCopiedId(a.id);
      window.setTimeout(() => setCopiedId((c) => (c === a.id ? null : c)), 1500);
    } catch {
      setError("링크 복사에 실패했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold">
          첨부파일
        </span>
        <label
          className={cn(
            "border-border-strong text-foreground hover:bg-muted inline-flex cursor-pointer items-center gap-1 rounded-[9px] border px-2.5 py-1 text-[12px] font-semibold transition-colors",
            pending && "pointer-events-none opacity-60",
          )}
        >
          <span className="text-primary">＋</span> 파일 추가
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={onPick}
            disabled={pending}
          />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="text-faint rounded-[9px] border border-dashed px-3 py-3 text-center text-[12px]">
          첨부된 파일이 없습니다. (최대 25MB)
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((a) => (
            <li
              key={a.id}
              className="border-border-strong bg-card flex items-center gap-2 rounded-[9px] border px-3 py-2"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-[13px] font-medium hover:underline"
                title={a.fileName}
              >
                {a.fileName}
              </a>
              {a.sizeBytes != null && (
                <span className="text-faint shrink-0 text-[11px] tabular-nums">
                  {formatBytes(a.sizeBytes)}
                </span>
              )}
              <button
                type="button"
                onClick={() => copyLink(a)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors"
              >
                {copiedId === a.id ? "복사됨" : "링크 복사"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(a.id)}
                disabled={pending}
                aria-label="첨부 삭제"
                className="text-muted-foreground hover:bg-muted shrink-0 rounded-md px-1.5 py-1 text-[12px] transition-colors hover:text-red-600 disabled:opacity-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
