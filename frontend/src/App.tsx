import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { useSettings } from "./hooks/useSettings";
import { useWizard } from "./hooks/useWizard";
import { submitAssessment, calculateInvestment, saveSession } from "./api/client";

import { OnboardingScreen } from "./components/OnboardingScreen";
import { QuizScreen } from "./components/QuizScreen";
import { RiskResultScreen } from "./components/RiskResultScreen";
import { PlannerScreen } from "./components/PlannerScreen";
import { SplitResultsScreen } from "./components/SplitResultsScreen";
import { FinalAllocationScreen } from "./components/FinalAllocationScreen";
import { SettingsScreen } from "./components/SettingsScreen";

import type { OnboardingData, InvestmentRequest } from "./types";

// ---------------------------------------------------------------------------
// Header — fixed top-right on all pages
// ---------------------------------------------------------------------------
function Header() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      height: 64, background: "#FFFFFF",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px", zIndex: 1000,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <img
        src="/wcg-logo.png"
        alt="WCG Logo"
        style={{ height: 36 }}
      />
    </div>
  );
}
// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------
function Wizard() {
  const { settings, loading, getAllocationForScore } = useSettings();
  const wizard = useWizard(settings);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 2 — submit quiz answers to backend
  async function handleQuizComplete(answers: Record<string, number>) {
    if (!wizard.onboarding) return;
    setSubmitError(null);
    try {
      const result = await submitAssessment({
        user_name: wizard.onboarding.userName,
        time_horizon: wizard.onboarding.timeHorizon,
        investment_amount:
          wizard.onboarding.lumpsum + wizard.onboarding.sipMonthly * 12,
        answers,
      });

      // Save session immediately after assessment
      try {
        await saveSession({
          user_name: result.user_name,
          time_horizon: result.time_horizon,
          investment_amount: result.investment_amount,
          answers,
          score: result.score,
          category: result.category,
          level: result.level,
          breakdown: result.breakdown,
        });
      } catch {
        // Silent fail — don't block user if save fails
      }

      wizard.submitRiskResult(result);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit assessment."
      );
    }
  }

  // Step 4 — calculate investment split
  async function handleCalculate(wL: number): Promise<void> {
    if (!wizard.onboarding) return;
    const payload: InvestmentRequest = {
      target: wizard.onboarding.target,
      years: Math.max(1, wizard.onboarding.timeHorizon),
      lumpsum: wizard.onboarding.lumpsum,
      sip_monthly: wizard.onboarding.sipMonthly,
      rate_st: wizard.onboarding.rateSt,
      w_l: wL,
    };
    const result = await calculateInvestment(payload);
    wizard.submitPlannerResult(result);
  }

  // Step 6 — save session
  async function handleSave() {
    if (
      !wizard.onboarding ||
      !wizard.riskResult ||
      !wizard.plannerResult
    ) return;

    const alloc = getAllocationForScore(wizard.riskResult.score);

    try {
      await saveSession({
        onboarding: wizard.onboarding,
        risk_result: wizard.riskResult,
        planner_result: wizard.plannerResult,
        final_allocation: {
          shortTermLumpsumAsset: wizard.shortTermLumpsumAsset,
          shortTermSipAsset: wizard.shortTermSipAsset,
          coreAllocationBand: "",
          allocationUsed: alloc,
        },
      });
    } catch {
      // Silent fail — session save is non-critical
    }

    wizard.restart();
  }

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "60vh", color: "var(--muted)", fontSize: 16,
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 720, margin: "0 auto", padding: "96px 24px 80px",
    }}>
      {/* Step progress indicator */}
      <StepIndicator current={wizard.step} />

      <AnimatePresence mode="wait">
        {/* Step 1 */}
        {wizard.step === "onboarding" && (
          <OnboardingScreen
            key="onboarding"
            onSubmit={(data: OnboardingData) => wizard.submitOnboarding(data)}
          />
        )}

        {/* Step 2 */}
        {wizard.step === "quiz" && wizard.onboarding && (
          <div key="quiz">
            {submitError && (
              <div style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 8, padding: "12px 16px",
                color: "var(--red)", fontSize: 13, marginBottom: 16,
              }}>
                {submitError}
              </div>
            )}
            <QuizScreen
              onboarding={wizard.onboarding}
              onComplete={handleQuizComplete}
              onBack={wizard.goBack}
            />
          </div>
        )}

        {/* Step 3 */}
        {wizard.step === "risk-result" && wizard.riskResult && (
          <RiskResultScreen
            key="risk-result"
            result={wizard.riskResult}
            onBack={wizard.goBack}
            onContinue={wizard.proceedToPlanner}
            onRestart={wizard.restart}
          />
        )}

        {/* Step 4 */}
        {wizard.step === "planner" &&
          wizard.onboarding &&
          wizard.riskResult && (
            <PlannerScreen
              key="planner"
              onboarding={wizard.onboarding}
              riskResult={wizard.riskResult}
              plannerWeight={wizard.plannerWeight}
              onWeightChange={wizard.updatePlannerWeight}
              onBack={wizard.goBack}
              onCalculate={handleCalculate}
            />
          )}

        {/* Step 5 */}
        {wizard.step === "split-results" &&
          wizard.plannerResult &&
          wizard.onboarding && (
            <SplitResultsScreen
              key="split-results"
              result={wizard.plannerResult}
              onboarding={wizard.onboarding}
              onBack={wizard.goBack}
              onProceed={wizard.proceedToFinalAllocation}
            />
          )}

        {/* Step 6 */}
        {wizard.step === "final-allocation" &&
          wizard.onboarding &&
          wizard.riskResult &&
          wizard.plannerResult &&
          settings && (
            <FinalAllocationScreen
              key="final-allocation"
              onboarding={wizard.onboarding}
              riskResult={wizard.riskResult}
              plannerResult={wizard.plannerResult}
              settings={settings}
              shortTermLumpsumAsset={wizard.shortTermLumpsumAsset}
              shortTermSipAsset={wizard.shortTermSipAsset}
              onShortTermLumpsumAssetChange={wizard.setShortTermLumpsumAsset}
              onShortTermSipAssetChange={wizard.setShortTermSipAsset}
              getAllocationForScore={getAllocationForScore}
              onBack={wizard.goBack}
              onSave={handleSave}
            />
          )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator dots
// ---------------------------------------------------------------------------
const STEPS = [
  "onboarding", "quiz", "risk-result",
  "planner", "split-results", "final-allocation",
];

function StepIndicator({ current }: { current: string }) {
  const idx = STEPS.indexOf(current);
  return (
    <div style={{
      display: "flex", gap: 8,
      justifyContent: "center", marginBottom: 40,
    }}>
      {STEPS.map((_, i) => (
        <div key={i} style={{
          width: i === idx ? 28 : 8,
          height: 8, borderRadius: 4,
          background: i === idx
            ? "var(--blue)"
            : i < idx
            ? "var(--blue-light)"
            : "var(--border)",
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}
// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Wizard />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}