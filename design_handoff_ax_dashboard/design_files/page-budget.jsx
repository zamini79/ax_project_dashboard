/* 투자비 현황 페이지 — CAPEX 규모 · 항목별/과제별 계획 대비 집행 */

function BudgetPage({ onOpenProject }) {
  const { CAPEX, CAPEX_TOTAL, MONTHLY, P, MPRS, LIFECYCLE, fmtEok } = window.AX;
  const maxPlan = Math.max(...CAPEX.map((c) => c.plan));
  const projects = [...P].sort((a, b) => b.budget - a.budget);
  const remain = CAPEX_TOTAL.plan - CAPEX_TOTAL.exec;
  const cumulative = MONTHLY.reduce((a, m) => a + m.v, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>투자비 현황</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>전체 CAPEX 규모와 항목별·과제별 계획 대비 집행 현황</div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Card><Stat label="총 CAPEX (계획)" value={fmtEok(CAPEX_TOTAL.plan)} sub="전체 과제 투자 예산" /></Card>
        <Card><Stat label="집행 누계" value={fmtEok(CAPEX_TOTAL.exec)} accent={T.accent} sub={`집행률 ${CAPEX_TOTAL.rate}%`} /></Card>
        <Card>
          <Stat label="집행률" value={`${CAPEX_TOTAL.rate}%`} />
          <div style={{ marginTop: 10 }}><Bar value={CAPEX_TOTAL.rate} color={T.accent} h={6} /></div>
        </Card>
        <Card><Stat label="미집행 잔액" value={fmtEok(remain)} sub={`계획 대비 ${100 - CAPEX_TOTAL.rate}%`} /></Card>
      </div>

      {/* 항목별 + 월별 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
        <Card>
          <PanelHead title="CAPEX 항목별 계획 대비 집행" right="막대 길이 = 계획 규모 · 채움 = 집행" />
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {CAPEX.map((c) => {
              const rate = Math.round((c.exec / c.plan) * 100);
              return (
                <div key={c.cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.cat}</span>
                    <span style={{ fontSize: 11.5, color: T.sub, fontVariantNumeric: "tabular-nums" }}>
                      {fmtEok(c.exec)} / {fmtEok(c.plan)} <b style={{ color: T.ink }}>({rate}%)</b></span>
                  </div>
                  <div style={{ position: "relative", height: 12, width: "100%" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: `${(c.plan / maxPlan) * 100}%`, background: "#EEF0F3", borderRadius: 99 }} />
                    <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: `${(c.exec / maxPlan) * 100}%`, background: T.accent, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column" }}>
          <PanelHead title="월별 집행 추이" right="단위: 억" />
          <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtEok(cumulative)} <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>누적</span></div>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", marginTop: 14 }}>
            <MiniBars data={MONTHLY} height={120} barW={28} gap={12} color="#D3D8E0" accentLast={T.accent} />
          </div>
        </Card>
      </div>

      {/* 과제별 계획 대비 집행 */}
      <Card pad={0}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.line}`, fontSize: 13, fontWeight: 700 }}>과제별 계획 대비 집행 <span style={{ color: T.sub, fontWeight: 500 }}>{projects.length}건</span></div>
        <div style={{ display: "flex", alignItems: "center", height: 36, borderBottom: `1px solid ${T.line}`, fontSize: 11, color: T.sub, fontWeight: 600, background: "#FAFAFB", padding: "0 16px" }}>
          <div style={{ width: 88, flexShrink: 0 }}>MPRS</div>
          <div style={{ flex: 1, minWidth: 0 }}>과제명</div>
          <div style={{ width: 130, flexShrink: 0 }}>본부</div>
          <div style={{ width: 72, textAlign: "right", flexShrink: 0 }}>계획</div>
          <div style={{ width: 72, textAlign: "right", flexShrink: 0 }}>집행</div>
          <div style={{ width: 160, flexShrink: 0, paddingLeft: 16 }}>집행률</div>
        </div>
        {projects.map((p, i) => {
          const rate = p.budget > 0 ? Math.round((p.exec / p.budget) * 100) : 0;
          return (
            <div key={p.id} className="p-row" onClick={() => onOpenProject(p.id)} style={{ display: "flex", alignItems: "center", height: 42, borderBottom: i === projects.length - 1 ? "none" : `1px solid ${T.line}`, fontSize: 12.5, padding: "0 16px", cursor: "pointer" }}>
              <div style={{ width: 88, flexShrink: 0 }}><span style={{ fontSize: 10.5, fontWeight: 700, background: MPRS[p.mprs].bg, color: MPRS[p.mprs].text, padding: "2px 7px", borderRadius: 5 }}>{MPRS[p.mprs].label}</span></div>
              <div style={{ flex: 1, minWidth: 0, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>{p.name}</div>
              <div style={{ width: 130, flexShrink: 0, color: T.sub, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.hq}</div>
              <div style={{ width: 72, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmtEok(p.budget)}</div>
              <div style={{ width: 72, textAlign: "right", flexShrink: 0, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtEok(p.exec)}</div>
              <div style={{ width: 160, flexShrink: 0, paddingLeft: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}><Bar value={rate} color={rate >= 70 ? "#16A34A" : rate >= 30 ? T.accent : "#E0A106"} h={6} /></div>
                <span style={{ width: 32, textAlign: "right", fontSize: 11.5, color: T.sub, fontVariantNumeric: "tabular-nums" }}>{rate}%</span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
Object.assign(window, { BudgetPage });
