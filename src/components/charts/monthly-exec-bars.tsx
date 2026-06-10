"use client";

/**
 * 월별 집행 추이 막대 — MiniBars 외관을 그대로 따르되, 막대 위에 마우스를 올리면
 * 해당 월 집행 과제 목록(과제명·금액)을 팝업으로 보여준다.
 * 팝업은 overflow 컨테이너에 잘리지 않도록 createPortal로 body에 fixed 렌더.
 */

import { useState } from "react";
import { createPortal } from "react-dom";

import { formatBudgetEok } from "@/lib/domain/format";

export interface MonthlyExecBar {
  label: string; // "26.01"
  value: number; // 억 (막대 높이·라벨)
  projects: { name: string; amount: number }[]; // amount: 원, 금액 내림차순
}

interface HoverState {
  i: number;
  x: number; // 막대 중앙 X (viewport)
  y: number; // 막대 상단 Y (viewport)
}

export function MonthlyExecBars({
  data,
  height = 120,
  barW = 28,
  gap = 12,
  accent,
  ariaLabel,
}: {
  data: MonthlyExecBar[];
  height?: number;
  barW?: number;
  gap?: number;
  accent?: string;
  ariaLabel?: string;
}) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const active = hover ? data[hover.i] : null;

  return (
    <div
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      style={{ display: "flex", alignItems: "flex-end", gap }}
      onMouseLeave={() => setHover(null)}
    >
      {data.map((d, i) => {
        const isLast = i === data.length - 1; // 당월(가장 최근) 강조
        const barColor = accent ?? "#534AB7";
        const hasProjects = d.projects.length > 0;
        const onEnter = (el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          setHover({ i, x: r.left + r.width / 2, y: r.top });
        };
        return (
          <div
            key={i}
            tabIndex={hasProjects ? 0 : undefined}
            onMouseEnter={(e) => onEnter(e.currentTarget)}
            onFocus={(e) => onEnter(e.currentTarget)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: hasProjects ? "pointer" : "default",
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: isLast ? barColor : "#6E737D",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {d.value === 0
                ? "0"
                : d.value >= 10
                  ? Math.round(d.value).toFixed(0)
                  : d.value.toFixed(1)}
            </span>
            <div
              style={{
                width: barW,
                height: Math.max(3, (d.value / max) * height),
                borderRadius: "3px 3px 0 0",
                background: barColor,
                opacity: d.value === 0 ? 0.22 : isLast ? 1 : 0.62,
                outline:
                  hover?.i === i ? "2px solid rgba(15,24,48,.3)" : "none",
                outlineOffset: 1,
              }}
            />
            <span
              style={{
                fontSize: 9.5,
                color: "#6E737D",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {d.label}
            </span>
          </div>
        );
      })}

      {active &&
        active.projects.length > 0 &&
        hover &&
        createPortal(
          <ExecPopup
            x={hover.x}
            y={hover.y}
            label={active.label}
            projects={active.projects}
          />,
          document.body,
        )}
    </div>
  );
}

const POPUP_W = 248;

function ExecPopup({
  x,
  y,
  label,
  projects,
}: {
  x: number;
  y: number;
  label: string;
  projects: { name: string; amount: number }[];
}) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const left = Math.min(Math.max(8, x - POPUP_W / 2), vw - POPUP_W - 8);
  const total = projects.reduce((a, p) => a + p.amount, 0);
  const SHOW = 12;
  const shown = projects.slice(0, SHOW);

  return (
    <div
      style={{
        position: "fixed",
        left,
        top: y - 10,
        transform: "translateY(-100%)",
        width: POPUP_W,
        background: "var(--navy)",
        color: "#fff",
        borderRadius: 11,
        padding: "10px 12px",
        zIndex: 60,
        pointerEvents: "none",
        boxShadow: "0 10px 30px rgba(15,24,48,.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 7,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700 }}>{label} 집행</span>
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,.7)",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {projects.length}건 · {formatBudgetEok(total)}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {shown.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              fontSize: 11.5,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "rgba(255,255,255,.9)",
              }}
            >
              {p.name}
            </span>
            <span
              style={{
                flexShrink: 0,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatBudgetEok(p.amount)}
            </span>
          </div>
        ))}
        {projects.length > shown.length && (
          <div
            style={{
              fontSize: 10.5,
              color: "rgba(255,255,255,.55)",
              marginTop: 2,
            }}
          >
            외 {projects.length - shown.length}건
          </div>
        )}
      </div>
    </div>
  );
}
