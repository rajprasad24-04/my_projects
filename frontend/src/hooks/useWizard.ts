import { useState, useEffect } from "react";
import type {
  WizardStep,
  OnboardingData,
  RiskResult,
  InvestmentResult,
  SettingsData,
} from "../types";

interface WizardState {
  step: WizardStep;
  onboarding: OnboardingData | null;
  riskResult: RiskResult | null;
  plannerWeight: number;
  plannerResult: InvestmentResult | null;
  shortTermLumpsumAsset: string;
  shortTermSipAsset: string;
}

const STORAGE_KEY = "finsight_wizard_state";

function loadState(): WizardState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardState;
  } catch {
    return null;
  }
}

function saveState(state: WizardState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useWizard(settings: SettingsData | null) {
  const defaultAsset = settings?.short_term_default ?? "Debt";

  const [state, setState] = useState<WizardState>(() => {
    // Load from sessionStorage on first render
    const saved = loadState();
    if (saved) return saved;
    return {
      step: "onboarding",
      onboarding: null,
      riskResult: null,
      plannerWeight: 50,
      plannerResult: null,
      shortTermLumpsumAsset: defaultAsset,
      shortTermSipAsset: defaultAsset,
    };
  });

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  function submitOnboarding(data: OnboardingData) {
    setState((prev) => ({ ...prev, step: "quiz", onboarding: data }));
  }

  function submitRiskResult(result: RiskResult) {
    setState((prev) => ({ ...prev, step: "risk-result", riskResult: result }));
  }

  function proceedToPlanner() {
    setState((prev) => ({ ...prev, step: "planner" }));
  }

  function updatePlannerWeight(w: number) {
    setState((prev) => ({ ...prev, plannerWeight: w }));
  }

  function submitPlannerResult(result: InvestmentResult) {
    setState((prev) => ({ ...prev, step: "split-results", plannerResult: result }));
  }

  function proceedToFinalAllocation() {
    setState((prev) => ({ ...prev, step: "final-allocation" }));
  }

  function setShortTermLumpsumAsset(asset: string) {
    setState((prev) => ({ ...prev, shortTermLumpsumAsset: asset }));
  }

  function setShortTermSipAsset(asset: string) {
    setState((prev) => ({ ...prev, shortTermSipAsset: asset }));
  }

  function goBack() {
    setState((prev) => {
      const order: WizardStep[] = [
        "onboarding",
        "quiz",
        "risk-result",
        "planner",
        "split-results",
        "final-allocation",
      ];
      const currentIndex = order.indexOf(prev.step);
      if (currentIndex <= 0) return prev;
      return { ...prev, step: order[currentIndex - 1] };
    });
  }

  function restart() {
    clearState();
    setState({
      step: "onboarding",
      onboarding: null,
      riskResult: null,
      plannerWeight: 50,
      plannerResult: null,
      shortTermLumpsumAsset: defaultAsset,
      shortTermSipAsset: defaultAsset,
    });
  }

  return {
    ...state,
    submitOnboarding,
    submitRiskResult,
    proceedToPlanner,
    updatePlannerWeight,
    submitPlannerResult,
    proceedToFinalAllocation,
    setShortTermLumpsumAsset,
    setShortTermSipAsset,
    goBack,
    restart,
  };
}