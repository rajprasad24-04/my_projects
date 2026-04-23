import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { RiskResult } from "../types";

interface Props {
  result: RiskResult;
  onBack: () => void;
  onContinue: () => void; // TEMP: Investment planner hidden for now — uncomment when ready
  onRestart: () => void;
}

// ---------------------------------------------------------------------------
// Score ring constants
// ---------------------------------------------------------------------------
const SCORE_MIN = 16;
const SCORE_MAX = 88;
const RING_R = 85;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

// ---------------------------------------------------------------------------
// Risk level colors
// ---------------------------------------------------------------------------
const LEVEL_COLORS: Record<string, string> = {
  "very-low": "#34d399",
  "low":      "#86efac",
  "average":  "#f0b429",
  "high":     "#fb923c",
  "very-high":"#f87171",
};

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "very-low":  "You strongly prefer capital protection. Most comfortable with fixed deposits and government bonds.",
  "low":       "You prefer conservative investments and prioritise protecting capital over high returns.",
  "average":   "You are comfortable with a balanced portfolio mixing growth assets with stable investments.",
  "high":      "You are comfortable accepting short-term losses in pursuit of long-term gains.",
  "very-high": "You actively seek high-return investments and are comfortable with significant volatility.",
};

// ---------------------------------------------------------------------------
// Bell curve categories
// ---------------------------------------------------------------------------
const BELL_CATS = [
  { name: "Very Low",  min: 16, max: 34, pct: "7%",  level: "very-low",  color: "#34d399" },
  { name: "Low",       min: 35, max: 44, pct: "24%", level: "low",       color: "#86efac" },
  { name: "Average",   min: 45, max: 54, pct: "38%", level: "average",   color: "#f0b429" },
  { name: "High",      min: 55, max: 64, pct: "24%", level: "high",      color: "#fb923c" },
  { name: "Very High", min: 65, max: 88, pct: "7%",  level: "very-high", color: "#f87171" },
];

// ---------------------------------------------------------------------------
// Draw bell curve on canvas
// ---------------------------------------------------------------------------
function drawBellCurve(canvas: HTMLCanvasElement, score: number, activeLevel: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.offsetWidth || 680;
  const cssH = 200;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.scale(dpr, dpr);

  const W = cssW;
  const H = cssH;
  ctx.clearRect(0, 0, W, H);

  const mu = 49.5;
  const sigma = 10;
  const gauss = (x: number) => Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));

  const padL = 20, padR = 20, padT = 20, padB = 40;
  const gW = W - padL - padR;
  const gH = H - padT - padB;
  const xMin = 16, xMax = 88;

  const xC = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * gW;
  const yC = (y: number) => padT + gH - y * gH;

  // Filled regions
  BELL_CATS.forEach((cat) => {
    const isActive = cat.level === activeLevel;
    ctx.beginPath();
    ctx.moveTo(xC(cat.min), yC(0));
    for (let x = cat.min; x <= cat.max; x += 0.5) {
      ctx.lineTo(xC(x), yC(gauss(x)));
    }
    ctx.lineTo(xC(cat.max), yC(0));
    ctx.closePath();
    ctx.fillStyle = isActive ? cat.color + "cc" : cat.color + "28";
    ctx.fill();
  });

  // Curve outline
  ctx.beginPath();
  ctx.moveTo(xC(xMin), yC(gauss(xMin)));
  for (let x = xMin; x <= xMax; x += 0.5) {
    ctx.lineTo(xC(x), yC(gauss(x)));
  }
  ctx.strokeStyle = "#4b5563";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Score marker
  const sx = xC(score);
  ctx.beginPath();
  ctx.moveTo(sx, yC(0));
  ctx.lineTo(sx, yC(gauss(score) + 0.06));
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Score label
  const labelY = Math.max(yC(gauss(score) + 0.12), padT + 14);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(score), sx, labelY);

  // Dividers
  [35, 45, 55, 65].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(xC(x), yC(0));
    ctx.lineTo(xC(x), yC(gauss(x)));
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Baseline
  ctx.beginPath();
  ctx.moveTo(padL, yC(0));
  ctx.lineTo(W - padR, yC(0));
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RiskResultScreen({ result, onBack, onContinue, onRestart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const color = LEVEL_COLORS[result.level] ?? "#f0b429";

  const clampedPct = Math.min(
    Math.max((result.score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN), 0), 1
  );
  const ringOffset = RING_CIRCUMFERENCE - RING_CIRCUMFERENCE * clampedPct;

  useEffect(() => {
    const t = setTimeout(() => {
      if (canvasRef.current) {
        drawBellCurve(canvasRef.current, result.score, result.level);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [result.score, result.level]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: "center" }}
    >
      <p style={s.eyebrow}>Step 3 of 6 — Risk Result</p>
      <p style={s.greeting}>Results for {result.user_name}</p>

      {/* Score ring */}
      <div style={s.ringWrap}>
        <svg width="200" height="200" viewBox="0 0 200 200"
          style={{ transform: "rotate(-90deg)" }}>
          <circle cx="100" cy="100" r={RING_R}
            fill="none" stroke="#2a2d35" strokeWidth="10" />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="100" cy="100" r={RING_R}
            fill="none" stroke="url(#ringGrad)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
            animate={{ strokeDashoffset: ringOffset }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          />
        </svg>
        <div style={s.ringCenter}>
          <div style={{ ...s.scoreNum, color }}>{result.score}</div>
          <div style={s.scoreLabel}>out of 88</div>
        </div>
      </div>

      {/* Badge */}
      <div style={{ ...s.badge, background: color + "22", color }}>
        {result.category}
      </div>

      <p style={s.desc}>{LEVEL_DESCRIPTIONS[result.level]}</p>

      {/* Bell curve */}
      <div style={s.card}>
        <p style={s.cardTitle}>RISK DISTRIBUTION</p>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", display: "block" }}
        />
        <div style={s.bellLabels}>
          {BELL_CATS.map((cat) => {
            const isActive = cat.level === result.level;
            return (
              <div key={cat.level} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: isActive ? color : "var(--muted)",
                }}>
                  {cat.name}
                </div>
                <div style={{
                  fontSize: 10, color: isActive ? color : "var(--muted)",
                  opacity: 0.7,
                }}>
                  {cat.pct}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* TEMP: Score breakdown hidden for client-facing version */}
      {/* Breakdown */}
      {/*<div style={s.card}>
        <p style={s.cardTitle}>SCORE BREAKDOWN</p>
        {result.breakdown.map((item, idx) => (
          <div key={item.question} style={{
            ...s.breakRow,
            borderBottom: idx === result.breakdown.length - 1
              ? "none" : "1px solid var(--border)",
          }}>
            <span style={s.breakQ}>{item.question}</span>
            <div style={s.barWrap}>
              <motion.div
                style={s.bar}
                initial={{ width: "0%" }}
                animate={{ width: `${(item.points / maxPts) * 100}%` }}
                transition={{ duration: 0.8, delay: idx * 0.05 }}
              />
            </div>
            <span style={s.breakPts}>{item.points}</span>
          </div>
        ))}
      </div>*/}

      {/* Navigation */}
      <div style={s.nav}>
        <button onClick={onBack} style={s.btnBack}>← Back</button>
        {/* TEMP: Investment planner hidden for now — uncomment when ready */}
        {/* <button onClick={onContinue} style={s.btnNext}>
          Continue to Investment Planner →
        </button> */}
        <button onClick={onRestart} style={s.btnNext}>
          Start New Assessment →
        </button>
      </div>
    </motion.div>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.2em",
    textTransform: "uppercase", color: "var(--blue)", marginBottom: 8,
    fontFamily: "Montserrat, sans-serif",
  },
  greeting: { fontSize: 14, color: "var(--muted)", marginBottom: 28 },
  ringWrap: {
    position: "relative", width: 200, height: 200, margin: "0 auto 20px",
  },
  ringCenter: {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
  },
  scoreNum: {
    fontSize: 52, fontWeight: 700, lineHeight: 1,
    fontFamily: "Montserrat, sans-serif",
  },
  scoreLabel: {
    fontSize: 11, color: "var(--muted)", marginTop: 4,
    textTransform: "uppercase", letterSpacing: "0.1em",
  },
  badge: {
    display: "inline-block", padding: "6px 20px",
    borderRadius: 100, fontSize: 13, fontWeight: 600,
    marginBottom: 20, fontFamily: "Montserrat, sans-serif",
  },
  desc: {
    fontSize: 14, color: "var(--muted)", lineHeight: 1.7,
    maxWidth: 480, margin: "0 auto 32px",
  },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "24px 24px 16px",
    marginBottom: 24, textAlign: "left",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "var(--blue)", marginBottom: 16,
    fontFamily: "Montserrat, sans-serif",
  },
  bellLabels: {
    display: "flex", justifyContent: "space-between", marginTop: 12,
  },
  breakRow: {
    display: "flex", alignItems: "center",
    padding: "10px 0", gap: 12,
  },
  breakQ: {
    fontSize: 12, color: "var(--muted)", width: 30, flexShrink: 0,
    fontFamily: "Montserrat, sans-serif",
  },
  barWrap: {
    flex: 1, height: 4, background: "var(--border)",
    borderRadius: 2, overflow: "hidden",
  },
  bar: {
    height: "100%", background: "var(--blue)", borderRadius: 2,
  },
  breakPts: {
    fontSize: 12, fontWeight: 600, color: "var(--blue)",
    width: 40, textAlign: "right", flexShrink: 0,
  },
  nav: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginTop: 8, marginBottom: 40,
  },
  btnBack: {
    padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: "transparent", color: "var(--muted)",
    border: "1px solid var(--border)", cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
  },
  btnNext: {
    padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    background: "var(--orange)", color: "#FFFFFF",
    border: "none", cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
  },
};