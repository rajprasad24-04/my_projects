import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSettings } from "../hooks/useSettings";
import type { SettingsData } from "../types";

const ADMIN_PASSWORD = "wcg2026"; // Change this to your preferred password

// ---------------------------------------------------------------------------
// Password lock gate — rendered before the main settings UI
// ---------------------------------------------------------------------------
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setPwError(false);
      onUnlock();
    } else {
      setPwError(true);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <form onSubmit={handleUnlock} style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 40,
        width: 360,
        boxShadow: "0 4px 24px rgba(20,83,195,0.08)",
        textAlign: "center",
      }}>
        <img
          src="/wcg-logo.png"
          alt="WCG"
          style={{ height: 40, marginBottom: 24 }}
        />
        <h2 style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: 20, fontWeight: 700,
          color: "var(--text)", marginBottom: 8,
        }}>
          Admin Access
        </h2>
        <p style={{
          fontSize: 13, color: "var(--muted)", marginBottom: 24,
        }}>
          Enter your admin password to continue.
        </p>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%", padding: "12px 14px",
            border: `1px solid ${pwError ? "var(--error)" : "var(--border)"}`,
            borderRadius: 8, fontSize: 14,
            color: "var(--text)", marginBottom: 8,
            outline: "none", background: "var(--bg)",
          }}
        />
        {pwError && (
          <p style={{
            fontSize: 12, color: "var(--error)",
            marginBottom: 12, textAlign: "left",
          }}>
            Incorrect password. Please try again.
          </p>
        )}

        <button type="submit" style={{
          width: "100%", padding: "12px 0",
          background: "var(--blue)", color: "#FFFFFF",
          border: "none", borderRadius: 8,
          fontSize: 14, fontWeight: 700, marginTop: 8,
          fontFamily: "Montserrat, sans-serif",
          cursor: "pointer",
        }}>
          Unlock Settings
        </button>
      </form>
    </div>
  );
}

export function SettingsScreen() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <SettingsContent />;
}

function SettingsContent() {
  const navigate = useNavigate();
  const { settings, loading, error, updateSettings } = useSettings();

  const [localSettings, setLocalSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newAssetName, setNewAssetName] = useState("");

  // Load settings into local state for editing
  useEffect(() => {
    if (settings) setLocalSettings(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  if (loading) return <div style={s.center}>Loading settings...</div>;
  if (error) return <div style={s.center}>Error: {error}</div>;
  if (!localSettings) return null;

  const bands = Object.keys(localSettings.allocation_table);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  function handleAllocChange(band: string, asset: string, value: string) {
    const num = parseInt(value) || 0;
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        allocation_table: {
          ...prev.allocation_table,
          [band]: { ...prev.allocation_table[band], [asset]: num },
        },
      };
    });
  }

  function handleCoeffChange(question: string, value: string) {
    const num = parseFloat(value) || 0;
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        scoring: {
          ...prev.scoring,
          coefficients: { ...prev.scoring.coefficients, [question]: num },
        },
      };
    });
  }

  function handleInterceptChange(value: string) {
    const num = parseFloat(value) || 0;
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, scoring: { ...prev.scoring, intercept: num } };
    });
  }

  function handleAddAssetClass() {
    const name = newAssetName.trim();
    if (!name) return;
    if (localSettings.asset_classes.includes(name)) return;

    setLocalSettings((prev) => {
      if (!prev) return prev;
      const newBands: typeof prev.allocation_table = {};
      for (const band of Object.keys(prev.allocation_table)) {
        newBands[band] = { ...prev.allocation_table[band], [name]: 0 };
      }
      return {
        ...prev,
        asset_classes: [...prev.asset_classes, name],
        allocation_table: newBands,
      };
    });
    setNewAssetName("");
  }

  function handleRemoveAssetClass(asset: string) {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const newBands: typeof prev.allocation_table = {};
      for (const band of Object.keys(prev.allocation_table)) {
        const { [asset]: _, ...rest } = prev.allocation_table[band];
        newBands[band] = rest;
      }
      return {
        ...prev,
        asset_classes: prev.asset_classes.filter((a) => a !== asset),
        allocation_table: newBands,
        short_term_default:
          prev.short_term_default === asset
            ? prev.asset_classes.filter((a) => a !== asset)[0] ?? ""
            : prev.short_term_default,
      };
    });
  }

  // Validate each band sums to 100
  function getBandSum(band: string): number {
    return Object.values(localSettings.allocation_table[band]).reduce(
      (a, b) => a + b, 0
    );
  }

  async function handleSave() {
    // Validate bands
    const errors: string[] = [];
    for (const band of bands) {
      const sum = getBandSum(band);
      if (sum !== 100) errors.push(`Band ${band} sums to ${sum}% (must be 100%)`);
    }
    if (errors.length > 0) {
      setSaveError(errors.join("\n"));
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await updateSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (settings) setLocalSettings(JSON.parse(JSON.stringify(settings)));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={s.page}
    >
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          ← Back
        </button>
        <h1 style={s.heading}>Settings</h1>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Table 1 — Scoring Coefficients                                      */}
      {/* ------------------------------------------------------------------ */}
      <div style={s.card}>
        <p style={s.cardTitle}>QUIZ SCORING COEFFICIENTS</p>
        <p style={s.cardSub}>
          These weights determine the risk score. Changes apply to all future assessments.
        </p>

        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Question</th>
                <th style={{ ...s.th, textAlign: "right" }}>Coefficient</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={s.td}>Intercept</td>
                <td style={{ ...s.td, textAlign: "right" }}>
                  <input
                    type="number"
                    value={localSettings.scoring.intercept}
                    onChange={(e) => handleInterceptChange(e.target.value)}
                    step="0.0001"
                    style={s.numInput}
                  />
                </td>
              </tr>
              {Object.entries(localSettings.scoring.coefficients).map(
                ([q, coeff]) => (
                  <tr key={q}>
                    <td style={s.td}>{q}</td>
                    <td style={{ ...s.td, textAlign: "right" }}>
                      <input
                        type="number"
                        value={coeff}
                        onChange={(e) => handleCoeffChange(q, e.target.value)}
                        step="0.0001"
                        style={s.numInput}
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Table 2 — Asset Allocation                                          */}
      {/* ------------------------------------------------------------------ */}
      <div style={s.card}>
        <p style={s.cardTitle}>ASSET ALLOCATION TABLE</p>
        <p style={s.cardSub}>
          Each column must sum to exactly 100%. Used for Core Portfolio allocation.
        </p>

        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Asset Class</th>
                {bands.map((band) => {
                  const sum = getBandSum(band);
                  return (
                    <th key={band} style={{
                      ...s.th, textAlign: "center",
                    }}>
                      <div>{band}</div>
                      <div style={{
                        fontSize: 10,
                        color: sum === 100 ? "var(--green)" : "var(--red)",
                        fontWeight: 700, marginTop: 2,
                      }}>
                        {sum}%
                      </div>
                    </th>
                  );
                })}
                <th style={s.th} />
              </tr>
            </thead>
            <tbody>
              {localSettings.asset_classes.map((asset) => (
                <tr key={asset}>
                  <td style={s.td}>{asset}</td>
                  {bands.map((band) => (
                    <td key={band} style={{ ...s.td, textAlign: "center" }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={localSettings.allocation_table[band][asset] ?? 0}
                        onChange={(e) =>
                          handleAllocChange(band, asset, e.target.value)
                        }
                        style={s.numInput}
                      />
                    </td>
                  ))}
                  <td style={s.td}>
                    <button
                      onClick={() => handleRemoveAssetClass(asset)}
                      style={s.removeBtn}
                      title="Remove asset class"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add new asset class */}
        <div style={s.addRow}>
          <input
            type="text"
            placeholder="New asset class name..."
            value={newAssetName}
            onChange={(e) => setNewAssetName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAssetClass()}
            style={s.addInput}
          />
          <button onClick={handleAddAssetClass} style={s.addBtn}>
            + Add Asset Class
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Short-Term Default                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div style={s.card}>
        <p style={s.cardTitle}>SHORT-TERM DEFAULT ASSET CLASS</p>
        <p style={s.cardSub}>
          Default asset class for short-term bucket in the final allocation step.
        </p>
        <select
          value={localSettings.short_term_default}
          onChange={(e) =>
            setLocalSettings((prev) =>
              prev ? { ...prev, short_term_default: e.target.value } : prev
            )
          }
          style={s.select}
        >
          {localSettings.asset_classes.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Errors */}
      {saveError && (
        <div style={s.errorBox}>
          {saveError.split("\n").map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Success */}
      {saveSuccess && (
        <div style={s.successBox}>✔ Settings saved successfully!</div>
      )}

      {/* Action buttons */}
      <div style={s.actions}>
        <button onClick={handleReset} style={s.btnReset}>
          Reset to Last Saved
        </button>
        <button onClick={handleSave} disabled={saving} style={s.btnSave}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </motion.div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" },
  center: { textAlign: "center", padding: 60, color: "var(--muted)" },
  header: {
    display: "flex", alignItems: "center", gap: 20, marginBottom: 40,
  },
  backBtn: {
    padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: "transparent", color: "var(--muted)",
    border: "1px solid var(--border)", cursor: "pointer",
    flexShrink: 0,
  },
  heading: { fontSize: 28, fontWeight: 700, color: "var(--text)" },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 28, marginBottom: 24,
  },
  cardTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "var(--muted)", marginBottom: 6,
  },
  cardSub: { fontSize: 13, color: "var(--muted)", marginBottom: 20 },
  tableWrap: {
    overflowX: "auto", borderRadius: 10,
    border: "1px solid var(--border)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "10px 14px", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--muted)", background: "var(--bg)",
    borderBottom: "1px solid var(--border)", textAlign: "left",
  },
  td: {
    padding: "8px 14px", color: "var(--text)",
    borderBottom: "1px solid var(--border)",
  },
  numInput: {
    width: 80, padding: "6px 8px",
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 6, color: "var(--text)", fontSize: 13,
    textAlign: "right",
  },
  removeBtn: {
    padding: "4px 8px", borderRadius: 6, fontSize: 12,
    background: "rgba(248,113,113,0.1)", color: "var(--red)",
    border: "1px solid rgba(248,113,113,0.2)", cursor: "pointer",
  },
  addRow: {
    display: "flex", gap: 12, marginTop: 16, alignItems: "center",
  },
  addInput: {
    flex: 1, padding: "10px 14px",
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text)", fontSize: 14,
  },
  addBtn: {
    padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: "rgba(91,141,238,0.1)", color: "var(--blue)",
    border: "1px solid rgba(91,141,238,0.2)", cursor: "pointer",
    flexShrink: 0,
  },
  select: {
    padding: "10px 14px", background: "var(--bg)",
    border: "1px solid var(--border)", borderRadius: 8,
    color: "var(--text)", fontSize: 14, cursor: "pointer", minWidth: 200,
  },
  errorBox: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8, padding: "14px 18px",
    color: "var(--red)", fontSize: 13, marginBottom: 16, lineHeight: 1.8,
  },
  successBox: {
    background: "rgba(52,211,153,0.08)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: 8, padding: "14px 18px",
    color: "var(--green)", fontSize: 13, marginBottom: 16,
  },
  actions: {
    display: "flex", justifyContent: "flex-end", gap: 12,
  },
  btnReset: {
    padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: "transparent", color: "var(--muted)",
    border: "1px solid var(--border)", cursor: "pointer",
  },
  btnSave: {
    padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    background: "var(--accent)", color: "#0e0f11",
    border: "none", cursor: "pointer",
  },
};