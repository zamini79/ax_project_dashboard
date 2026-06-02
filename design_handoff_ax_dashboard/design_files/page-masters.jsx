/* 마스터 관리 — 본부 / 부서 / 사람 / AI기술 CRUD (로컬 상태) */

function MastersPage() {
  const { MASTERS } = window.AX;
  const [tab, setTab] = React.useState("hq");
  const [hqs, setHqs] = React.useState(MASTERS.HQS);
  const [depts, setDepts] = React.useState(MASTERS.DEPTS);
  const [people, setPeople] = React.useState(MASTERS.PEOPLE);
  const [techs, setTechs] = React.useState(MASTERS.AITECHS);
  const uid = () => "x" + Math.random().toString(36).slice(2, 8);
  const hqOpts = hqs.map((h) => ({ id: h.id, name: h.name }));
  const deptOpts = depts.map((d) => ({ id: d.id, name: d.name }));

  const TABS = [["hq", "본부", hqs.length], ["dept", "부서", depts.length], ["people", "사람", people.length], ["tech", "AI기술", techs.length]];

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>마스터 관리</div>
      <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2, marginBottom: 16 }}>본부 · 부서 · 사람 · AI기술 기준정보를 추가·수정·삭제합니다.</div>

      <div style={{ display: "flex", gap: 4, background: "#fff", border: `1px solid ${T.line}`, padding: 4, borderRadius: 12, marginBottom: 16, width: "fit-content" }}>
        {TABS.map(([k, label, n]) => (
          <button key={k} onClick={() => setTab(k)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 15px", borderRadius: 9, cursor: "pointer", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: tab === k ? T.navy : "transparent", color: tab === k ? "#fff" : T.sub }}>
            {label}<span style={{ fontSize: 11, fontWeight: 700, color: tab === k ? "rgba(255,255,255,.7)" : T.faint }}>{n}</span>
          </button>
        ))}
      </div>

      {tab === "hq" && <Manager items={hqs} setItems={setHqs} uid={uid} nameLabel="본부명" namePlaceholder="예: 전사" />}
      {tab === "dept" && <Manager items={depts} setItems={setDepts} uid={uid} nameLabel="부서명" namePlaceholder="예: 디지털혁신팀" relation={{ label: "소속 본부", key: "hqId", options: hqOpts }} />}
      {tab === "people" && <Manager items={people} setItems={setPeople} uid={uid} nameLabel="이름" namePlaceholder="예: 홍길동" hasEmail relation={{ label: "소속 부서", key: "deptId", options: deptOpts }} />}
      {tab === "tech" && <Manager items={techs} setItems={setTechs} uid={uid} nameLabel="AI기술명" namePlaceholder="예: 멀티모달" />}
    </div>
  );
}

function Manager({ items, setItems, uid, nameLabel, namePlaceholder, hasEmail, relation }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [rel, setRel] = React.useState("");
  const inputStyle = { height: 38, border: `1px solid ${T.line2}`, borderRadius: 9, padding: "0 12px", fontSize: 13, fontFamily: "inherit", color: T.ink, background: "#fff", outline: "none" };

  const add = () => {
    if (!name.trim()) return;
    const row = { id: uid(), name: name.trim() };
    if (hasEmail) row.email = email.trim();
    if (relation) row[relation.key] = rel || null;
    setItems((s) => [...s, row]);
    setName(""); setEmail(""); setRel("");
  };
  const update = (id, patch) => setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => setItems((s) => s.filter((it) => it.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 추가 바 */}
      <Card pad={14} style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11.5, color: T.sub, fontWeight: 600 }}>{nameLabel}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={namePlaceholder} style={{ ...inputStyle, width: 200 }} />
        </label>
        {hasEmail && (
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: T.sub, fontWeight: 600 }}>이메일</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@skbs.com" style={{ ...inputStyle, width: 220 }} />
          </label>
        )}
        {relation && (
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: T.sub, fontWeight: 600 }}>{relation.label}</span>
            <select value={rel} onChange={(e) => setRel(e.target.value)} style={{ ...inputStyle, width: 180, appearance: "auto" }}>
              <option value="">— 없음 —</option>
              {relation.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        )}
        <button onClick={add} disabled={!name.trim()} style={{ height: 38, display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#fff", background: name.trim() ? T.accent : "#C4C2DE", border: "none", padding: "0 16px", borderRadius: 9, cursor: name.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
          <Icon name="plus" size={15} /> 추가
        </button>
      </Card>

      {/* 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <Row key={it.id} it={it} hasEmail={hasEmail} relation={relation} onUpdate={update} onRemove={remove} inputStyle={inputStyle} />
        ))}
      </div>
    </div>
  );
}

function Row({ it, hasEmail, relation, onUpdate, onRemove, inputStyle }) {
  const relName = relation ? (relation.options.find((o) => o.id === it[relation.key]) || {}).name : null;
  return (
    <Card pad={12} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <input value={it.name} onChange={(e) => onUpdate(it.id, { name: e.target.value })} style={{ ...inputStyle, height: 34, width: 200, fontWeight: 600 }} />
      {hasEmail && <input value={it.email || ""} onChange={(e) => onUpdate(it.id, { email: e.target.value })} placeholder="(이메일 없음)" style={{ ...inputStyle, height: 34, width: 220, color: T.sub }} />}
      {relation && (
        <select value={it[relation.key] || ""} onChange={(e) => onUpdate(it.id, { [relation.key]: e.target.value || null })} style={{ ...inputStyle, height: 34, width: 180, appearance: "auto", color: T.sub }}>
          <option value="">— 없음 —</option>
          {relation.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      )}
      <button onClick={() => onRemove(it.id)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600, color: "#DC2626", background: "transparent", border: `1px solid ${T.line2}`, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
        <Icon name="close" size={13} /> 삭제
      </button>
    </Card>
  );
}
Object.assign(window, { MastersPage });
