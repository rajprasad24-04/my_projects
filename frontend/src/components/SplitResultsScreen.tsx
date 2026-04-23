import { motion } from "framer-motion";
import type { InvestmentResult, OnboardingData } from "../types";

interface Props {
  result: InvestmentResult;
  onboarding: OnboardingData;
  onBack: () => void;
  onProceed: () => void;
}

function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.statRow}>
      <span style={s.statLabel}>{label}</span>
      <span style={s.statValue}>{value}</span>
    </div>
  );
}

function SideCard({
  title,
  fvTarget,
  needed,
  youHave,
  surplus,
  isOk,
}: {
  title: string;
  fvTarget: number;
  needed: number;
  youHave: number;
  surplus: number;
  isOk: boolean;
}) {
  const surplusAbs = Math.abs(surplus);
  const label = surplus >= 0 ? "Surplus" : "Shortfall";
  const color = isOk ? "var(--green)" : "var(--red)";

  return (
    <div style={s.sideCard}>
      <div style={s.sideTitle}>{title}</div>
      <StatRow label="FV target" value={formatINR(fvTarget)} />
      <StatRow label="Needed" value={formatINR(needed)} />
      <StatRow label="You have" value={formatINR(youHave)} />
      <div style={s.statRow}>
        <span style={s.statLabel}>{label}</span>
        <span style={{ ...s.statValue, color, fontWeight: 700 }}>
          {isOk ? "✔" : "✘"} {formatINR(surplusAbs)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SplitResultsScreen({ result, onboarding, onBack, onProceed }: Props) {
  const { split, suggestion } = result;
  const bothOk = split.both_ok;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={s.eyebrow}>Step 5 of 6 — Split Results</p>
        <h2 style={s.heading}>Your allocation plan</h2>
      </div>

      {/* Split card */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.cardTitle}>
            Lumpsum {split.w_l.toFixed(1)}% / SIP {split.w_s.toFixed(1)}%
          </span>
          <span style={{
            ...s.badge,
            background: bothOk ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
            color: bothOk ? "var(--green)" : "var(--red)",
          }}>
            {bothOk ? "✔ Target Met" : "✘ Target Not Met"}
          </span>
        </div>

        {/* Lumpsum + SIP cards */}
        <div style={s.sideGrid}>
          <SideCard
            title="LUMPSUM"
            fvTarget={split.fv_target_lumpsum}
            needed={split.lumpsum_needed}
            youHave={onboarding.lumpsum}
            surplus={split.lumpsum_surplus}
            isOk={split.lumpsum_ok}
          />
          <SideCard
            title="SIP"
            fvTarget={split.fv_target_sip}
            needed={split.sip_needed}
            youHave={onboarding.sipMonthly}
            surplus={split.sip_surplus}
            isOk={split.sip_ok}
          />
        </div>

        {/* Bucket breakdown */}
        <div style={s.buckets}>
          <div style={s.bucket}>
            <div style={s.bucketTitle}>SHORT-TERM BUCKET</div>
            <StatRow label="Lumpsum" value={formatINR(split.st_lumpsum)} />
            <StatRow label="SIP" value={formatINR(split.st_sip) + "/mo"} />
          </div>
          <div style={s.bucketDivider} />
          <div style={s.bucket}>
            <div style={{ ...s.bucketTitle, color: "var(--blue)" }}>
              CORE PORTFOLIO
            </div>
            <StatRow label="Lumpsum" value={formatINR(split.core_lumpsum)} />
            <StatRow label="SIP" value={formatINR(split.core_sip) + "/mo"} />
          </div>
        </div>
      </div>

      {/* Auto suggestion */}
      <div style={s.card}>
        <div style={s.cardTitle}>Auto Suggestion</div>

        {suggestion.valid_range_exists ? (
          <>
            <p style={s.suggLine}>
              Valid range:{" "}
              <strong style={{ color: "var(--blue)" }}>
                W_min {suggestion.w_min.toFixed(1)}%
              </strong>{" "}
              to{" "}
              <strong style={{ color: "var(--blue)" }}>
                W_max {suggestion.w_max.toFixed(1)}%
              </strong>
            </p>
            {suggestion.w_sweet !== null && (
              <p style={s.suggLine}>
                Sweet spot:{" "}
                <strong style={{ color: "var(--blue)" }}>
                  {suggestion.w_sweet.toFixed(1)}% lumpsum /{" "}
                  {(100 - suggestion.w_sweet).toFixed(1)}% SIP
                </strong>
              </p>
            )}

            {/* Boundary table */}
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Split</th>
                    <th style={s.th}>L Needed</th>
                    <th style={s.th}>SIP Needed</th>
                    <th style={s.th}>L Surplus</th>
                    <th style={s.th}>SIP Surplus</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Min", ev: suggestion.at_min },
                    { label: "Sweet", ev: suggestion.sweet },
                    { label: "Max", ev: suggestion.at_max },
                  ].map(({ label, ev }) =>
                    ev ? (
                      <tr key={label}>
                        <td style={s.tdLabel}>{label}</td>
                        <td style={s.td}>{formatINR(ev.lumpsum_needed)}</td>
                        <td style={s.td}>{formatINR(ev.sip_needed)}</td>
                        <td style={{
                          ...s.td,
                          color: ev.lumpsum_surplus >= 0 ? "var(--green)" : "var(--red)",
                        }}>
                          {ev.lumpsum_surplus >= 0 ? "+" : ""}
                          {formatINR(ev.lumpsum_surplus)}
                        </td>
                        <td style={{
                          ...s.td,
                          color: ev.sip_surplus >= 0 ? "var(--green)" : "var(--red)",
                        }}>
                          {ev.sip_surplus >= 0 ? "+" : ""}
                          {formatINR(ev.sip_surplus)}
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={s.noSplit}>
            No valid split exists. Combined shortfall:{" "}
            <strong style={{ color: "var(--red)" }}>
              {suggestion.combined_shortfall !== undefined
                ? formatINR(suggestion.combined_shortfall)
                : "N/A"}
            </strong>
            <br />
            <span style={{ fontSize: 13 }}>
              Go back and adjust the slider or increase your lumpsum / SIP.
            </span>
          </div>
        )}
      </div>

      {/* Not met advisory */}
      {!bothOk && (
        <div style={s.advisory}>
          ⚠ Target not met with this split. Go back and adjust the slider.
        </div>
      )}

      {/* Navigation */}
      <div style={s.nav}>
        <button onClick={onBack} style={s.btnBack}>← Back</button>
        {bothOk && (
          <button onClick={onProceed} style={s.btnNext}>
            Proceed with this allocation →
          </button>
        )}
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
    color: "var(--text)", marginBottom: 0, lineHeight: 1.2,
  },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 28, marginBottom: 24,
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16,
  },
  badge: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
    textTransform: "uppercase", padding: "4px 12px", borderRadius: 20,
  },
  sideGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24,
  },
  sideCard: {
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "16px 18px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  sideTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--blue)", marginBottom: 4,
  },
  statRow: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
  },
  statLabel: { fontSize: 12, color: "var(--muted)" },
  statValue: { fontSize: 13, fontWeight: 600, color: "var(--text)" },
  buckets: {
    display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24,
    borderTop: "1px solid var(--border)", paddingTop: 20,
  },
  bucket: { display: "flex", flexDirection: "column", gap: 10 },
  bucketTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--accent)", marginBottom: 4,
  },
  bucketDivider: { width: 1, background: "var(--border)" },
  suggLine: {
    fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 8,
  },
  tableWrap: {
    overflowX: "auto", marginTop: 16,
    borderRadius: 10, border: "1px solid var(--border)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left", padding: "10px 14px",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--muted)",
    background: "var(--bg)", borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "10px 14px", color: "var(--text)",
    fontWeight: 500, borderBottom: "1px solid var(--border)",
  },
  tdLabel: {
    padding: "10px 14px", color: "var(--muted)",
    fontWeight: 600, fontSize: 12, borderBottom: "1px solid var(--border)",
  },
  noSplit: {
    fontSize: 14, color: "var(--muted)", lineHeight: 1.8,
    padding: "14px 18px",
    background: "rgba(248,113,113,0.06)",
    border: "1px solid rgba(248,113,113,0.15)",
    borderRadius: 8,
  },
  advisory: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8, padding: "12px 16px",
    fontSize: 13, color: "var(--red)", marginBottom: 24,
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
  btnNext: {
    padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    background: "var(--green)", color: "#0e0f11",
    border: "none", cursor: "pointer",
  },
};