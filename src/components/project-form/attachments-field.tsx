"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { ProjectAttachment } from "@/lib/repositories/attachments";

const MAX_BYTES = 25 * 1024 * 1024;

function formatBytes(n: number | null): string {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface PendingUpload {
  id: string;
  file: File;
}

/**
 * 과제 첨부파일 — 추가/삭제는 모두 "예약"만 하고 실제 반영은 폼 저장 시.
 * - 추가: 파일을 클라이언트에 임시 보관(서버에 올리지 않음) → 저장 시 업로드.
 *   저장하지 않으면(취소) 서버에 아무것도 남지 않음.
 * - 삭제: ✕로 예약만, 저장 시 실제 삭제. 취소 시 그대로 유지.
 * 부모(폼)에 예약된 업로드 파일/삭제 id를 콜백으로 전달한다.
 */
export function AttachmentsField({
  initial,
  onPendingUploadsChange,
  onPendingDeletesChange,
}: {
  projectId: string;
  initial: ProjectAttachment[];
  onPendingUploadsChange?: (files: File[]) => void;
  onPendingDeletesChange?: (ids: string[]) => void;
}) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: File[]) {
    setError(undefined);
    if (files.length === 0) return;
    const valid = files.filter((f) => f.size <= MAX_BYTES);
    const tooBig = files.filter((f) => f.size > MAX_BYTES);
    if (tooBig.length > 0) {
      setError(
        `25MB 초과로 제외됨: ${tooBig.map((f) => f.name).join(", ")}`,
      );
    }
    if (valid.length === 0) return;
    setPendingUploads((prev) => {
      const next = [
        ...prev,
        ...valid.map((file) => ({ id: crypto.randomUUID(), file })),
      ];
      onPendingUploadsChange?.(next.map((u) => u.file));
      return next;
    });
  }

  function removeUpload(id: string) {
    setPendingUploads((prev) => {
      const next = prev.filter((u) => u.id !== id);
      onPendingUploadsChange?.(next.map((u) => u.file));
      return next;
    });
  }

  /** 기존(저장된) 첨부 삭제 예약 토글 — 실제 삭제는 폼 저장 시 */
  function toggleDelete(id: string) {
    setError(undefined);
    setPendingDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onPendingDeletesChange?.([...next]);
      return next;
    });
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []));
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!dragging) setDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  async function copyLink(a: ProjectAttachment) {
    try {
      const absolute = new URL(a.url, window.location.origin).href;
      await navigator.clipboard.writeText(absolute);
      setCopiedId(a.id);
      window.setTimeout(() => setCopiedId((c) => (c === a.id ? null : c)), 1500);
    } catch {
      setError("링크 복사에 실패했습니다.");
    }
  }

  const isEmpty = initial.length === 0 && pendingUploads.length === 0;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex flex-col gap-[7px] rounded-[10px] transition-colors",
        dragging && "outline-primary bg-primary/5 outline-dashed outline-2",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold">
          첨부파일
        </span>
        <label className="border-border-strong text-foreground hover:bg-muted inline-flex cursor-pointer items-center gap-1 rounded-[9px] border px-2.5 py-1 text-[12px] font-semibold transition-colors">
          <span className="text-primary">＋</span> 파일 추가
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={onPick}
          />
        </label>
      </div>

      {isEmpty ? (
        <p
          className={cn(
            "text-faint rounded-[9px] border border-dashed px-3 py-4 text-center text-[12px]",
            dragging && "border-primary text-primary",
          )}
        >
          {dragging
            ? "여기에 놓으면 추가됩니다"
            : "파일을 끌어다 놓거나 '파일 추가'로 추가 (여러 개 가능, 각 25MB 이하)"}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {/* 추가 예정(임시 보관 — 저장 시 업로드) */}
          {pendingUploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded-[9px] border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                {u.file.name}
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-emerald-600">
                저장 시 업로드
              </span>
              <span className="text-faint shrink-0 text-[11px] tabular-nums">
                {formatBytes(u.file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeUpload(u.id)}
                aria-label="추가 취소"
                className="text-muted-foreground hover:bg-muted shrink-0 rounded-md px-1.5 py-1 text-[12px] transition-colors hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}

          {/* 저장된 첨부 */}
          {initial.map((a) => {
            const marked = pendingDelete.has(a.id);
            return (
              <li
                key={a.id}
                className={cn(
                  "border-border-strong bg-card flex items-center gap-2 rounded-[9px] border px-3 py-2",
                  marked && "border-red-200 bg-red-50/40",
                )}
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13px] font-medium hover:underline",
                    marked && "text-muted-foreground line-through",
                  )}
                  title={a.fileName}
                >
                  {a.fileName}
                </a>
                {marked ? (
                  <span className="shrink-0 text-[11px] font-semibold text-red-600">
                    저장 시 삭제
                  </span>
                ) : (
                  a.sizeBytes != null && (
                    <span className="text-faint shrink-0 text-[11px] tabular-nums">
                      {formatBytes(a.sizeBytes)}
                    </span>
                  )
                )}
                {!marked && (
                  <button
                    type="button"
                    onClick={() => copyLink(a)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors"
                  >
                    {copiedId === a.id ? "복사됨" : "링크 복사"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleDelete(a.id)}
                  aria-label={marked ? "삭제 취소" : "첨부 삭제 예약"}
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-1 text-[12px] transition-colors",
                    marked
                      ? "hover:bg-muted border px-2 text-[11px] font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-red-600",
                  )}
                >
                  {marked ? "되돌리기" : "✕"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(pendingUploads.length > 0 || pendingDelete.size > 0) && (
        <p className="text-muted-foreground text-[12px]">
          저장 시 적용됩니다 (취소 시 반영되지 않음).
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
