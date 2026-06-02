/* 과제 현황 페이지 — 분석 콘솔 표 ↔ 포트폴리오 맵 토글 */

function ProjectsPage({ onOpenProject }) {
  const { P, sorted, KPI, MPRS, MPRS_ORDER, HEALTH, LIFECYCLE, fmtEok } = window.AX;
  const [view, setView] = React.useState("table");
  const [active, setActive] = React.useState(() => new Set(MPRS_ORDER));
  const [hover, setHover] = React.useState(null);

  const ViewToggle = () => (
    <div style={{ display: "flex", gap: 4, background: "#fff", border: `1px solid ${T.line}`, padding: 4, borderRadius: 11, fontSize: 12.5, fontWeight: 600 }}>
      {[["table", "표", "table"], ["map", "맵", "map"]].map(([v, label, ic]) => (
        <span key={v} onClick={() => setView(v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 7, cursor: "pointer",
          background: view === v ? T.accent : "transparent", color: view === v ? "#fff" : T.sub }}>
          <Icon name={ic} size={14} />{label}
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>과제 현황</div>
          <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>전체 {KPI.total}건 · 진행중 {KPI.inProgress} · 검토중 {KPI.lifecycle[1].count} · 완료 {KPI.completed}</div>
        </div>
        <ViewToggle />
      </div>

      {/* KPI 스트립 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.45fr 1fr 1.1fr", gap: 12 }}>
        <Card pad={14} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Donut size={70} thickness={11} segments={KPI.lifecycle.map((l, i) => ({ value: l.count, color: ["#C7CBD3", "#E0A106", T.accent, "#16A34A"][i] }))}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{KPI.total}</div>
          </Donut>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {KPI.lifecycle.map((l, i) => (
              <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: ["#C7CBD3", "#E0A106", T.accent, "#16A34A"][i] }} />
                <span style={{ color: T.sub }}>{l.label}</span><b style={{ marginLeft: "auto", paddingLeft: 14, fontVariantNumeric: "tabular-nums" }}>{l.count}</b>
              </div>
            ))}
          </div>
        </Card>
        <Card pad={14}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, marginBottom: 10 }}>진행 현황(헬스)</div>
          <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
            {KPI.health.map((h) => <div key={h.key} style={{ width: `${(h.count / KPI.total) * 100}%`, background: h.color }} />)}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {KPI.health.map((h) => (
              <div key={h.key} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.sub }}><span style={{ width: 7, height: 7, borderRadius: 99, background: h.color }} />{h.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{h.count}</span>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginLeft: "auto" }}>
              <span style={{ fontSize: 11, color: T.sub }}>금주 업데이트</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums" }}>{KPI.thisWeek}</span>
            </div>
          </div>
        </Card>
        <Card pad={14} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, marginBottom: 8 }}>평균 진행률</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{KPI.avgProgress}%</div>
          <Bar value={KPI.avgProgress} color={T.accent} h={7} />
        </Card>
        <Card pad={14} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Donut size={70} thickness={11} segments={[{ value: KPI.budgetRate, color: T.accent }, { value: 100 - KPI.budgetRate, color: "#EEF0F3" }]}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{KPI.budgetRate}%</div>
          </Donut>
          <div style={{ lineHeight: 1.5 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub }}>투자비 집행</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtEok(KPI.budgetTotal.exec)}</div>
            <div style={{ fontSize: 11, color: T.sub }}>/ {fmtEok(KPI.budgetTotal.budget)} 예산</div>
          </div>
        </Card>
      </div>

      {view === "table" ? <ProjectTableView onOpenProject={onOpenProject} /> : (
        <PortfolioMapView active={active} setActive={setActive} hover={hover} setHover={setHover} onOpenProject={onOpenProject} />
      )}
    </div>
  );
}

/* ── 분석 콘솔 표 (인라인 간트) ── */
function ProjectTableView({ onOpenProject }) {
  const { sorted, MPRS, LIFECYCLE } = window.AX;
  const rows = sorted;
  const minIdx = 2025 * 12 + 2, maxIdx = 2027 * 12 + 2, MW = 22;
  const idx = (ym) => { const [y, m] = ym.split("-").map(Number); return y * 12 + (m - 1); };
  const months = []; for (let i = minIdx; i <= maxIdx; i++) months.push(i);
  const ganttW = months.length * MW;
  const todayLeft = (2026 * 12 + 5 - minIdx + 0.05) * MW;

  return (
    <Card pad={0}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>전체 과제 <span style={{ color: T.sub, fontWeight: 500 }}>{rows.length}건</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: T.faint }}>정렬: 진행중 → 검토중 → 진행전 → 완료</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", height: 38, borderBottom: `1px solid ${T.line}`, fontSize: 11, color: T.sub, fontWeight: 600, background: "#FAFAFB" }}>
        <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>#</div>
        <div style={{ width: 96, flexShrink: 0 }}>MPRS</div>
        <div style={{ width: 116, flexShrink: 0 }}>본부</div>
        <div style={{ flex: 1, minWidth: 0 }}>과제명</div>
        <div style={{ width: 88, flexShrink: 0 }}>AI기술</div>
        <div style={{ width: 64, flexShrink: 0 }}>현황</div>
        <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>진행</div>
        <div style={{ width: ganttW, flexShrink: 0, position: "relative" }}>
          {[2025, 2026, 2027].map((y) => { const x = (y * 12 - minIdx) * MW; if (x < 0 || x > ganttW) return null; return <span key={y} style={{ position: "absolute", left: x + 3, fontSize: 10 }}>{y}</span>; })}
        </div>
      </div>
      {rows.map((p, i) => {
        const s = idx(p.start), e = idx(p.end);
        const left = (s - minIdx) * MW, w = (e - s + 1) * MW;
        return (
          <div key={p.id} className="p-row" onClick={() => onOpenProject(p.id)} style={{ display: "flex", alignItems: "center", height: 40, borderBottom: i === rows.length - 1 ? "none" : `1px solid ${T.line}`, fontSize: 12.5, cursor: "pointer" }}>
            <div style={{ width: 40, textAlign: "center", color: T.faint, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{i + 1}</div>
            <div style={{ width: 96, flexShrink: 0 }}><span style={{ fontSize: 10.5, fontWeight: 700, background: MPRS[p.mprs].bg, color: MPRS[p.mprs].text, padding: "2px 7px", borderRadius: 5 }}>{MPRS[p.mprs].label}</span></div>
            <div style={{ width: 116, flexShrink: 0, color: T.sub, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>{p.hq}</div>
            <div style={{ flex: 1, minWidth: 0, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>{p.name}</div>
            <div style={{ width: 88, flexShrink: 0, color: T.sub, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>{p.tech.join(", ") || "-"}</div>
            <div style={{ width: 64, flexShrink: 0, fontSize: 11.5, color: "#454A53" }}>{LIFECYCLE[p.life]}</div>
            <div style={{ width: 44, display: "flex", justifyContent: "center", flexShrink: 0 }}><HealthDot health={p.health} size={9} /></div>
            <div style={{ width: ganttW, flexShrink: 0, position: "relative", height: "100%" }}>
              <div style={{ position: "absolute", top: "50%", left, width: w, height: 8, transform: "translateY(-50%)", background: MPRS[p.mprs].main, borderRadius: 99, opacity: p.life === "completed" ? 0.45 : 0.92 }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, left: todayLeft, width: 1.5, background: "#DC2626", opacity: 0.4 }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ── 포트폴리오 맵 ── */
function PortfolioMapView({ active, setActive, hover, setHover, onOpenProject }) {
  const { P, MPRS, MPRS_ORDER, HEALTH, LIFECYCLE, KPI, fmtEok } = window.AX;
  const padL = 50, padR = 24, padT = 16, padB = 36, plotW = 940, plotH = 400;
  const bMin = 1.5, bMax = 12;
  const cx = (prog) => padL + (prog / 100) * plotW;
  const cy = (b) => padT + (1 - (b - bMin) / (bMax - bMin)) * plotH;
  const dia = (fte) => 30 + fte * 9;
  const boxW = padL + plotW + padR, boxH = padT + plotH + padB;
  const isOn = (k) => active.has(k);
  const hp = hover ? P.find((p) => p.id === hover) : null;
  const toggle = (k) => setActive((s) => {
    const n = new Set(s);
    if (n.size === MPRS_ORDER.length) { n.clear(); n.add(k); }
    else if (n.has(k) && n.size === 1) return new Set(MPRS_ORDER);
    else if (n.has(k)) n.delete(k); else n.add(k);
    return n.size ? n : new Set(MPRS_ORDER);
  });
  const xticks = [0, 25, 50, 75, 100], yticks = [2, 4, 6, 8, 10, 12];

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Card style={{ flex: 1, minWidth: 0 }} pad={20}>
        <PanelHead title="포트폴리오 맵" right="세로축 투자비(억) · 가로축 진행률(%) · 크기 = FTE · 테두리 = 헬스" />
        <div style={{ position: "relative", width: boxW, height: boxH, margin: "0 auto" }} onMouseLeave={() => setHover(null)}>
          <div style={{ position: "absolute", left: padL, top: padT, width: plotW / 2, height: plotH / 2, background: "rgba(220,38,38,.05)", borderRadius: 6 }} />
          {yticks.map((v) => (
            <React.Fragment key={"y" + v}>
              <div style={{ position: "absolute", left: padL, top: cy(v), width: plotW, height: 1, background: "#F1F2F4" }} />
              <span style={{ position: "absolute", left: 0, top: cy(v) - 7, width: padL - 8, textAlign: "right", fontSize: 10, color: "#A9AEB8" }}>{v}</span>
            </React.Fragment>
          ))}
          {xticks.map((v) => (
            <React.Fragment key={"x" + v}>
              <div style={{ position: "absolute", left: cx(v), top: padT, width: 1, height: plotH, background: v === 50 ? "#E2E4E8" : "#F6F7F8" }} />
              <span style={{ position: "absolute", left: cx(v) - 12, top: padT + plotH + 8, width: 24, textAlign: "center", fontSize: 10, color: "#A9AEB8" }}>{v}</span>
            </React.Fragment>
          ))}
          <span style={{ position: "absolute", left: padL + 8, top: padT + 6, fontSize: 10.5, fontWeight: 700, color: "rgba(220,38,38,.5)" }}>● 주목 · 큰 투자 / 낮은 진행</span>
          {P.map((p) => {
            const on = isOn(p.mprs), d = dia(p.fte), m = MPRS[p.mprs], isH = hover === p.id;
            return (
              <div key={p.id} onMouseEnter={() => setHover(p.id)} onClick={() => onOpenProject(p.id)} style={{
                position: "absolute", left: cx(p.prog), top: cy(p.budget), width: d, height: d,
                transform: `translate(-50%,-50%) scale(${isH ? 1.12 : 1})`, borderRadius: 99,
                background: m.main, border: `3px solid ${HEALTH[p.health].color}`,
                opacity: on ? (hover && !isH ? 0.5 : 0.92) : 0.1, cursor: "pointer",
                boxShadow: isH ? `0 6px 18px ${m.main}66` : "none", transition: "transform .15s, opacity .15s, box-shadow .15s",
                zIndex: isH ? 5 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800,
              }}>{m.letter}</div>
            );
          })}
          {hp && (
            <div style={{ position: "absolute", left: Math.min(cx(hp.prog) + dia(hp.fte) / 2 + 8, boxW - 210), top: Math.max(padT, cy(hp.budget) - 30), width: 200, background: T.navy, color: "#fff", borderRadius: 11, padding: "10px 12px", zIndex: 10, pointerEvents: "none", boxShadow: "0 10px 30px rgba(15,24,48,.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: MPRS[hp.mprs].main, borderRadius: 4, padding: "1px 6px" }}>{MPRS[hp.mprs].label}</span>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: HEALTH[hp.health].color }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{HEALTH[hp.health].label}</span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>{hp.name}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.7)" }}>진행률 {hp.prog}% · 투자비 {fmtEok(hp.budget)} · FTE {hp.fte}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 4 }}>클릭하면 상세 보기 →</div>
            </div>
          )}
        </div>
      </Card>

      <aside style={{ width: 300, flexShrink: 0 }}>
        <Card pad={16}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 10 }}>MPRS 필터 <span style={{ color: "#B6BAC2" }}>· 클릭해 좁히기</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {MPRS_ORDER.map((k) => {
              const on = isOn(k), cnt = P.filter((p) => p.mprs === k).length;
              return (
                <button key={k} onClick={() => toggle(k)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, cursor: "pointer", border: `1px solid ${on ? MPRS[k].main : T.line}`, background: on ? MPRS[k].bg : "#fff", opacity: on ? 1 : 0.55, fontFamily: "inherit", transition: "all .15s" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: MPRS[k].main }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: on ? MPRS[k].text : T.sub }}>{MPRS[k].label}</span>
                  <b style={{ marginLeft: "auto", fontSize: 12, color: T.ink }}>{cnt}</b>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
            {KPI.health.map((h) => (
              <span key={h.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.sub }}>
                <span style={{ width: 11, height: 11, borderRadius: 99, border: `3px solid ${h.color}`, boxSizing: "border-box" }} />{h.label} {h.count}</span>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
Object.assign(window, { ProjectsPage });
