import { useState } from "react";
import { motion } from "framer-motion";
import type { OnboardingData } from "../types";

interface Props {
  onSubmit: (data: OnboardingData) => void;
}

const TIME_HORIZON_OPTIONS = [
  { value: 0, label: "Less than 1 year" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years" },
  { value: 4, label: "4 years" },
  { value: 5, label: "5 years" },
  { value: 6, label: "6 years" },
  { value: 7, label: "7 years" },
  { value: 8, label: "8 years" },
  { value: 9, label: "9 years" },
  { value: 10, label: "10 years" },
  { value: 11, label: "11 years" },
  { value: 12, label: "12 years" },
  { value: 13, label: "13 years" },
  { value: 14, label: "14 years" },
  { value: 15, label: "15 years" },
  { value: 16, label: "16 years" },
  { value: 17, label: "17 years" },
  { value: 18, label: "18 years" },
  { value: 19, label: "19 years" },
  { value: 20, label: "20 years" },
  { value: 21, label: "More than 20 years" },
];

export function OnboardingScreen({ onSubmit }: Props) {
  const [userName, setUserName] = useState("");
  const [lumpsum, setLumpsum] = useState("");
  const [sipMonthly, setSipMonthly] = useState("");
  const [target, setTarget] = useState("");
  const [timeHorizon, setTimeHorizon] = useState<number | "">("");
  const [rateSt, setRateSt] = useState("7");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!userName.trim()) e.userName = "Please enter your name.";

    const parsedLumpsum = Number(lumpsum);
    const parsedSip = Number(sipMonthly);

    if (lumpsum === "" || isNaN(parsedLumpsum) || parsedLumpsum < 0)
      e.lumpsum = "Please enter a valid lumpsum amount (0 or more).";

    if (sipMonthly === "" || isNaN(parsedSip) || parsedSip < 0)
      e.sipMonthly = "Please enter a valid SIP amount (0 or more).";

    if (!isNaN(parsedLumpsum) && !isNaN(parsedSip) &&
        parsedLumpsum === 0 && parsedSip === 0)
      e.lumpsum = "At least one of Lumpsum or SIP must be greater than 0.";

    const parsedTarget = Number(target);
    if (target === "" || isNaN(parsedTarget) || parsedTarget <= 0)
      e.target = "Please enter a target amount greater than 0.";

    if (timeHorizon === "") e.timeHorizon = "Please select a time horizon.";

    const parsedRate = Number(rateSt);
    if (rateSt === "" || isNaN(parsedRate) || parsedRate < 0.1 || parsedRate > 50)
      e.rateSt = "Rate must be between 0.1% and 50%.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      userName: userName.trim(),
      lumpsum: Number(lumpsum),
      sipMonthly: Number(sipMonthly),
      target: Number(target),
      timeHorizon: timeHorizon as number,
      rateSt: Number(rateSt),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={s.eyebrow}>Step 1 of 6</p>
        <h1 style={s.heading}>Tell us about yourself</h1>
        <p style={s.sub}>We'll use this to plan your investment allocation.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={s.card}>

        {/* Name */}
        <div style={s.group}>
          <label style={s.label}>Full Name</label>
          <input
            style={{ ...s.input, ...(errors.userName ? s.inputErr : {}) }}
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
          />
          {errors.userName && <p style={s.err}>{errors.userName}</p>}
        </div>

        {/* Lumpsum + SIP side by side */}
        <div style={s.row}>
          <div style={{ ...s.group, flex: 1 }}>
            <label style={s.label}>Lumpsum Amount (₹)</label>
            <input
              style={{ ...s.input, ...(errors.lumpsum ? s.inputErr : {}) }}
              type="number"
              value={lumpsum}
              onChange={(e) => setLumpsum(e.target.value)}
              placeholder="0"
              min="0"
            />
            {errors.lumpsum && <p style={s.err}>{errors.lumpsum}</p>}
          </div>
          <div style={{ ...s.group, flex: 1 }}>
            <label style={s.label}>Monthly SIP (₹/month)</label>
            <input
              style={{ ...s.input, ...(errors.sipMonthly ? s.inputErr : {}) }}
              type="number"
              value={sipMonthly}
              onChange={(e) => setSipMonthly(e.target.value)}
              placeholder="0"
              min="0"
            />
            {errors.sipMonthly && <p style={s.err}>{errors.sipMonthly}</p>}
          </div>
        </div>

        {/* Target */}
        <div style={s.group}>
          <label style={s.label}>Target Withdrawal Amount (₹)</label>
          <input
            style={{ ...s.input, ...(errors.target ? s.inputErr : {}) }}
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. 1000000"
            min="1"
          />
          {errors.target && <p style={s.err}>{errors.target}</p>}
        </div>

        {/* Time Horizon + Rate side by side */}
        <div style={s.row}>
          <div style={{ ...s.group, flex: 2 }}>
            <label style={s.label}>When do you want to withdraw?</label>
            <select
              style={{ ...s.input, ...(errors.timeHorizon ? s.inputErr : {}) }}
              value={timeHorizon}
              onChange={(e) =>
                setTimeHorizon(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="" disabled>Select time horizon</option>
              {TIME_HORIZON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.timeHorizon && <p style={s.err}>{errors.timeHorizon}</p>}
          </div>
          <div style={{ ...s.group, flex: 1 }}>
            <label style={s.label}>Expected Rate (% p.a.)</label>
            <input
              style={{ ...s.input, ...(errors.rateSt ? s.inputErr : {}) }}
              type="number"
              value={rateSt}
              onChange={(e) => setRateSt(e.target.value)}
              placeholder="7"
              min="0.1"
              max="50"
              step="0.1"
            />
            {errors.rateSt && <p style={s.err}>{errors.rateSt}</p>}
          </div>
        </div>

        <button type="submit" style={s.btn}>
          Begin Assessment →
        </button>
      </form>
    </motion.div>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.2em",
    textTransform: "uppercase", color: "var(--blue)", marginBottom: 12,
    fontFamily: "Montserrat, sans-serif",
  },
  heading: {
    fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700,
    color: "var(--text)", marginBottom: 10, lineHeight: 1.2,
    fontFamily: "Montserrat, sans-serif",
  },
  sub: { fontSize: 14, color: "var(--muted)" },
  card: {
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 12, padding: 32, boxShadow: "0 2px 12px rgba(20,83,195,0.06)",
  },
  group: { marginBottom: 20 },
  row: { display: "flex", gap: 16, marginBottom: 0 },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "var(--text)", marginBottom: 8,
    fontFamily: "Montserrat, sans-serif",
  },
  input: {
    width: "100%", padding: "11px 14px",
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text)", fontSize: 14,
    outline: "none",
  },
  inputErr: { borderColor: "var(--error)" },
  err: { fontSize: 12, color: "var(--error)", marginTop: 5 },
  btn: {
    width: "100%", padding: "13px 0", marginTop: 8,
    background: "var(--blue)", color: "#FFFFFF",
    border: "none", borderRadius: 8,
    fontSize: 15, fontWeight: 700,
    fontFamily: "Montserrat, sans-serif",
  },
};