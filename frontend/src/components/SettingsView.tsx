import React, { useState } from 'react';
import { Activity, Moon, Sun, ShieldCheck, RefreshCw, CheckCircle, Server, Database } from 'lucide-react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ theme, setTheme }) => {
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000/api/v1');
  const [confidence, setConfidence] = useState<string>('90%');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/v1/health');
      const data = await res.json();
      setTestResult(`DIAGNOSTIC PASSED: Backend is HEALTHY. Model version: ${data.model_version}, Conformal q90: ₹ ${(data.conformal_q90_inr / 100000).toFixed(2)} L.`);
    } catch (e: any) {
      setTestResult('DIAGNOSTIC WARNING: Unable to connect to backend on http://localhost:8000.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Activity size={22} color="var(--primary-indigo)" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              System Preferences & Diagnostics
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Configure model parameters, theme aesthetics, API endpoints, and system diagnostics.
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="dashboard-sections-grid">
        {/* Settings Form */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <Server size={18} color="var(--primary-indigo)" />
              <h3>Application Settings</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {/* Setting 1: Theme Mode */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
                Interface Theme Mode
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setTheme('light')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: theme === 'light' ? '2px solid var(--primary-indigo)' : '1px solid var(--border-color)',
                    background: theme === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Sun size={18} /> Light Mode
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: theme === 'dark' ? '2px solid var(--primary-indigo)' : '1px solid var(--border-color)',
                    background: theme === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Moon size={18} /> Dark Mode
                </button>
              </div>
            </div>

            {/* Setting 2: API Base URL */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
                FastAPI Backend Endpoint URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
              />
            </div>

            {/* Setting 3: Conformal Confidence Interval */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
                Split Conformal Prediction Interval Confidence Level
              </label>
              <select
                value={confidence}
                onChange={e => setConfidence(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
              >
                <option value="80%">80% Confidence Bound (Narrower Margin)</option>
                <option value="90%">90% Confidence Bound (Recommended - Phase 19 Calibration)</option>
                <option value="95%">95% Confidence Bound (Conservative Margin)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Diagnostics & Model Metadata */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <Database size={18} color="var(--success-green)" />
              <h3>System Diagnostics & Model Freeze Status</h3>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.8' }}>
              <div>• Model Pipeline: <strong>Phase 15 Optuna XGBoost v4</strong></div>
              <div>• Feature Matrix: <strong>63 Features (0 Target Leakage)</strong></div>
              <div>• Split Scheme: <strong>Chronological Temporal (70/15/15)</strong></div>
              <div>• Conformal Quantile: <strong>q0.90 = ₹ 58.76 Lakhs</strong></div>
            </div>

            <button className="btn-primary-sm" onClick={runDiagnostics} disabled={testing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> {testing ? 'Running Health Self-Test...' : 'Run Diagnostics Self-Test'}
            </button>

            {testResult && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '13px', background: testResult.includes('PASSED') ? 'var(--bg-green-light)' : 'var(--bg-red-light)', color: testResult.includes('PASSED') ? 'var(--success-green)' : 'var(--danger-red)', border: `1px solid ${testResult.includes('PASSED') ? 'var(--success-green)' : 'var(--danger-red)'}` }}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
