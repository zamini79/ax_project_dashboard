import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 진행률 막대 (의존성 없는 경량 구현 — Radix 미사용).
 * value: 0~100
 */
function Progress({
  value = 0,
  indicatorClassName,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number;
  indicatorClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "bg-muted relative h-1.5 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "bg-primary h-full rounded-full transition-all",
          indicatorClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
