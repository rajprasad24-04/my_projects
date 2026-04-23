import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OnboardingData } from "../types";

export const QUESTIONS = [
  {
    key: "Q1",
    text: "Compared to others, how do you rate your willingness to take financial risks?",
    options: [
      "Extremely low risk taker",
      "Very low risk taker",
      "Low risk taker",
      "Average risk taker",
      "High risk taker",
      "Very high risk taker",
      "Extremely high risk taker",
    ],
  },
  {
    key: "Q2",
    text: "How easily do you adapt when things go wrong financially?",
    options: ["Very uneasily", "Somewhat uneasily", "Somewhat easily", "Very easily"],
  },
  {
    key: "Q3",
    text: 'When you think of the word "risk" in a financial context, which word comes to mind first?',
    options: ["Danger", "Uncertainty", "Opportunity", "Thrill"],
  },
  {
    key: "Q4",
    text: "When facing a major financial decision, are you more concerned about possible losses or gains?",
    options: [
      "Always the possible losses",
      "Usually the possible losses",
      "Usually the possible gains",
      "Always the possible gains",
    ],
  },
  {
    key: "Q5",
    text: "What degree of risk are you currently prepared to take with your financial decisions?",
    options: ["Very small", "Small", "Medium", "Large", "Very large"],
  },
  {
    key: "Q6",
    text: "A stock you bought dropped drastically due to poor management, but has since restructured. Would you buy it again?",
    options: [
      "Definitely not",
      "Probably not",
      "Not sure",
      "Probably",
      "Definitely",
    ],
  },
  {
    key: "Q7",
    text: "By how much could your total investments fall before you feel uncomfortable?",
    options: [
      "Any fall would make me uncomfortable",
      "10%",
      "20%",
      "33%",
      "50%",
      "More than 50%",
    ],
  },
  {
    key: "Q8",
    text: "Which investment portfolio mix do you find most appealing?",
    options: [
      "0% High / 0% Medium / 100% Low risk",
      "0% High / 30% Medium / 70% Low risk",
      "10% High / 40% Medium / 50% Low risk",
      "30% High / 40% Medium / 30% Low risk",
      "50% High / 40% Medium / 10% Low risk",
      "70% High / 30% Medium / 0% Low risk",
      "100% High / 0% Medium / 0% Low risk",
    ],
  },
  {
    key: "Q9",
    text: "Which is more important — that your investment value does not fall, or that it retains purchasing power?",
    options: [
      "Much more important that value does not fall",
      "Somewhat more important that value does not fall",
      "Somewhat more important it retains purchasing power",
      "Much more important it retains purchasing power",
    ],
  },
  {
    key: "Q10",
    text: "What average return do you expect from your portfolio over 10 years compared to bank fixed deposits?",
    options: [
      "About the same as fixed deposits",
      "About 1.5x fixed deposits",
      "About 2x fixed deposits",
      "About 2.5x fixed deposits",
      "About 3x fixed deposits",
      "More than 3x fixed deposits",
    ],
  },
];

interface Props {
  onboarding: OnboardingData;
  onComplete: (answers: Record<string, number>) => void;
  onBack: () => void;
}

export function QuizScreen({ onboarding, onComplete, onBack }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const question = QUESTIONS[current];
  const selected = answers[question.key];
  const isLast = current === QUESTIONS.length - 1;
  const progress = ((current + 1) / QUESTIONS.length) * 100;

  function selectAnswer(value: number) {
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
  }

  function handleNext() {
    if (selected === undefined) return;
    if (isLast) {
      onComplete(answers);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  function handleBack() {
    if (current === 0) {
      onBack();
    } else {
      setCurrent((c) => c - 1);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Progress */}
      <div style={{ marginBottom: 32 }}>
        <div style={s.progressMeta}>
          <span style={s.progressLabel}>
            Question {current + 1} of {QUESTIONS.length}
          </span>
          <span style={s.progressPct}>{Math.round(progress)}%</span>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          style={s.card}
        >
          <p style={s.eyebrow}>Step 2 of 6 — Risk Assessment</p>
          <p style={s.questionText}>{question.text}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {question.options.map((opt, i) => {
              const val = i + 1;
              const isSelected = selected === val;
              return (
                <button
                  key={`${current}-${i}`}
                  onClick={() => selectAnswer(val)}
                  style={{
                    ...s.option,
                    ...(isSelected ? s.optionSelected : {}),
                  }}
                >
                  <span style={{
                    ...s.dot,
                    ...(isSelected ? s.dotSelected : {}),
                  }} />
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div style={s.nav}>
        <button onClick={handleBack} style={s.btnBack}>← Back</button>
        <button
          onClick={handleNext}
          disabled={selected === undefined}
          style={{
            ...s.btnNext,
            ...(selected === undefined ? s.btnDisabled : {}),
          }}
        >
          {isLast ? "See Results →" : "Next →"}
        </button>
      </div>
    </motion.div>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.2em",
    textTransform: "uppercase", color: "var(--blue)", marginBottom: 16,
    fontFamily: "Montserrat, sans-serif",
  },
  progressMeta: {
    display: "flex", justifyContent: "space-between", marginBottom: 8,
  },
  progressLabel: { fontSize: 13, color: "var(--muted)" },
  progressPct: {
    fontSize: 13, color: "var(--blue)", fontWeight: 600,
  },
  progressTrack: {
    height: 4, background: "var(--border)",
    borderRadius: 2, overflow: "hidden",
  },
  progressFill: {
    height: "100%", background: "var(--blue)",
    borderRadius: 2, transition: "width 0.4s ease",
  },
  card: {
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 12, padding: 32, marginBottom: 24,
    boxShadow: "0 2px 12px rgba(20,83,195,0.06)",
  },
  questionText: {
    fontSize: 18, fontWeight: 600, color: "var(--text)",
    lineHeight: 1.5, marginBottom: 24,
    fontFamily: "Montserrat, sans-serif",
  },
  option: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "13px 16px", border: "1px solid var(--border)",
    borderRadius: 8, background: "var(--bg)",
    color: "var(--text-body)", fontSize: 14, textAlign: "left",
    cursor: "pointer", transition: "all 0.15s ease", width: "100%",
  },
  optionSelected: {
    borderColor: "var(--blue)",
    background: "var(--blue-light)",
  },
  dot: {
    width: 18, height: 18, borderRadius: "50%",
    border: "2px solid var(--border)", flexShrink: 0,
    transition: "all 0.15s ease",
  },
  dotSelected: {
    borderColor: "var(--blue)",
    background: "var(--blue)",
    boxShadow: "inset 0 0 0 3px var(--bg)",
  },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  btnBack: {
    padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: "transparent", color: "var(--muted)",
    border: "1px solid var(--border)", cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
  },
  btnNext: {
    padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    background: "var(--blue)", color: "#FFFFFF",
    border: "none", cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
  },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
};