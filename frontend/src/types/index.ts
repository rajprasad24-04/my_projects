// ---------------------------------------------------------------------------
// Risk Assessment Types
// ---------------------------------------------------------------------------
export type RiskLevel = "very-low" | "low" | "average" | "high" | "very-high";
export type RiskCategory = "Very Low" | "Low" | "Average" | "High" | "Very High";

export interface BreakdownItem {
  question: string;
  value: number;
  coefficient: number;
  points: number;
}

export interface RiskResult {
  user_name: string;
  time_horizon: number;
  investment_amount: number;
  score: number;
  category: RiskCategory;
  level: RiskLevel;
  breakdown: BreakdownItem[];
}

// ---------------------------------------------------------------------------
// Onboarding Types
// ---------------------------------------------------------------------------
export interface OnboardingData {
  userName: string;
  lumpsum: number;
  sipMonthly: number;
  target: number;
  timeHorizon: number;
  rateSt: number;
}

// ---------------------------------------------------------------------------
// Investment Planner Types
// ---------------------------------------------------------------------------
export interface SplitEvaluation {
  w_l: number;
  w_s: number;
  fv_target_lumpsum: number;
  fv_target_sip: number;
  lumpsum_needed: number;
  sip_needed: number;
  lumpsum_surplus: number;
  sip_surplus: number;
  lumpsum_ok: boolean;
  sip_ok: boolean;
  both_ok: boolean;
  st_lumpsum: number;
  st_sip: number;
  core_lumpsum: number;
  core_sip: number;
}

export interface AutoSuggestResult {
  fv_full_lumpsum: number;
  fv_full_sip: number;
  w_min: number;
  w_max: number;
  valid_range_exists: boolean;
  w_sweet: number | null;
  sweet: SplitEvaluation | null;
  at_min: SplitEvaluation | null;
  at_max: SplitEvaluation | null;
  combined_shortfall?: number;
}

export interface InvestmentResult {
  split: SplitEvaluation;
  suggestion: AutoSuggestResult;
}

export interface InvestmentRequest {
  target: number;
  years: number;
  lumpsum: number;
  sip_monthly: number;
  rate_st: number;
  w_l: number;
}

// ---------------------------------------------------------------------------
// Settings Types
// ---------------------------------------------------------------------------
export interface AllocationBand {
  [assetClass: string]: number;
}

export interface SettingsData {
  version: number;
  short_term_default: string;
  asset_classes: string[];
  allocation_table: {
    [band: string]: AllocationBand;
  };
}

// ---------------------------------------------------------------------------
// Session Types
// ---------------------------------------------------------------------------
export interface FinalAllocationData {
  shortTermLumpsumAsset: string;
  shortTermSipAsset: string;
  coreAllocationBand: string;
  allocationUsed: AllocationBand;
}

export interface SessionData {
  onboarding: OnboardingData;
  risk_result: RiskResult;
  planner_result: InvestmentResult;
  final_allocation: FinalAllocationData;
}

// ---------------------------------------------------------------------------
// Wizard Steps
// ---------------------------------------------------------------------------
export type WizardStep =
  | "onboarding"
  | "quiz"
  | "risk-result"
  | "planner"
  | "split-results"
  | "final-allocation";