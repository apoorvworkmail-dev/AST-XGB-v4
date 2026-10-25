import React from 'react';
import { X, Printer, Download, ShieldCheck, Sparkles, Building, MapPin, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { ValuationInput, ValuationResult, SHAPDriver, CounterfactualScenario } from '../types/valuation';

interface ValuationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  input: ValuationInput;
  result: ValuationResult | null;
  shapPositives?: SHAPDriver[];
  shapNegatives?: SHAPDriver[];
  counterfactuals?: CounterfactualScenario[];
}

export const ValuationReportModal: React.FC<ValuationReportModalProps> = ({
  isOpen,
  onClose,
  input,
  result,
  shapPositives = [],
  shapNegatives = [],
  counterfactuals = [],
}) => {
  if (!isOpen || !result) return null;

  const certificateId = `AST-VAL-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 8, 18, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflowY: 'auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#4f46e5', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
              AST-XGB
            </span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              AI Valuation Certificate &amp; Model Audit Report
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer',
              }}
              aria-label="Close report"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4f46e5', fontWeight: 800 }}>
            Official Automated Valuation Model (AVM) Audit
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '4px 0 6px 0' }}>
            Real Estate Valuation Certificate
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
            Certificate ID: <strong>{certificateId}</strong> • Generated: {timestamp} IST
          </div>
        </div>

        {/* Primary Valuation Summary Tile */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', color: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                AST-XGB Fair Value Point Estimate
              </span>
              <div style={{ fontSize: '38px', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', margin: '4px 0' }}>
                {result.predictedPriceFormatted}
              </div>
              <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 600 }}>
                ₹{Math.round(result.pricePerSqft).toLocaleString()} per sq.ft • Latency: {result.latencyMs} ms
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                90% Conformal Prediction Interval
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', marginBottom: '4px' }}>
                {result.conformal.lowerFormatted} – {result.conformal.upperFormatted}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Calibrated finite-sample uncertainty at α = 0.10 target coverage
              </div>
            </div>
          </div>
        </div>

        {/* Input Assumptions & Specifications Table */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            1. Property Input Assumptions
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '13px' }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Location</span>
              <strong>{input.locality}, {input.city}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Property Type</span>
              <strong>{input.propertyType}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Super Area</span>
              <strong>{input.builtupAreaSqft} sq.ft</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Configuration</span>
              <strong>{input.bhk} BHK • {input.bathrooms} Baths</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Property Age</span>
              <strong>{input.age ?? 3} Years</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Floor Level</span>
              <strong>Floor {input.floorNo ?? 3} of {input.totalFloors ?? 10}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Furnishing / Facing</span>
              <strong>{input.furnishing ?? 'Unfurnished'} • {input.facing ?? 'North'}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Model Version</span>
              <strong>{result.modelVersion}</strong>
            </div>
          </div>
        </div>

        {/* SHAP Attributions & Counterfactuals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Top SHAP Drivers */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              2. TreeSHAP Valuation Drivers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              {shapPositives.slice(0, 3).map((d) => (
                <div key={d.feature} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  <span><strong>{d.feature.replace(/_/g, ' ')}</strong> ({d.feature_value})</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>+₹ {(d.shap_value / 100000).toFixed(2)} L</span>
                </div>
              ))}
              {shapNegatives.slice(0, 2).map((d) => (
                <div key={d.feature} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  <span><strong>{d.feature.replace(/_/g, ' ')}</strong> ({d.feature_value})</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>-₹ {(d.abs_shap / 100000).toFixed(2)} L</span>
                </div>
              ))}
            </div>
          </div>

          {/* Counterfactual Sensitivity Scenarios */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              3. Counterfactual Sensitivity Scenarios
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              {counterfactuals.length > 0 ? (
                counterfactuals.map((s) => (
                  <div key={s.scenario} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <strong>{s.scenario}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Projected: {s.predicted_price_formatted}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: s.percentage_change >= 0 ? '#059669' : '#dc2626' }}>
                      {s.percentage_change >= 0 ? `+${s.percentage_change}%` : `${s.percentage_change}%`}
                      <div style={{ fontSize: '11px', color: '#64748b' }}>+₹ {(s.delta_price_inr / 100000).toFixed(2)} L</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Scenario analysis computed via AST-XGB sensitivity engine.</div>
              )}
            </div>
          </div>
        </div>

        {/* Verified Artifact Metrics Audit */}
        <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '16px', marginBottom: '20px', fontSize: '12px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#4f46e5" />
            <span>Verified Benchmark Training &amp; Evaluation Provenance</span>
          </div>
          <div>
            Model Architecture: <strong>Optuna-Tuned XGBoost Regressor (Phase 15 v4)</strong> • Temporal Chronological Split (70/15/15) • Leakage Controls: rental yield &amp; future target statistics strictly isolated.
          </div>
          <div style={{ marginTop: '4px', fontWeight: 600 }}>
            Documented Test Artifact Metrics: R² = 0.4099 | MAE = ₹ 42.85 Lakhs | MAPE = 39.50% | Conformal q90 Margin = ±₹ 58.76 Lakhs.
          </div>
        </div>

        {/* Regulatory & Educational Disclaimer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
          <strong>Educational &amp; Research Disclaimer:</strong> This automated valuation report is generated by the AST-XGB machine-learning framework for research and indicative comparison purposes only. Point predictions, conformal confidence bands, and SHAP attributions represent statistical estimates calibrated on historical transaction data and do not constitute an official banking appraisal, government stamp-duty circle rate, or legally binding sale guarantee.
        </div>
      </div>
    </div>
  );
};
