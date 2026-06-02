/* ⌘K 커맨드 팔레트 — 과제 검색 + 빠른 이동 */

function CommandPalette({ onClose, onNav, onOpenProject, onNew, onMasters }) {
  const { P, MPRS, LIFECYCLE, HEALTH } = window.AX;
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);
  const _portal = (node) => (window.ReactDOM && window.ReactDOM.createPortal) ? window.ReactDOM.createPortal(node, document.body) : node;

  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const actions = [
    { type: "nav", id: "dashboard", label: "대시보드", sub: "벤토 개요", icon: "dashboard", run: () => onNav("dashboard") },
    { type: "nav", id: "projects", label: "과제 현황", sub: "표 · 포트폴리오 맵", icon: "projects", run: () => onNav("projects") },
    { type: "nav", id: "performance", label: "성과 현황", sub: "운영 효과지표", icon: "performance", run: () => onNav("performance") },
    { type: "nav", id: "budget", label: "투자비 현황", sub: "CAPEX 집행", icon: "budget", run: () => onNav("budget") },
    { type: "act", id: "new", label: "새 과제 등록", sub: "생성 폼 열기", icon: "plus", run: onNew },
    { type: "act", id: "masters", label: "마스터 관리", sub: "본부·부서·사람·AI기술", icon: "building", run: onMasters },
  ];
  const ql = q.trim().toLowerCase();
  const projHits = ql
    ? P.filter((p) => (p.name + " " + p.hq + " " + p.pms.join(" ") + " " + p.tech.join(" ")).toLowerCase().includes(ql))
    : [];
  const actHits = ql ? actions.filter((a) => (a.label + " " + a.sub).toLowerCase().includes(ql)) : actions;

  const items = [
    ...actHits.map((a) => ({ kind: "action", ...a })),
    ...projHits.map((p) => ({ kind: "project", id: p.id, label: p.name, p, run: () => onOpenProject(p.id) })),
  ];
  React.useEffect(() => { setSel(0); }, [q]);

  const onKey = (e) => {
    if (e.key === "Escape") { onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); items[sel] && items[sel].run(); }
  };

  const Group = ({ label }) => <div style={{ fontSize: 10.5, fontWeight: 700, color: T.faint, letterSpacing: ".06em", padding: "10px 16px 5px" }}>{label}</div>;
  let idx = -1;
  const Item = ({ it, children }) => {
    idx += 1; const i = idx; const on = sel === i;
    return (
      <div onMouseEnter={() => setSel(i)} onClick={it.run} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 16px", cursor: "pointer", background: on ? "#F0EFFA" : "transparent" }}>{children(on)}</div>
    );
  };
  const firstProjIdx = actHits.length;

  return _portal(
    <div onKeyDown={onKey} onClick={onClose} style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(15,24,48,.4)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "11vh" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 580, maxWidth: "92vw", background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(15,24,48,.35)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${T.line}` }}>
          <Icon name="search" size={18} style={{ color: T.sub }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="과제명·본부·PM·AI기술 검색 또는 이동…" style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: "inherit", color: T.ink, background: "transparent" }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, background: "#F1F2F4", borderRadius: 5, padding: "2px 7px", color: T.faint }}>ESC</span>
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto", paddingBottom: 8 }}>
          {items.length === 0 && <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: T.faint }}>"{q}" 에 대한 결과가 없습니다.</div>}
          {actHits.length > 0 && <Group label={ql ? "바로가기" : "이동 · 작업"} />}
          {actHits.map((a) => (
            <Item key={a.id} it={a}>{(on) => (<>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: on ? "#fff" : "#F4F5F7", display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}><Icon name={a.icon} size={16} /></span>
              <span style={{ flex: 1 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.label}</span><span style={{ fontSize: 11.5, color: T.sub, marginLeft: 8 }}>{a.sub}</span></span>
              {on && <Icon name="arrowR" size={15} style={{ color: T.faint }} />}
            </>)}</Item>
          ))}
          {projHits.length > 0 && <Group label={`과제 ${projHits.length}건`} />}
          {projHits.map((p) => (
            <Item key={p.id} it={{ run: () => onOpenProject(p.id) }}>{(on) => (<>
              <MprsBadge mprs={p.mprs} size={28} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{p.hq} · {LIFECYCLE[p.life]} · {p.pms.join(", ")}</div>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><HealthDot health={p.health} size={8} /><span style={{ fontSize: 11.5, color: T.sub, fontVariantNumeric: "tabular-nums" }}>{p.prog}%</span></span>
            </>)}</Item>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { CommandPalette });
