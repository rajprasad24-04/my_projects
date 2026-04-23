import { useState } from "react";
import { motion } from "framer-motion";
import type { OnboardingData, RiskResult } from "../types";

interface Props {
  onboarding: OnboardingData;
  riskResult: RiskResult;
  plannerWeight: number;
  onWeightChange: (w: number) => void;
  onBack: () => void;
  onCalculate: (wL: number) => Promise<void>;
}

function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

const LEVEL_COLORS: Record<string, string> = {
  "very-low": "#34d399",
  "low": "#86efac",
  "average": "#f0b429",
  "high": "#fb923c",
  "very-high": "#f87171",
};

export function PlannerScreen({
  onboarding,
  riskResult,
  plannerWeight,
  onWeightChange,
  onBack,
  onCalculate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const color = LEVEL_COLORS[riskResult.level] ?? "#f0b429";

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onCalculate(plannerWeight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={s.eyebrow}>Step 4 of 6 — Investment Planner</p>
        <h2 style={s.heading}>Set your lumpsum weight</h2>
        <p style={s.sub}>
          Decide how much of your target should be funded by lumpsum vs SIP.
        </p>
      </div>

      {/* Summary bar */}
      <div style={s.summaryBar}>
        <SummaryItem label="Target" value={formatINR(onboarding.target)} />
        <Divider />
        <SummaryItem
          label="Horizon"
          value={`${onboarding.timeHorizon} yr${onboarding.timeHorizon !== 1 ? "s" : ""}`}
        />
        <Divider />
        <SummaryItem label="Lumpsum" value={formatINR(onboarding.lumpsum)} />
        <Divider />
        <SummaryItem label="SIP" value={formatINR(onboarding.sipMonthly) + "/mo"} />
        <Divider />
        <SummaryItem label="Rate" value={`${onboarding.rateSt}% p.a.`} />
      </div>

      {/* Risk score badge */}
      <div style={s.riskBadge}>
        <span style={s.riskBadgeLabel}>Your Risk Score</span>
        <span style={{ ...s.riskBadgeValue, color }}>
          {riskResult.score} — {riskResult.category}
        </span>
      </div>

      {/* Slider form */}
      <form onSubmit={handleCalculate} style={s.card}>
        <label style={s.label}>Lumpsum Weight</label>

        {/* Live display */}
        <div style={s.weightDisplay}>
          <div style={s.weightBox}>
            <span style={s.weightNum}>{plannerWeight}%</span>
            <span style={s.weightSub}>Lumpsum</span>
          </div>
          <div style={s.weightSep}>vs</div>
          <div style={s.weightBox}>
            <span style={s.weightNum}>{100 - plannerWeight}%</span>
            <span style={s.weightSub}>SIP</span>
          </div>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={plannerWeight}
          onChange={(e) => onWeightChange(Number(e.target.value))}
          style={s.slider}
        />
        <div style={s.sliderBounds}>
          <span>0% Lumpsum</span>
          <span>100% Lumpsum</span>
        </div>

        {/* Preview line */}
        <p style={s.preview}>
          Lumpsum covers{" "}
          <strong style={{ color: "var(--blue)" }}>{plannerWeight}%</strong>
          {" "}of {formatINR(onboarding.target)} target.
          SIP covers the remaining{" "}
          <strong style={{ color: "var(--blue)" }}>{100 - plannerWeight}%</strong>.
        </p>

        {error && <div style={s.errorBox}>{error}</div>}

        {/* Buttons */}
        <div style={s.nav}>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            style={s.btnBack}
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading}
            style={s.btnNext}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" /> Calculating...
              </span>
            ) : (
              "Calculate →"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1, height: 28,
      background: "var(--border)", flexShrink: 0,
    }} />
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
  summaryBar: {
    display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "14px 20px", marginBottom: 16,
  },
  riskBadge: {
    display: "flex", alignItems: "center", gap: 10,
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "12px 20px", marginBottom: 24,
  },
  riskBadgeLabel: {
    fontSize: 12, color: "var(--muted)", fontWeight: 500,
  },
  riskBadgeValue: {
    fontSize: 14, fontWeight: 700,
  },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 32,
  },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "var(--text)", marginBottom: 20,
  },
  weightDisplay: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 24, marginBottom: 24,
  },
  weightBox: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4,
  },
  weightNum: {
    fontSize: 40, fontWeight: 700, color: "var(--blue)", lineHeight: 1,
  },
  weightSub: {
    fontSize: 12, color: "var(--muted)", textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  weightSep: {
    fontSize: 14, color: "var(--muted)", fontWeight: 500,
  },
  slider: {
    width: "100%", accentColor: "var(--blue)",
    cursor: "pointer", height: 6, marginBottom: 8,
  },
  sliderBounds: {
    display: "flex", justifyContent: "space-between",
    fontSize: 11, color: "var(--muted)", marginBottom: 20,
  },
  preview: {
    fontSize: 13, color: "var(--muted)", lineHeight: 1.6,
    background: "rgba(91,141,238,0.06)",
    border: "1px solid rgba(91,141,238,0.15)",
    borderRadius: 8, padding: "10px 14px", marginBottom: 24,
  },
  errorBox: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: 8, padding: "12px 16px",
    color: "var(--red)", fontSize: 13, marginBottom: 16,
  },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  btnBack: {
    padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: "transparent", color: "var(--muted)",
    border: "1px solid var(--border)", cursor: "pointer",
  },
  btnNext: {
    padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    background: "var(--blue)", color: "#ffffff",
    border: "none", cursor: "pointer",
  },
};