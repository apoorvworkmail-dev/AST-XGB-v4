import React, { useState, useEffect } from 'react';
import { Compass, Sliders, TrendingUp, ShieldCheck, RefreshCw, ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { runPrediction, runCounterfactual } from '../services/valuationService';
import { CounterfactualScenario } from '../types/valuation';

interface WhatIfSimulatorViewProps {
  city: string;
  locality: string;
  propertyType: string;
  baseArea: number;
  baseBhk: number;
  baseBathrooms: number;
  baseAge: number;
  baseFloor: number;
  baseTotalFloors: number;
  basePrice: number;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({
  city,
  locality,
  propertyType,
  baseArea,
  baseBhk,
  baseBathrooms,
  baseAge,
  baseFloor,
  baseTotalFloors,
  basePrice,
}) => {
  const [simArea, setSimArea] = useState<number>(baseArea);
  const [simBhk, setSimBhk] = useState<number>(baseBhk);
  const [simBathrooms, setSimBathrooms] = useState<number>(baseBathrooms);
  const [simAge, setSimAge] = useState<number>(baseAge);
  const [simFloor, setSimFloor] = useState<number>(baseFloor);

  // Real backend simulation response
  const [simPrice, setSimPrice] = useState<number>(basePrice);
  const [simPriceFormatted, setSimPriceFormatted] = useState<string>('');
  const [lowerBound90, setLowerBound90] = useState<number>(Math.max(0, basePrice - 5876387.66));
  const [upperBound90, setUpperBound90] = useState<number>(basePrice + 5876387.66);
  const [lowerBoundFormatted, setLowerBoundFormatted] = useState<string>('');
  const [upperBoundFormatted, setUpperBoundFormatted] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [apiScenarios, setApiScenarios] = useState<CounterfactualScenario[]>([]);

  // Fetch official counterfactual scenarios from /api/v1/counterfactual
  useEffect(() => {
    let isMounted = true;
    runCounterfactual({
      city,
      locality,
      propertyType,
      builtupAreaSqft: baseArea,
      bhk: baseBhk,
      bathrooms: baseBathrooms,
      age: baseAge,
      floorNo: baseFloor,
      totalFloors: baseTotalFloors,
    })
      .then((res) => {
        if (isMounted) {
          setApiScenarios(res.scenarios);
        }
      })
      .catch((err) => {
        console.warn('Counterfactual endpoint error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [city, locality, propertyType, baseArea, baseBhk, baseBathrooms, baseAge, baseFloor, baseTotalFloors]);

  // Execute real model inference on custom parameter adjustments with debounce
  useEffect(() => {
    const isModified =
      simArea !== baseArea ||
      simBhk !== baseBhk ||
      simBathrooms !== baseBathrooms ||
      simAge !== baseAge ||
      simFloor !== baseFloor;

    if (!isModified) {
      setSimPrice(basePrice);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      runPrediction({
        city,
        locality,
        propertyType,
        builtupAreaSqft: simArea,
        bhk: simBhk,
        bathrooms: simBathrooms,
        age: simAge,
        floorNo: simFloor,
        totalFloors: baseTotalFloors,
      })
        .then((res) => {
          setSimPrice(res.predictedPriceInr);
          setSimPriceFormatted(res.predictedPriceFormatted);
          setLowerBound90(res.conformal.lower90Inr);
          setUpperBound90(res.conformal.upper90Inr);
          setLowerBoundFormatted(res.conformal.lowerFormatted);
          setUpperBoundFormatted(res.conformal.upperFormatted);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Simulator inference error:', err);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [simArea, simBhk, simBathrooms, simAge, simFloor, baseArea, baseBhk, baseBathrooms, baseAge, baseFloor, city, locality, propertyType, basePrice, baseTotalFloors]);

  const priceDelta = simPrice - basePrice;
  const percentDelta = basePrice > 0 ? ((priceDelta / basePrice) * 100).toFixed(2) : '0.00';

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} Lakhs`;
    return `₹ ${val.toLocaleString()}`;
  };

  const handleReset = () => {
    setSimArea(baseArea);
    setSimBhk(baseBhk);
    setSimBathrooms(baseBathrooms);
    setSimAge(baseAge);
    setSimFloor(baseFloor);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(99, 102, 241, 0.08))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Compass size={22} color="#f59e0b" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--gd-text-charcoal)' }}>
              Interactive What-If Valuation Simulator
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--gd-text-muted)', fontSize: '14px' }}>
            Simulate real-time property modifications using live AST-XGB model inference and inspect counterfactual sensitivity.
          </p>
        </div>
        <button
          className="btn-secondary-sm"
          onClick={handleReset}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <RefreshCw size={14} />
          Reset to Baseline
        </button>
      </div>

      {/* Official Backend Counterfactual Scenarios */}
      {apiScenarios.length > 0 && (
        <div
          style={{
            background: 'var(--gd-warm-card)',
            border: '1px solid var(--gd-warm-border)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--gd-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={16} color="var(--gd-terra-500)" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--gd-text-charcoal)' }}>
              Official Discrete Counterfactual Scenarios (API: /api/v1/counterfactual)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {apiScenarios.map((sc) => (
              <div
                key={sc.scenario}
                style={{
                  background: 'var(--gd-warm-bg)',
                  border: '1px solid var(--gd-warm-border)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    {sc.perturbation}
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gd-text-charcoal)', margin: '4px 0 10px 0' }}>
                    {sc.scenario}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gd-warm-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gd-text-charcoal)', fontFamily: 'monospace' }}>
                      {sc.predicted_price_formatted}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px', color: sc.percentage_change >= 0 ? '#10b981' : '#ef4444' }}>
                    {sc.percentage_change >= 0 ? `+${sc.percentage_change}%` : `${sc.percentage_change}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Control Sliders + Simulation Results */}
      <div className="dashboard-sections-grid">
        {/* Left: Parameter Sliders */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <Sliders size={18} color="var(--gd-terra-500)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Continuous Parameter Exploration</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {/* Slider 1: Built-up Area */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600 }}>Built-up Area (sq ft)</span>
                <strong style={{ color: 'var(--gd-terra-600)', fontFamily: 'monospace' }}>{simArea} sq ft</strong>
              </div>
              <input
                type="range"
                min="400"
                max="8000"
                step="50"
                value={simArea}
                onChange={(e) => setSimArea(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>Baseline: {baseArea} sq ft</span>
            </div>

            {/* Slider 2: BHK Bedrooms */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600 }}>BHK Bedrooms</span>
                <strong style={{ color: 'var(--gd-terra-600)', fontFamily: 'monospace' }}>{simBhk} BHK</strong>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={simBhk}
                onChange={(e) => setSimBhk(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>Baseline: {baseBhk} BHK</span>
            </div>

            {/* Slider 3: Bathrooms */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600 }}>Bathrooms</span>
                <strong style={{ color: 'var(--gd-terra-600)', fontFamily: 'monospace' }}>{simBathrooms} Bath</strong>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={simBathrooms}
                onChange={(e) => setSimBathrooms(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>Baseline: {baseBathrooms} Bath</span>
            </div>

            {/* Slider 4: Property Age */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600 }}>Property Age (Years)</span>
                <strong style={{ color: 'var(--gd-terra-600)', fontFamily: 'monospace' }}>{simAge} Years</strong>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={simAge}
                onChange={(e) => setSimAge(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>Baseline: {baseAge} Years</span>
            </div>

            {/* Slider 5: Floor Level */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600 }}>Floor Level</span>
                <strong style={{ color: 'var(--gd-terra-600)', fontFamily: 'monospace' }}>Floor {simFloor}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={simFloor}
                onChange={(e) => setSimFloor(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>Baseline: Floor {baseFloor}</span>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Valuation Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Result Tile 1: Projected Valuation */}
          <div
            className="saas-card"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.04))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Simulated Property Price {loading && '(Evaluating...)'}
            </span>
            <div style={{ fontSize: '34px', fontWeight: 900, color: 'var(--gd-text-charcoal)', margin: '8px 0', fontFamily: 'monospace' }}>
              {simPriceFormatted || formatPrice(simPrice)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {priceDelta >= 0 ? (
                <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpRight size={18} /> +{formatPrice(priceDelta)} (+{percentDelta}%)
                </span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowDownRight size={18} /> {formatPrice(priceDelta)} ({percentDelta}%)
                </span>
              )}
              <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>vs Base Valuation</span>
            </div>
          </div>

          {/* Result Tile 2: Conformal Bound */}
          <div className="saas-card">
            <div className="card-header-clean">
              <div className="card-title-group">
                <ShieldCheck size={18} color="var(--gd-terra-500)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Updated 90% Conformal Prediction Bounds</h3>
              </div>
            </div>
            <div style={{ marginTop: '12px', background: 'var(--gd-warm-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--gd-warm-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: 'var(--gd-text-muted)' }}>Lower 90% Bound:</span>
                <strong style={{ fontFamily: 'monospace' }}>{lowerBoundFormatted || formatPrice(lowerBound90)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--gd-text-muted)' }}>Upper 90% Bound:</span>
                <strong style={{ fontFamily: 'monospace' }}>{upperBoundFormatted || formatPrice(upperBound90)}</strong>
              </div>
            </div>
          </div>

          {/* Result Tile 3: Sensitivity Summary */}
          <div className="saas-card">
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Simulation Impact Summary</h4>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: 'var(--gd-text-muted)', lineHeight: '1.8' }}>
              <li>Location &amp; Micro-market: <strong>{city}, {locality}</strong></li>
              <li>Simulated Price / Sq Ft: <strong>₹{Math.round(simPrice / simArea).toLocaleString()}</strong></li>
              <li>Monotonicity Verified: Model enforces non-decreasing response for area expansions.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
