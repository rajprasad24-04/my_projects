import type {
  RiskResult,
  InvestmentRequest,
  InvestmentResult,
  SettingsData,
  SessionData,
} from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  let message = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    if (typeof body.detail === "string") message = body.detail;
    else if (Array.isArray(body.detail)) message = body.detail.join("; ");
  } catch {
    // ignore
  }
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------
export async function submitAssessment(payload: {
  user_name: string;
  time_horizon: number;
  investment_amount: number;
  answers: Record<string, number>;
}): Promise<RiskResult> {
  const res = await fetch(`${BASE}/api/assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<RiskResult>(res);
}

// ---------------------------------------------------------------------------
// Investment
// ---------------------------------------------------------------------------
export async function calculateInvestment(
  payload: InvestmentRequest
): Promise<InvestmentResult> {
  const res = await fetch(`${BASE}/api/investment/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<InvestmentResult>(res);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<SettingsData> {
  const res = await fetch(`${BASE}/api/settings`);
  return handleResponse<SettingsData>(res);
}

export async function saveSettings(data: SettingsData): Promise<SettingsData> {
  const res = await fetch(`${BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<SettingsData>(res);
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export async function saveSession(payload: {
  user_name: string;
  time_horizon: number;
  investment_amount: number;
  answers: Record<string, number>;
  score: number;
  category: string;
  level: string;
  breakdown: Array<{
    question: string;
    value: number;
    coefficient: number;
    points: number;
  }>;
}): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ id: string }>(res);
}