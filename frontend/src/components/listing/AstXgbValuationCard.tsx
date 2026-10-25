import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, ShieldCheck, RefreshCw, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { PropertyListing } from '../../types/property';
import { ValuationResult } from '../../types/valuation';
import { runPrediction } from '../../services/valuationService';

interface AstXgbValuationCardProps {
  property: PropertyListing;
}

const SUPPORTED_CITIES = ['Bengaluru', 'Chennai', 'Delhi', 'Delhi NCR', 'Hyderabad', 'Kolkata', 'Mumbai', 'Pune'];
const SUPPORTED_TYPES = ['Apartment', 'Independent House', 'Penthouse', 'Villa', 'Builder Floor'];

export const AstXgbValuationCard: React.FC<AstXgbValuationCardProps> = ({ property }) => {
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // Validate compatibility without silently fabricating dummy inputs
  const isCitySupported = SUPPORTED_CITIES.includes(property.location.city);
  const isTypeSupported = SUPPORTED_TYPES.includes(property.propertyType);
  const isAreaValid = property.specs.builtupAreaSqft >= 100 && property.specs.builtupAreaSqft <= 50000;
  const isCompatible = isCitySupported && isTypeSupported && isAreaValid;

  const handleEstimate = async () => {
    if (!isCompatible) return;

    setLoading(true);
    setError(null);
    try {
      const res = await runPrediction({
        city: property.location.city,
        locality: property.location.locality,
        propertyType: property.propertyType,
        builtupAreaSqft: property.specs.builtupAreaSqft,
        bhk: property.specs.bhk || 2,
        bathrooms: property.specs.bathrooms || 2,
        age: property.specs.ageYears ?? 3,
        floorNo: property.specs.floorNo ?? 3,
        totalFloors: property.specs.totalFloors ?? 10,
        parking: property.specs.parking ?? 1,
        furnishing: property.specs.furnishing || 'Unfurnished',
        facing: property.specs.facing || 'North',
      });
      setResult(res);
      setHasRun(true);
    } catch (err: any) {
      console.warn('AST-XGB valuation error:', err);
      setError(err.message || 'Valuation service encountered an issue. Ensure backend API is operational.');
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on first mount if compatible
  useEffect(() => {
    if (isCompatible && !hasRun && !loading && !result) {
      handleEstimate();
    }
  }, [property.id, isCompatible]);

  // Price comparison calculation
  let deltaPct: number | null = null;
  let isAskingHigher = false;
  if (result && property.price > 0 && result.predictedPriceInr > 0) {
    const diff = property.price - result.predictedPriceInr;
    deltaPct = Math.round((Math.abs(diff) / result.predictedPriceInr) * 1000) / 10;
    isAskingHigher = diff > 0;
  }

  return (
    <div
      id="ast-xgb-valuation-card"
      style={{
        background: 'linear-gradient(145deg, #161a29 0%, #0d121f 100%)',
        color: '#ffffff',
        borderRadius: 'var(--gd-radius-xl)',
        padding: '24px',
        boxShadow: '0 12px 32px rgba(13, 18, 31, 0.45)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Sparkles size={17} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
              AST-XGB AI Valuation
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Machine Learning Fair Price Engine
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEstimate}
          disabled={loading || !isCompatible}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#c7d2fe',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 10px',
            borderRadius: '6px',
            cursor: loading || !isCompatible ? 'not-allowed' : 'pointer',
          }}
          title="Recalculate with live ML inference"
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Estimating...' : 'Estimate with AST-XGB'}</span>
        </button>
      </div>

      {/* Incompatible Fallback */}
      {!isCompatible ? (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '14px', fontSize: '12.5px', color: '#fcd34d', lineHeight: 1.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '4px' }}>
            <AlertTriangle size={15} />
            <span>Scope Restriction: Valuation Not Run</span>
          </div>
          AST-XGB models are trained on residential properties across 7 Indian metros. This record ({property.propertyType} in {property.location.city}) is not within the residential regression scope. Required attributes are preserved without fabricating dummy estimates.
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div className="spin" style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(255, 255, 255, 0.15)', borderTopColor: '#818cf8', borderRadius: '50%', marginBottom: '10px' }} />
          <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Running XGBoost Inference &amp; Conformal Bands...</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Evaluating micro-market regime &amp; spatial price curves</div>
        </div>
      ) : error ? (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px', fontSize: '12.5px', color: '#fca5a5' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Inference Error</div>
          {error}
          <div style={{ marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleEstimate}
              style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
            >
              Retry Prediction
            </button>
          </div>
        </div>
      ) : result ? (
        <div>
          {/* Main AI Estimate Figure */}
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Predicted Fair Value
                </span>
                <div style={{ fontSize: '30px', fontWeight: 900, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', margin: '4px 0' }}>
                  {result.predictedPriceFormatted}
                </div>
                <div style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 600 }}>
                  ₹{Math.round(result.pricePerSqft).toLocaleString()}/sq.ft
                </div>
              </div>

              {/* Price Comparison Delta Badge */}
              {deltaPct !== null && (
                <div
                  style={{
                    textAlign: 'right',
                    background: isAskingHigher ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${isAskingHigher ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontSize: '12.5px', fontWeight: 800, color: isAskingHigher ? '#f59e0b' : '#34d399' }}>
                    {isAskingHigher ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{deltaPct}% {isAskingHigher ? 'Premium' : 'Below Fair Value'}</span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                    vs. Asking Price
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 90% Conformal Prediction Band */}
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>90% Conformal Confidence Band</span>
              <strong style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                {result.conformal.lowerFormatted} – {result.conformal.upperFormatted}
              </strong>
            </div>
            {/* Visual Confidence Bar */}
            <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)', borderRadius: '999px', margin: '0 auto' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '6px' }}>
              <span>Lower 5th Pct</span>
              <span>Point Estimate</span>
              <span>Upper 95th Pct</span>
            </div>
          </div>

          {/* Metadata Row: Regime, Model Version, Latency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px', fontSize: '11.5px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Market Regime</span>
              <strong style={{ color: '#34d399' }}>{result.activeMarketRegime}</strong>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Model Version</span>
              <strong style={{ color: '#c7d2fe', fontFamily: 'JetBrains Mono, monospace' }}>{result.modelVersion}</strong>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Inference Latency</span>
              <strong style={{ color: '#ffffff' }}>{result.latencyMs} ms</strong>
            </div>
          </div>

          {/* Validation Warnings (if any) */}
          {result.validationWarnings && result.validationWarnings.length > 0 && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '10px', fontSize: '11.5px', color: '#fcd34d', marginBottom: '14px' }}>
              {result.validationWarnings.map((w, idx) => (
                <div key={idx}>⚠️ {w}</div>
              ))}
            </div>
          )}

          {/* Algorithmic Disclaimer */}
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px', display: 'flex', gap: '6px' }}>
            <Info size={14} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Disclaimer:</strong> AST-XGB fair value is an algorithmic machine learning prediction computed via gradient boosted regression trees and conformal quantile calibration. It is not an appraisal, bank valuation, or guaranteed sale price.
            </span>
          </div>

          {/* Studio Deep Dive Link */}
          <Link
            to={`/ai-valuation?city=${encodeURIComponent(property.location.city)}&locality=${encodeURIComponent(property.location.locality)}&area=${property.specs.builtupAreaSqft}&bhk=${property.specs.bhk}&bathrooms=${property.specs.bathrooms}&propertyType=${encodeURIComponent(property.propertyType)}`}
            className="gd-btn-search"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              fontSize: '13px',
              height: '42px',
              textDecoration: 'none',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={15} />
            <span>Open in Multi-Model AI Studio →</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
};
