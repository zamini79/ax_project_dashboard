/* 공용 시각화 헬퍼 — window 로 export */

/** 도넛 차트. segments: [{value, color, key}] */
function Donut({ segments, size = 120, thickness = 16, gap = 2, children }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF0F3" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const len = Math.max(0, frac * c - gap);
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
              strokeLinecap="round" />
          );
          offset += frac * c;
          return el;
        })}
      </svg>
      {children && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/** 세로 막대 미니 차트 (월별 추이) */
function MiniBars({ data, height = 64, color = "#475569", barW = 14, gap = 8, accentLast }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap, height: height + 16 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: barW, height: Math.max(3, (d.v / max) * height), borderRadius: "3px 3px 0 0",
            background: accentLast && i === data.length - 1 ? accentLast : color,
            opacity: d.v === 0 ? 0.25 : 1,
          }} />
          <span style={{ fontSize: 9.5, color: "#9AA0AB", fontVariantNumeric: "tabular-nums" }}>{d.ym}</span>
        </div>
      ))}
    </div>
  );
}

/** 가로 진행 바 */
function Bar({ value, color, track = "#EEF0F3", h = 6, radius = 99 }) {
  return (
    <div style={{ height: h, width: "100%", background: track, borderRadius: radius, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: color, borderRadius: radius }} />
    </div>
  );
}

/** 헬스 점 */
function HealthDot({ health, size = 9 }) {
  const c = window.AX.HEALTH[health].color;
  return <span style={{ width: size, height: size, borderRadius: 99, background: c, display: "inline-block", flexShrink: 0 }} />;
}

/** MPRS 한 글자 배지 */
function MprsBadge({ mprs, size = 20 }) {
  const m = window.AX.MPRS[mprs];
  return (
    <span style={{
      width: size, height: size, borderRadius: 6, background: m.bg, color: m.text,
      fontSize: size * 0.55, fontWeight: 800, display: "inline-flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, letterSpacing: "-0.02em",
    }}>{m.letter}</span>
  );
}

Object.assign(window, { Donut, MiniBars, Bar, HealthDot, MprsBadge });
