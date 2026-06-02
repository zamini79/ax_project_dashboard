"use client";

import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
  hint?: string | null;
}

/**
 * 기존 마스터에서 다중 선택 (체크박스 목록, 의존성 없음).
 * D-029의 '즉석 추가'는 다음 단계 — 지금은 선택만.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  emptyText = "선택 가능한 항목이 없습니다.",
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyText?: string;
}) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  if (options.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="max-h-40 overflow-y-auto rounded-md border p-1">
      {options.map((opt) => {
        const checked = value.includes(opt.id);
        return (
          <label
            key={opt.id}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
              checked ? "bg-accent" : "hover:bg-muted",
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.id)}
              className="accent-primary h-3.5 w-3.5"
            />
            <span>{opt.label}</span>
            {opt.hint && (
              <span className="text-muted-foreground text-xs">· {opt.hint}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
