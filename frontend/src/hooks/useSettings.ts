import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../api/client";
import type { SettingsData } from "../types";

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function updateSettings(data: SettingsData): Promise<void> {
    const updated = await saveSettings(data);
    setSettings(updated);
  }

  function getAllocationForScore(score: number): Record<string, number> {
    if (!settings) return {};
    const bands = [
      { key: "0-30", min: 0, max: 30 },
      { key: "31-45", min: 31, max: 45 },
      { key: "46-55", min: 46, max: 55 },
      { key: "56-65", min: 56, max: 65 },
      { key: "66-75", min: 66, max: 75 },
      { key: "75-100", min: 75, max: 100 },
    ];
    const band = bands.find((b) => score >= b.min && score <= b.max);
    if (!band) return {};
    return settings.allocation_table[band.key] ?? {};
  }

  return { settings, loading, error, updateSettings, getAllocationForScore };
}