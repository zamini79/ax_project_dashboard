/**
 * 경량 차트 프리미티브 (외부 라이브러리 없이 SVG/div). 핸드오프 ui.jsx 기반.
 * 모두 순수 presentational — 서버 컴포넌트에서 사용 가능.
 */

export interface DonutSegment {
  value: number;
  color: string;
}

/** 도넛 차트. 중앙에 children(총계 등) */
export function Donut({
  segments,
  size = 120,
  thickness = 16,
  gap = 2,
  ariaLabel,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  gap?: number;
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const arcs = segments.map((s) => ({ color: s.color, frac: s.value / total }));
  // 각 세그먼트의 시작 오프셋(누적) — 순수 계산(렌더 중 변수 변이 회피)
  const offsets = arcs.map((_, i) =>
    arcs.slice(0, i).reduce((a, x) => a + x.frac * c, 0),
  );

  return (
    <div
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{ position: "relative", width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#EEF0F3"
          strokeWidth={thickness}
        />
        {arcs.map((s, i) => {
          const len = Math.max(0, s.frac * c - gap);
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              style={{ stroke: s.color }}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offsets[i]}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {children && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** 세로 막대 미니 차트 (월별 추이 등) */
export function MiniBars({
  data,
  height = 64,
  barW = 14,
  gap = 8,
  color = "#D3D8E0",
  accentLast,
  ariaLabel,
  showValues = false,
}: {
  data: { label: string; value: number }[];
  height?: number;
  barW?: number;
  gap?: number;
  color?: string;
  accentLast?: string;
  ariaLabel?: string;
  showValues?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{ display: "flex", alignItems: "flex-end", gap }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          {showValues && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: accentLast && i === data.length - 1 ? accentLast : "#6E737D",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {d.value === 0 ? "-" : d.value >= 10 ? Math.round(d.value).toFixed(0) : d.value.toFixed(1)}
            </span>
          )}
          <div
            style={{
              width: barW,
              height: Math.max(3, (d.value / max) * height),
              borderRadius: "3px 3px 0 0",
              background:
                accentLast && i === data.length - 1 ? accentLast : color,
              opacity: d.value === 0 ? 0.25 : 1,
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
      ))}
    </div>
  );
}

/** 가로 진행 바 */
export function Bar({
  value,
  color,
  track = "#EEF0F3",
  height = 6,
  radius = 99,
}: {
  value: number;
  color: string;
  track?: string;
  height?: number;
  radius?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        height,
        width: "100%",
        background: track,
        borderRadius: radius,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          borderRadius: radius,
        }}
      />
    </div>
  );
}

/** 헬스 점 */
export function HealthDot({
  color,
  size = 9,
}: {
  color: string;
  size?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}
