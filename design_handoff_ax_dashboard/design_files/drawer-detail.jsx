/* 과제 상세 드로어 — 우측 슬라이드 패널 (메타 + 운영효과 + 업데이트 타임라인) */

function ProjectDrawer({ id, onClose, onEdit }) {
  const { P, MPRS, HEALTH, LIFECYCLE, UPDATES, PERF, fmtEok } = window.AX;
  const p = P.find((x) => x.id === id);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    setShown(true);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!p) return null;
  const m = MPRS[p.mprs];
  const _portal = (node) => (window.ReactDOM && window.ReactDOM.createPortal) ? window.ReactDOM.createPortal(node, document.body) : node;
  const rate = p.budget > 0 ? Math.round((p.exec / p.budget) * 100) : null;
  const updates = UPDATES[p.id] || [];
  const effect = PERF.items.find((e) => e.id === p.id);
  const srcBadge = { manual: { label: "수동", bg: "#EEF0F3", c: "#5B616B" }, atlassian: { label: "Atlassian", bg: "#E8EAFB", c: T.accent } };

  const Row = ({ label, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11.5, color: T.sub, fontWeight: 500 }}>{label}</span>
      <div style={{ fontSize: 13.5 }}>{children}</div>
    </div>
  );

  return _portal(
    <div onClick={onClose} style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(15,24,48,.42)", zIndex: 100, opacity: shown ? 1 : 0, transition: "opacity .2s" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 520, maxWidth: "92vw", background: T.bg, overflowY: "auto",
        transform: shown ? "translateX(0)" : "translateX(100%)", transition: "transform .28s cubic-bezier(.2,.7,.3,1)",
        boxShadow: "-12px 0 40px rgba(15,24,48,.2)",
      }}>
        {/* 헤더 */}
        <div style={{ position: "sticky", top: 0, background: T.card, borderBottom: `1px solid ${T.line}`, padding: "16px 20px", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MprsBadge mprs={p.mprs} size={24} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.sub, background: "#F1F2F4", padding: "3px 9px", borderRadius: 6 }}>{LIFECYCLE[p.life]}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: T.sub }}><HealthDot health={p.health} size={9} />{HEALTH[p.health].label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => onEdit && onEdit(p)} style={{ height: 30, display: "flex", alignItems: "center", gap: 5, padding: "0 12px", borderRadius: 8, border: `1px solid ${T.line}`, background: "#fff", cursor: "pointer", color: T.ink, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" }}>편집</button>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.line}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.sub }}><Icon name="close" size={16} /></button>
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>{p.hq} · {p.pms.join(", ")} · {p.dept}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <Bar value={p.prog} color={T.accent} h={8} />
            <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{p.prog}%</span>
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 메타 */}
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Row label="주관 본부">{p.hq}</Row>
              <Row label="일정">{p.start.replace("-", ".")} ~ {p.end.replace("-", ".")}</Row>
              <Row label="투자비 / 집행">{fmtEok(p.exec)} / {fmtEok(p.budget)}{rate != null && <span style={{ color: T.sub }}> ({rate}%)</span>}</Row>
              <Row label="투입 인력">FTE {p.fte}</Row>
              <Row label="AI 기술">
                {p.tech.length ? (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{p.tech.map((t) => <span key={t} style={{ fontSize: 11, fontWeight: 600, color: T.accent, background: "#EEF0FB", padding: "2px 8px", borderRadius: 6 }}>{t}</span>)}</div>
                ) : <span style={{ color: T.faint }}>-</span>}
              </Row>
              <Row label="유관부서 / 담당자"><span style={{ color: T.sub }}>AX추진실</span></Row>
            </div>
          </Card>

          {/* 운영 효과 (있을 때) */}
          {effect && (
            <Card style={{ background: "#F2FBF5", border: "1px solid #CBEFD8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <Icon name="sparkle" size={16} style={{ color: "#16A34A" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0E7A4E" }}>운영 효과 {effect.pilot ? "(파일럿)" : ""}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: T.sub }}>{effect.applied} 적용</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {effect.metrics.map((mt, i) => (
                  <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 9, padding: "9px 10px", border: "1px solid #DCEFE3" }}>
                    <div style={{ fontSize: 10, color: T.sub, marginBottom: 5 }}>{mt.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{mt.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 업데이트 타임라인 */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>업데이트 타임라인</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="plus" size={13} />업데이트 작성</span>
            </div>
            {updates.length === 0 ? (
              <div style={{ fontSize: 12.5, color: T.faint, textAlign: "center", padding: "20px 0", border: `1px dashed ${T.line2}`, borderRadius: 10 }}>아직 업데이트가 없습니다.</div>
            ) : (
              <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative", borderLeft: `1px solid ${T.line2}`, marginLeft: 4 }}>
                {updates.map((u, i) => {
                  const sb = srcBadge[u.src];
                  return (
                    <li key={i} style={{ position: "relative", paddingLeft: 18, paddingBottom: i === updates.length - 1 ? 0 : 16 }}>
                      <span style={{ position: "absolute", left: -5, top: 3, width: 9, height: 9, borderRadius: 99, background: "#fff", border: `2px solid ${u.src === "atlassian" ? T.accent : "#C7CBD3"}` }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, background: sb.bg, color: sb.c, padding: "2px 7px", borderRadius: 5 }}>{sb.label}</span>
                        {u.role && <span style={{ fontSize: 10, color: T.sub, border: `1px solid ${T.line2}`, padding: "1px 6px", borderRadius: 5 }}>{u.role}</span>}
                        <span style={{ fontSize: 11, color: T.faint }}>{u.date}</span>
                      </div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#373B42" }}>{u.content}</div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ProjectDrawer });
