/* 새 과제 생성 / 편집 폼 페이지 */

function ProjectFormPage({ mode, project, onSubmit, onCancel }) {
  const { MPRS, MPRS_ORDER, LIFECYCLE, LIFE_ORDER, HEALTH, HEALTH_ORDER, MASTERS } = window.AX;
  const { HQS, DEPTS, PEOPLE, AITECHS } = MASTERS;

  const init = React.useMemo(() => {
    if (mode === "edit" && project) {
      return {
        name: project.name, desc: "",
        mprs: project.mprs, hqId: (HQS.find((h) => h.name === project.hq) || {}).id || "",
        life: project.life, health: project.health,
        start: project.start + "-01", end: project.end + "-01",
        budget: project.budget, fte: project.fte, prog: project.prog,
        pmIds: PEOPLE.filter((pe) => project.pms.includes(pe.name)).map((pe) => pe.id),
        deptIds: ["d0"],
        techIds: AITECHS.filter((t) => project.tech.includes(t.name)).map((t) => t.id),
      };
    }
    return { name: "", desc: "", mprs: "production", hqId: "", life: "not_started", health: "green",
      start: "", end: "", budget: "", fte: "", prog: 0, pmIds: [], deptIds: [], techIds: [] };
  }, [mode, project]);

  const [f, setF] = React.useState(init);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggle = (k, id) => setF((s) => ({ ...s, [k]: s[k].includes(id) ? s[k].filter((x) => x !== id) : [...s[k], id] }));
  const valid = f.name.trim() && f.hqId;

  const inputStyle = { width: "100%", height: 38, border: `1px solid ${T.line2}`, borderRadius: 9, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: T.ink, background: "#fff", outline: "none" };
  const Field = ({ label, req, children, full }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}{req && <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>}</label>
      {children}
    </div>
  );
  const Select = ({ value, onChange, children }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>{children}</select>
  );
  const Chips = ({ options, value, onToggle }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} type="button" onClick={() => onToggle(o.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
            border: `1px solid ${on ? T.accent : T.line2}`, background: on ? "#EEF0FB" : "#fff", color: on ? T.accent : T.sub, fontSize: 12.5, fontWeight: 600,
          }}>
            {on && <Icon name="plus" size={12} style={{ transform: "rotate(45deg)" }} />}{o.label}{o.hint && <span style={{ color: T.faint, fontWeight: 400 }}>· {o.hint}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>
        <span style={{ cursor: "pointer" }} onClick={onCancel}>과제 현황</span> <span style={{ color: T.faint }}>/</span> <span style={{ color: T.ink, fontWeight: 600 }}>{mode === "edit" ? "과제 편집" : "새 과제 등록"}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 16 }}>{mode === "edit" ? "과제 편집" : "새 과제 등록"}</div>

      {/* 기본 정보 */}
      <Card pad={22} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>기본 정보</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="과제명" req full><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="예: 스마트팩토리 비전검사 고도화" style={inputStyle} /></Field>
          <Field label="설명" full><textarea value={f.desc} onChange={(e) => set("desc", e.target.value)} rows={2} placeholder="과제 개요를 입력하세요" style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }} /></Field>
          <Field label="분류 (MPRS)" req><Select value={f.mprs} onChange={(v) => set("mprs", v)}>{MPRS_ORDER.map((k) => <option key={k} value={k}>{MPRS[k].label}</option>)}</Select></Field>
          <Field label="주관 본부" req><Select value={f.hqId} onChange={(v) => set("hqId", v)}><option value="">선택하세요</option>{HQS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</Select></Field>
          <Field label="라이프사이클" req><Select value={f.life} onChange={(v) => set("life", v)}>{LIFE_ORDER.map((k) => <option key={k} value={k}>{LIFECYCLE[k]}</option>)}</Select></Field>
          <Field label="헬스" req><Select value={f.health} onChange={(v) => set("health", v)}>{HEALTH_ORDER.map((k) => <option key={k} value={k}>{HEALTH[k].label}</option>)}</Select></Field>
          <Field label="시작일"><input type="date" value={f.start} onChange={(e) => set("start", e.target.value)} style={inputStyle} /></Field>
          <Field label="종료일"><input type="date" value={f.end} onChange={(e) => set("end", e.target.value)} style={inputStyle} /></Field>
          <Field label="투자비 (억원)"><input type="number" step="0.1" min="0" value={f.budget} onChange={(e) => set("budget", e.target.value)} placeholder="예: 12.5" style={inputStyle} /></Field>
          <Field label="투입 인원 (FTE)"><input type="number" step="0.5" min="0" value={f.fte} onChange={(e) => set("fte", e.target.value)} placeholder="예: 2" style={inputStyle} /></Field>
          <Field label={`진행률 (${f.prog}%)`} full>
            <input type="range" min="0" max="100" step="5" value={f.prog} onChange={(e) => set("prog", Number(e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
          </Field>
        </div>
      </Card>

      {/* 담당 / 분류 */}
      <Card pad={22} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>담당 / 분류</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="PM (공동 가능)"><Chips options={PEOPLE.map((p) => ({ id: p.id, label: p.name }))} value={f.pmIds} onToggle={(id) => toggle("pmIds", id)} /></Field>
          <Field label="유관부서"><Chips options={DEPTS.map((d) => ({ id: d.id, label: d.name }))} value={f.deptIds} onToggle={(id) => toggle("deptIds", id)} /></Field>
          <Field label="AI기술"><Chips options={AITECHS.map((t) => ({ id: t.id, label: t.name }))} value={f.techIds} onToggle={(id) => toggle("techIds", id)} /></Field>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.line}`, fontSize: 12, color: T.faint, display: "flex", gap: 6, alignItems: "center" }}>
          <Icon name="plus" size={13} /> 목록에 없으면 <b style={{ color: T.sub }}>마스터 관리</b>에서 즉석 추가할 수 있어요.
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onCancel} style={{ fontSize: 13, fontWeight: 600, color: T.sub, background: "transparent", border: `1px solid ${T.line2}`, padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
        <button disabled={!valid} onClick={() => onSubmit(f, mode)} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: valid ? T.accent : "#C4C2DE", border: "none", padding: "10px 20px", borderRadius: 10, cursor: valid ? "pointer" : "not-allowed", fontFamily: "inherit" }}>{mode === "edit" ? "저장" : "과제 등록"}</button>
      </div>
    </div>
  );
}
Object.assign(window, { ProjectFormPage });
