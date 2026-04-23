import { motion } from "framer-motion";
import type {
  OnboardingData,
  RiskResult,
  InvestmentResult,
  SettingsData,
} from "../types";

interface Props {
  onboarding: OnboardingData;
  riskResult: RiskResult;
  plannerResult: InvestmentResult;
  settings: SettingsData;
  shortTermLumpsumAsset: string;
  shortTermSipAsset: string;
  onShortTermLumpsumAssetChange: (asset: string) => void;
  onShortTermSipAssetChange: (asset: string) => void;
  getAllocationForScore: (score: number) => Record<string, number>;
  onBack: () => void;
  onSave: () => void;
}

function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function formatINRPerMonth(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN") + "/mo";
}

export function FinalAllocationScreen({
  onboarding,
  riskResult,
  plannerResult,
  settings,
  shortTermLumpsumAsset,
  shortTermSipAsset,
  onShortTermLumpsumAssetChange,
  onShortTermSipAssetChange,
  getAllocationForScore,
  onBack,
  onSave,
}: Props) {
  const { split } = plannerResult;
  const assetClasses = settings.asset_classes;
  const coreAlloc = getAllocationForScore(riskResult.score);

  // -------------------------------------------------------------------------
  // Section 2 — Core portfolio rows
  // -------------------------------------------------------------------------
  const coreRows = assetClasses
    .map((asset) => ({
      asset,
      pct: coreAlloc[asset] ?? 0,
      lumpsumAmt: ((coreAlloc[asset] ?? 0) / 100) * split.core_lumpsum,
      sipAmt: ((coreAlloc[asset] ?? 0) / 100) * split.core_sip,
    }))
    .filter((r) => r.pct > 0);

  const coreTotalLumpsum = coreRows.reduce((s, r) => s + r.lumpsumAmt, 0);
  const coreTotalSip = coreRows.reduce((s, r) => s + r.sipAmt, 0);

  // -------------------------------------------------------------------------
  // Section 3 — Combined rows
  // -------------------------------------------------------------------------
  const combinedRows = assetClasses
    .map((asset) => {
      const stL = asset === shortTermLumpsumAsset ? split.st_lumpsum : 0;
      const stS = asset === shortTermSipAsset ? split.st_sip : 0;
      const coreL = ((coreAlloc[asset] ?? 0) / 100) * split.core_lumpsum;
      const coreS = ((coreAlloc[asset] ?? 0) / 100) * split.core_sip;
      return {
        asset,
        stL, stS, coreL, coreS,
        totalL: stL + coreL,
        totalS: stS + coreS,
      };
    })
    .filter((r) => r.totalL > 0 || r.totalS > 0);

  const combinedTotalL = combinedRows.reduce((s, r) => s + r.totalL, 0);
  const combinedTotalS = combinedRows.reduce((s, r) => s + r.totalS, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={s.eyebrow}>Step 6 of 6 — Final Allocation</p>
        <h2 style={s.heading}>Your complete portfolio plan</h2>
        <p style={s.sub}>
          for {onboarding.userName} &nbsp;·&nbsp; Risk Score:{" "}
          <strong>{riskResult.score}</strong> ({riskResult.category})
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1 — Short-Term Bucket                                       */}
      {/* ------------------------------------------------------------------ */}
      <div style={s.card}>
        <p style={s.cardTitle}>SHORT-TERM BUCKET</p>
        <p style={s.cardSub}>
          Select which asset class each amount goes into.
        </p>

        <div style={s.stGrid}>
          {/* Lumpsum row */}
          <div style={s.stRow}>
            <div style={s.stLeft}>
              <span style={s.stKey}>Lumpsum</span>
              <span style={s.stAmt}>{formatINR(split.st_lumpsum)}</span>
            </div>
            <span style={s.arrow}>→</span>
            <div style={s.stRight}>
              <label style={s.selectLabel}>Asset Class</label>
              <select
                value={shortTermLumpsumAsset}
                onChange={(e) => onShortTermLumpsumAssetChange(e.target.value)}
                style={s.select}
              >
                {assetClasses.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SIP row */}
          <div style={s.stRow}>
            <div style={s.stLeft}>
              <span style={s.stKey}>SIP</span>
              <span style={s.stAmt}>{formatINRPerMonth(split.st_sip)}</span>
            </div>
            <span style={s.arrow}>→</span>
            <div style={s.stRight}>
              <label style={s.selectLabel}>Asset Class</label>
              <select
                value={shortTermSipAsset}
                onChange={(e) => onShortTermSipAssetChange(e.target.value)}
                style={s.select}
              >
                {assetClasses.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2 — Core Portfolio Asset Allocation                         */}
      {/* ------------------------------------------------------------------ */}
      <div style={s.card}>
        <p style={s.cardTitle}>CORE PORTFOLIO ASSET ALLOCATION</p>
        <p style={s.cardSub}>
          Based on risk score <strong>{riskResult.score}</strong> (
          {riskResult.category} band)
        </p>

        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Asset Class</th>
                <th style={{ ...s.th, textAlign: "right" }}>%</th>
                <th style={{ ...s.th, textAlign: "right" }}>Lumpsum</th>
                <th style={{ ...s.th, textAlign: "right" }}>SIP / mo</th>
              </tr>
            </thead>
            <tbody>
              {coreRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...s.td, textAlign: "center", color: "var(--muted)" }}>
                    No allocation data for this score band.
                  </td>
                </tr>
              ) : (
                coreRows.map((row) => (
                  <tr key={row.asset}>
                    <td style={s.td}>{row.asset}</td>
                    <td style={{ ...s.td, textAlign: "right" }}>{row.pct}%</td>
                    <td style={{ ...s.td, textAlign: "right" }}>
                      {formatINR(row.lumpsumAmt)}
                    </td>
                    <td style={{ ...s.td, textAlign: "right" }}>
                      {formatINRPerMonth(row.sipAmt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td style={s.tdTotal} colSpan={2}>Total</td>
                <td style={{ ...s.tdTotal, textAlign: "right" }}>
                  {formatINR(coreTotalLumpsum)}
                </td>
                <td style={{ ...s.tdTotal, textAlign: "right" }}>
                  {formatINRPerMonth(coreTotalSip)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3 — Full Portfolio Combined                                 */}
      {/* ------------------------------------------------------------------ */}
      <div style={s.card}>
        <p style={s.cardTitle}>FULL PORTFOLIO COMBINED</p>
        <p style={s.cardSub}>
          Updates live when you change short-term asset selections above.
        </p>

        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Asset Class</th>
                <th style={{ ...s.th, textAlign: "right" }}>ST Lumpsum</th>
                <th style={{ ...s.th, textAlign: "right" }}>ST SIP</th>
                <th style={{ ...s.th, textAlign: "right" }}>Core Lumpsum</th>
                <th style={{ ...s.th, textAlign: "right" }}>Core SIP</th>
                <th style={{ ...s.th, textAlign: "right" }}>Total Lumpsum</th>
                <th style={{ ...s.th, textAlign: "right" }}>Total SIP</th>
              </tr>
            </thead>
            <tbody>
              {combinedRows.map((row) => (
                <tr key={row.asset}>
                  <td style={s.td}>{row.asset}</td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    {row.stL > 0 ? formatINR(row.stL) : "—"}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    {row.stS > 0 ? formatINRPerMonth(row.stS) : "—"}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    {row.coreL > 0 ? formatINR(row.coreL) : "—"}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    {row.coreS > 0 ? formatINRPerMonth(row.coreS) : "—"}
                  </td>
                  <td style={{ ...s.td, textAlign: "right", fontWeight: 700 }}>
                    {formatINR(row.totalL)}
                  </td>
                  <td style={{ ...s.td, textAlign: "right", fontWeight: 700 }}>
                    {formatINRPerMonth(row.totalS)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={s.tdTotal}>Total</td>
                <td colSpan={4} />
                <td style={{ ...s.tdTotal, textAlign: "right" }}>
                  {formatINR(combinedTotalL)}
                </td>
                <td style={{ ...s.tdTotal, textAlign: "right" }}>
                  {formatINRPerMonth(combinedTotalS)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div style={s.nav}>
        <button onClick={onBack} style={s.btnBack}>← Back</button>
        <button onClick={onSave} style={s.btnSave}>
          Save & Finish ✓
        </button>
      </div>
    </motion.div>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.2em",
    textTransform: "uppercase", color: "var(--blue)", marginBottom: 10,
  },
  heading: {
    fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700,
    color: "var(--text)", marginBottom: 8, lineHeight: 1.2,
  },
  sub: { fontSize: 14, color: "var(--muted)" },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 28, marginBottom: 24,
  },
  cardTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "var(--muted)", marginBottom: 6,
  },
  cardSub: {
    fontSize: 13, color: "var(--muted)", marginBottom: 20,
  },
  stGrid: { display: "flex", flexDirection: "column", gap: 16 },
  stRow: {
    display: "flex", alignItems: "center", gap: 16,
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "14px 18px",
  },
  stLeft: {
    display: "flex", flexDirection: "column", gap: 4, minWidth: 140,
  },
  stKey: {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.1em", color: "var(--muted)",
  },
  stAmt: { fontSize: 18, fontWeight: 700, color: "var(--text)" },
  arrow: { fontSize: 20, color: "var(--border)", flexShrink: 0 },
  stRight: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  selectLabel: {
    fontSize: 11, color: "var(--muted)", fontWeight: 500,
  },
  select: {
    padding: "8px 12px", background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 8,
    color: "var(--text)", fontSize: 14, cursor: "pointer",
    width: "100%",
  },
  tableWrap: {
    overflowX: "auto", borderRadius: 10,
    border: "1px solid var(--border)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "10px 14px", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--muted)", background: "var(--bg)",
    borderBottom: "1px solid var(--border)", textAlign: "left",
  },
  td: {
    padding: "10px 14px", color: "var(--text)",
    borderBottom: "1px solid var(--border)", textAlign: "left",
  },
  tdTotal: {
    padding: "10px 14px", fontWeight: 700,
    color: "var(--text)", fontSize: 13,
    borderTop: "2px solid var(--border)", textAlign: "left",
  },
  nav: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 40,
  },
  btnBack: {
    padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: "transparent", color: "var(--muted)",
    border: "1px solid var(--border)", cursor: "pointer",
  },
  btnSave: {
    padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    background: "var(--green)", color: "#0e0f11",
    border: "none", cursor: "pointer",
  },
};