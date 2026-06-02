/* 프로토타입 공용 — 토큰 · 아이콘 · 기본 atom (window export) */

const T = {
  navy: "#0F1830", ink: "#161A22", sub: "#6B7280", faint: "#9AA0AB",
  line: "#ECEEF1", line2: "#E4E7EB", bg: "#EEF0F4", card: "#FFFFFF", accent: "#534AB7",
};

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  projects: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1.3" /><circle cx="3.5" cy="12" r="1.3" /><circle cx="3.5" cy="18" r="1.3" /></>,
  performance: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
  budget: <><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  map: <><circle cx="7" cy="8" r="2.5" /><circle cx="16" cy="14" r="2.5" /><circle cx="18" cy="6" r="1.6" /><circle cx="9" cy="17" r="1.6" /></>,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="9" y1="10" x2="9" y2="20" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  close: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  chevR: <polyline points="9 6 15 12 9 18" />,
  arrowR: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
  won: <><path d="M4 6l3 12 5-9 5 9 3-12" /><line x1="3" y1="11" x2="21" y2="11" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.3" /></>,
  alert: <><path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><line x1="9" y1="7" x2="9" y2="7" /><line x1="15" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="9" y2="11" /><line x1="15" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="15" y2="15" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  link: <><path d="M9 15l6-6" /><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" /><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" /></>,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></>,
  spark: <><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></>,
};

function Icon({ name, size = 16, stroke = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {ICONS[name]}
    </svg>
  );
}

/* 카드 컨테이너 */
function Card({ children, pad = 18, dark, style, hover, onClick }) {
  return (
    <div onClick={onClick} className={hover ? "p-hovercard" : ""} style={{
      background: dark ? T.navy : T.card, border: dark ? "none" : `1px solid ${T.line}`,
      borderRadius: 16, padding: pad, color: dark ? "#fff" : T.ink, cursor: onClick ? "pointer" : "default",
      boxShadow: dark ? "0 8px 28px rgba(15,24,48,.20)" : "0 1px 2px rgba(16,24,40,.05)", ...style,
    }}>{children}</div>
  );
}

/* KPI 스탯 */
function Stat({ label, value, unit, sub, accent, big = 30 }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontSize: big, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums", color: accent || T.ink }}>{value}</span>
        {unit && <span style={{ fontSize: 14, fontWeight: 600, color: T.sub }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 7 }}>{sub}</div>}
    </div>
  );
}

/* 섹션 헤더 */
function PanelHead({ title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      {right && <div style={{ fontSize: 11.5, color: T.sub }}>{right}</div>}
    </div>
  );
}

Object.assign(window, { T, Icon, Card, Stat, PanelHead });
