import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Sliders,
  Layers,
  Activity,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
  Printer,
  Download,
  AlertCircle,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { CITY_LOCALITIES } from '../data/cityLocalities';
import { ModelSelectionPanel } from '../components/ModelSelectionPanel';
import { MultiModelComparisonView, MultiModelResults } from '../components/MultiModelComparisonView';
import { MarketInsightsView } from '../components/MarketInsightsView';
import { WhatIfSimulatorView } from '../components/WhatIfSimulatorView';
import { PropertyAnalysisView } from '../components/PropertyAnalysisView';
import { ValuationReportModal } from '../components/ValuationReportModal';
import {
  runPrediction,
  runExplain,
  runCounterfactual,
  getBackendHealth,
} from '../services/valuationService';
import {
  ValuationInput,
  ValuationResult,
  SHAPDriver,
  CounterfactualScenario,
} from '../types/valuation';

export const AiValuationStudioPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Tab inside AI Studio
  const [activeTab, setActiveTab] = useState<'valuation' | 'shap' | 'comparison' | 'simulator' | 'market'>('valuation');

  // Input State initialized from URL query parameters if provided
  const [city, setCity] = useState<string>(searchParams.get('city') || 'Bengaluru');
  const [locality, setLocality] = useState<string>(searchParams.get('locality') || 'Whitefield');
  const [propertyType, setPropertyType] = useState<string>(searchParams.get('propertyType') || 'Apartment');
  const [area, setArea] = useState<number>(searchParams.get('area') ? Number(searchParams.get('area')) : 1450);
  const [bhk, setBhk] = useState<number>(searchParams.get('bhk') ? Number(searchParams.get('bhk')) : 2);
  const [bathrooms, setBathrooms] = useState<number>(searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : 2);
  const [age, setAge] = useState<number>(3);
  const [floor, setFloor] = useState<number>(3);
  const [totalFloors, setTotalFloors] = useState<number>(10);
  const [parking, setParking] = useState<number>(1);
  const [furnishing, setFurnishing] = useState<string>('Unfurnished');
  const [facing, setFacing] = useState<string>('North');

  // Model Selection
  const [selectedModels, setSelectedModels] = useState<string[]>(['xgboost']);
  const [ensembleMethod, setEnsembleMethod] = useState<'equal_weight' | 'performance_weighted'>('equal_weight');

  // Execution & UI States
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>('idle');
  const [isStale, setIsStale] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results State
  const [prediction, setPrediction] = useState<ValuationResult | null>(null);
  const [shapPositives, setShapPositives] = useState<SHAPDriver[]>([]);
  const [shapNegatives, setShapNegatives] = useState<SHAPDriver[]>([]);
  const [counterfactuals, setCounterfactuals] = useState<CounterfactualScenario[]>([]);
  const [multiModelData, setMultiModelData] = useState<MultiModelResults | null>(null);

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const localities = CITY_LOCALITIES[city] || ['Whitefield', 'Koramangala', 'Indiranagar'];

  // Track input mutations to flag stale results
  const markInputsChanged = () => {
    if (status === 'success') {
      setIsStale(true);
    }
  };

  // Run Valuation Inference
  const executeValuation = async (modelsToRun = selectedModels) => {
    setStatus('loading');
    setErrorMessage(null);

    const inputData: ValuationInput = {
      city,
      locality,
      propertyType,
      builtupAreaSqft: area,
      bhk,
      bathrooms,
      age,
      floorNo: floor,
      totalFloors,
      parking,
      furnishing,
      facing,
      selectedModels: modelsToRun,
      ensembleMethod,
    };

    try {
      // 1. Point Prediction & Conformal Interval
      const predRes = await runPrediction(inputData);
      setPrediction(predRes);
      if (predRes.multiModelResults) {
        setMultiModelData(predRes.multiModelResults);
      }

      // 2. TreeSHAP Feature Attributions
      try {
        const explainRes = await runExplain(inputData);
        setShapPositives(explainRes.top_positive_drivers || []);
        setShapNegatives(explainRes.top_negative_drivers || []);
      } catch (explainErr) {
        console.warn('Explain endpoint notice:', explainErr);
      }

      // 3. Counterfactual Sensitivity Scenarios
      try {
        const cfRes = await runCounterfactual(inputData);
        setCounterfactuals(cfRes.scenarios || []);
      } catch (cfErr) {
        console.warn('Counterfactual endpoint notice:', cfErr);
      }

      setStatus('success');
      setIsStale(false);
    } catch (err: any) {
      console.error('Valuation execution error:', err);
      const isConnectionErr = err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch'));
      if (isConnectionErr) {
        setStatus('offline');
        setErrorMessage('Cannot establish connection to FastAPI backend on http://127.0.0.1:8000. Ensure server is running.');
      } else {
        setStatus('error');
        setErrorMessage(err.message || 'Inference pipeline encountered an unexpected error.');
      }
    }
  };

  // If URL parameters were provided (e.g. from Property Details page), trigger valuation immediately
  useEffect(() => {
    if (searchParams.get('city') || searchParams.get('area')) {
      executeValuation();
    }
  }, []);

  const handleCompareAll = () => {
    const allModels = ['random_forest', 'lightgbm', 'catboost', 'mlp', 'linear_regression', 'gradient_boosting', 'xgboost'];
    setSelectedModels(allModels);
    executeValuation(allModels);
    setActiveTab('comparison');
  };

  const currentInput: ValuationInput = {
    city,
    locality,
    propertyType,
    builtupAreaSqft: area,
    bhk,
    bathrooms,
    age,
    floorNo: floor,
    totalFloors,
    parking,
    furnishing,
    facing,
  };

  return (
    <div className="gd-consumer-app" style={{ minHeight: 'calc(100vh - 68px)', paddingBottom: '60px' }}>
      {/* Report Modal */}
      <ValuationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        input={currentInput}
        result={prediction}
        shapPositives={shapPositives}
        shapNegatives={shapNegatives}
        counterfactuals={counterfactuals}
      />

      {/* Studio Header Bar */}
      <div style={{ backgroundColor: 'var(--gd-warm-card)', borderBottom: '1px solid var(--gd-warm-border)', padding: '24px 0' }}>
        <div className="gd-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="gd-tag" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#ffffff', fontWeight: 800 }}>
                  AST-XGB Engine
                </span>
                <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                  Phase 15 XGBoost v4 • Conformal Quantiles
                </span>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 4px 0', color: 'var(--gd-text-charcoal)' }}>
                AI Valuation Studio
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--gd-text-slate)', margin: 0 }}>
                Certified machine-learning valuation, conformal uncertainty bounds, and multi-model consensus across 7 Indian metros.
              </p>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'valuation', label: 'Valuation & Uncertainty', icon: Sliders },
                { id: 'shap', label: 'SHAP Explainability', icon: Activity },
                { id: 'comparison', label: '7-Model Matrix', icon: Layers },
                { id: 'simulator', label: 'What-If Simulator', icon: Sparkles },
                { id: 'market', label: 'Macro Regimes', icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`gd-bhk-pill ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio View Body */}
      <div className="gd-container" style={{ padding: '32px 20px', flex: 1 }}>
        {/* Stale Results Warning Banner */}
        {isStale && status === 'success' && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '12px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#d97706',
              fontSize: '13.5px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <AlertTriangle size={18} />
              <span>Input attributes have been modified. Current predictions reflect previous parameters.</span>
            </div>
            <button
              type="button"
              onClick={() => executeValuation()}
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Recalculate
            </button>
          </div>
        )}

        {/* Tab 1: Valuation & Uncertainty */}
        {activeTab === 'valuation' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.25fr', gap: '32px', alignItems: 'start' }} className="gd-valuation-layout">
            {/* Left Column: Input Specification Form */}
            <div
              style={{
                backgroundColor: 'var(--gd-warm-card)',
                border: '1px solid var(--gd-warm-border)',
                borderRadius: 'var(--gd-radius-xl)',
                padding: '26px',
                boxShadow: 'var(--gd-shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gd-text-charcoal)' }}>
                <Sliders size={18} color="var(--gd-terra-500)" />
                <span>Property Attributes &amp; Specifications</span>
              </h3>

              {/* City & Locality */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="gd-field-group">
                  <label>City (7 Supported Metros) *</label>
                  <select
                    className="gd-search-select"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      const nextLocs = CITY_LOCALITIES[e.target.value] || [];
                      if (nextLocs.length > 0) setLocality(nextLocs[0]);
                      markInputsChanged();
                    }}
                  >
                    {Object.keys(CITY_LOCALITIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="gd-field-group">
                  <label>Locality *</label>
                  <select
                    className="gd-search-select"
                    value={locality}
                    onChange={(e) => {
                      setLocality(e.target.value);
                      markInputsChanged();
                    }}
                  >
                    {localities.slice(0, 60).map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area & Property Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="gd-field-group">
                  <label>Built-up Area (sq.ft) *</label>
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    className="gd-search-input"
                    style={{ paddingLeft: '14px' }}
                    value={area}
                    onChange={(e) => {
                      setArea(Number(e.target.value));
                      markInputsChanged();
                    }}
                  />
                </div>

                <div className="gd-field-group">
                  <label>Property Type *</label>
                  <select
                    className="gd-search-select"
                    value={propertyType}
                    onChange={(e) => {
                      setPropertyType(e.target.value);
                      markInputsChanged();
                    }}
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Builder Floor">Builder Floor</option>
                  </select>
                </div>
              </div>

              {/* BHK & Bathrooms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="gd-field-group">
                  <label>Bedrooms (BHK) *</label>
                  <select
                    className="gd-search-select"
                    value={bhk}
                    onChange={(e) => {
                      setBhk(Number(e.target.value));
                      markInputsChanged();
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} BHK</option>
                    ))}
                  </select>
                </div>

                <div className="gd-field-group">
                  <label>Bathrooms *</label>
                  <select
                    className="gd-search-select"
                    value={bathrooms}
                    onChange={(e) => {
                      setBathrooms(Number(e.target.value));
                      markInputsChanged();
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} Bath</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Age & Floors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="gd-field-group">
                  <label>Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    className="gd-search-input"
                    style={{ paddingLeft: '14px' }}
                    value={age}
                    onChange={(e) => {
                      setAge(Number(e.target.value));
                      markInputsChanged();
                    }}
                  />
                </div>

                <div className="gd-field-group">
                  <label>Floor No.</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    className="gd-search-input"
                    style={{ paddingLeft: '14px' }}
                    value={floor}
                    onChange={(e) => {
                      setFloor(Number(e.target.value));
                      markInputsChanged();
                    }}
                  />
                </div>

                <div className="gd-field-group">
                  <label>Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="gd-search-input"
                    style={{ paddingLeft: '14px' }}
                    value={totalFloors}
                    onChange={(e) => {
                      setTotalFloors(Number(e.target.value));
                      markInputsChanged();
                    }}
                  />
                </div>
              </div>

              {/* Furnishing & Facing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div className="gd-field-group">
                  <label>Furnishing Status</label>
                  <select
                    className="gd-search-select"
                    value={furnishing}
                    onChange={(e) => {
                      setFurnishing(e.target.value);
                      markInputsChanged();
                    }}
                  >
                    <option value="Unfurnished">Unfurnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Furnished">Furnished</option>
                  </select>
                </div>

                <div className="gd-field-group">
                  <label>Main Facing</label>
                  <select
                    className="gd-search-select"
                    value={facing}
                    onChange={(e) => {
                      setFacing(e.target.value);
                      markInputsChanged();
                    }}
                  >
                    <option value="North">North</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                    <option value="North-East">North-East</option>
                    <option value="North-West">North-West</option>
                  </select>
                </div>
              </div>

              {/* Model Selection Panel */}
              <div style={{ marginBottom: '22px' }}>
                <ModelSelectionPanel
                  selectedModels={selectedModels}
                  setSelectedModels={(m) => {
                    setSelectedModels(m);
                    markInputsChanged();
                  }}
                  ensembleMethod={ensembleMethod}
                  setEnsembleMethod={(m) => {
                    setEnsembleMethod(m as any);
                    markInputsChanged();
                  }}
                  onCompareAllModels={handleCompareAll}
                />
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                className="gd-btn-search"
                style={{ width: '100%', height: '48px', fontSize: '15px', justifyContent: 'center' }}
                onClick={() => executeValuation()}
                disabled={status === 'loading'}
              >
                <Sparkles size={18} className={status === 'loading' ? 'spin' : ''} />
                <span>{status === 'loading' ? 'Executing Model Inference...' : 'Calculate AST-XGB Valuation'}</span>
              </button>
            </div>

            {/* Right Column: Execution States & Live Results */}
            <div>
              {/* STATE 1: IDLE (Uncalculated Initial State) */}
              {status === 'idle' && (
                <div
                  style={{
                    backgroundColor: 'var(--gd-warm-card)',
                    border: '1px solid var(--gd-warm-border)',
                    borderRadius: 'var(--gd-radius-xl)',
                    padding: '36px',
                    boxShadow: 'var(--gd-shadow-sm)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--gd-terra-500)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Sparkles size={32} />
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gd-text-charcoal)', marginBottom: '8px' }}>
                    Ready for Certified AI Valuation
                  </h3>
                  <p style={{ color: 'var(--gd-text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                    Configure the property specification on the left and click <strong>Calculate AST-XGB Valuation</strong> to trigger live gradient boosted regression and conformal interval estimation.
                  </p>

                  {/* Verified Baseline Evaluation Metrics Card */}
                  <div
                    style={{
                      background: 'var(--gd-warm-bg)',
                      border: '1px solid var(--gd-warm-border)',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'left',
                      marginBottom: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13px', color: 'var(--gd-text-charcoal)', marginBottom: '10px' }}>
                      <ShieldCheck size={16} color="var(--gd-terra-500)" />
                      <span>Verified Test Partition Metrics (Phase 15 Benchmark)</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12.5px' }}>
                      <div style={{ background: 'var(--gd-warm-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
                        <span style={{ color: 'var(--gd-text-muted)', fontSize: '11px', display: 'block' }}>TEST R²</span>
                        <strong style={{ color: '#10b981', fontSize: '15px' }}>0.4099</strong>
                      </div>
                      <div style={{ background: 'var(--gd-warm-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
                        <span style={{ color: 'var(--gd-text-muted)', fontSize: '11px', display: 'block' }}>TEST MAE</span>
                        <strong style={{ fontSize: '15px' }}>₹ 42.85 L</strong>
                      </div>
                      <div style={{ background: 'var(--gd-warm-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
                        <span style={{ color: 'var(--gd-text-muted)', fontSize: '11px', display: 'block' }}>TEST MAPE</span>
                        <strong style={{ fontSize: '15px' }}>39.50%</strong>
                      </div>
                      <div style={{ background: 'var(--gd-warm-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
                        <span style={{ color: 'var(--gd-text-muted)', fontSize: '11px', display: 'block' }}>CONFORMAL q90</span>
                        <strong style={{ color: '#38bdf8', fontSize: '15px' }}>±₹ 58.76 L</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="gd-btn-search"
                    onClick={() => executeValuation()}
                    style={{ display: 'inline-flex', padding: '0 28px', height: '44px' }}
                  >
                    Run Valuation on Selected Inputs
                  </button>
                </div>
              )}

              {/* STATE 2: LOADING */}
              {status === 'loading' && (
                <div
                  style={{
                    backgroundColor: 'var(--gd-warm-card)',
                    border: '1px solid var(--gd-warm-border)',
                    borderRadius: 'var(--gd-radius-xl)',
                    padding: '60px 24px',
                    textAlign: 'center',
                    boxShadow: 'var(--gd-shadow-sm)',
                  }}
                >
                  <div
                    className="spin"
                    style={{
                      display: 'inline-block',
                      width: '40px',
                      height: '40px',
                      border: '4px solid var(--gd-warm-border)',
                      borderTopColor: 'var(--gd-terra-500)',
                      borderRadius: '50%',
                      marginBottom: '16px',
                    }}
                  />
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--gd-text-charcoal)', marginBottom: '6px' }}>
                    Evaluating Spatial Models...
                  </h3>
                  <p style={{ color: 'var(--gd-text-muted)', fontSize: '13.5px', maxWidth: '380px', margin: '0 auto' }}>
                    Calling FastAPI inference endpoints (/api/v1/predict, /api/v1/explain, /api/v1/counterfactual) with conformal calibration.
                  </p>
                </div>
              )}

              {/* STATE 3: OFFLINE OR ERROR */}
              {(status === 'error' || status === 'offline') && (
                <div
                  style={{
                    backgroundColor: 'var(--gd-warm-card)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--gd-radius-xl)',
                    padding: '32px',
                    boxShadow: 'var(--gd-shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '12px' }}>
                    <AlertCircle size={24} />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                      {status === 'offline' ? 'FastAPI Backend Offline' : 'Valuation Request Failed'}
                    </h3>
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--gd-text-slate)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {errorMessage}
                  </p>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="gd-btn-search"
                      onClick={() => executeValuation()}
                    >
                      <RefreshCw size={15} />
                      <span>Retry Valuation</span>
                    </button>
                    <Link
                      to="/tools"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0 18px',
                        borderRadius: 'var(--gd-radius-md)',
                        background: 'var(--gd-warm-bg)',
                        color: 'var(--gd-text-charcoal)',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: '1px solid var(--gd-warm-border)',
                        textDecoration: 'none',
                      }}
                    >
                      Explore Offline Tools
                    </Link>
                  </div>
                </div>
              )}

              {/* STATE 4: SUCCESS RESULTS */}
              {status === 'success' && prediction && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Primary Fair Value Box */}
                  <div
                    style={{
                      background: 'linear-gradient(145deg, #161a29 0%, #0d121f 100%)',
                      color: '#ffffff',
                      borderRadius: 'var(--gd-radius-xl)',
                      padding: '28px',
                      boxShadow: '0 12px 32px rgba(13, 18, 31, 0.35)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                        AST-XGB Fair Value Point Estimate
                      </span>
                      <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 800 }}>
                        Regime: {prediction.activeMarketRegime} ({Math.round(prediction.regimeConfidence * 100)}%)
                      </span>
                    </div>

                    <div style={{ fontSize: '42px', fontWeight: 900, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', margin: '4px 0' }}>
                      {prediction.predictedPriceFormatted}
                    </div>

                    <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 600, marginBottom: '20px' }}>
                      ₹{Math.round(prediction.pricePerSqft).toLocaleString()} per sq.ft • Inference Latency: {prediction.latencyMs} ms
                    </div>

                    {/* 90% Conformal Prediction Interval Gauge */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '18px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                        <span style={{ color: '#cbd5e1' }}>90% Conformal Prediction Interval:</span>
                        <strong style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', fontSize: '15px' }}>
                          {prediction.conformal.lowerFormatted} – {prediction.conformal.upperFormatted}
                        </strong>
                      </div>

                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '999px', margin: '0 auto' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                        <span>Lower Bound (q0.05)</span>
                        <span>Point Estimate</span>
                        <span>Upper Bound (q0.95)</span>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Model Engine</span>
                        <strong style={{ color: '#ffffff' }}>{prediction.modelVersion}</strong>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Feature Space</span>
                        <strong style={{ color: '#ffffff' }}>v4 (Leakage Free)</strong>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Split Protocol</span>
                        <strong style={{ color: '#ffffff' }}>70/15/15 Temporal</strong>
                      </div>
                    </div>

                    {/* Export Report Action */}
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      style={{
                        width: '100%',
                        height: '42px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--gd-radius-md)',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={16} />
                      <span>Export Official Valuation Certificate &amp; Audit Report</span>
                    </button>
                  </div>

                  {/* Top SHAP Drivers Preview */}
                  {shapPositives.length > 0 && (
                    <div
                      style={{
                        backgroundColor: 'var(--gd-warm-card)',
                        border: '1px solid var(--gd-warm-border)',
                        borderRadius: 'var(--gd-radius-xl)',
                        padding: '24px',
                        boxShadow: 'var(--gd-shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--gd-text-charcoal)' }}>
                          Top SHAP Attribution Drivers (/api/v1/explain)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveTab('shap')}
                          style={{ background: 'none', border: 'none', color: 'var(--gd-terra-600)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          View Full Breakdown →
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 800 }}>Top Positive Contributors</span>
                          {shapPositives.slice(0, 2).map((d) => (
                            <div key={d.feature} style={{ marginTop: '6px', padding: '8px 10px', background: '#ecfdf5', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{d.feature.replace(/_/g, ' ')}</span>
                              <strong style={{ color: '#059669' }}>+₹ {(d.shap_value / 100000).toFixed(2)} L</strong>
                            </div>
                          ))}
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#ef4444', fontWeight: 800 }}>Top Value Suppressors</span>
                          {shapNegatives.slice(0, 2).map((d) => (
                            <div key={d.feature} style={{ marginTop: '6px', padding: '8px 10px', background: '#fef2f2', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{d.feature.replace(/_/g, ' ')}</span>
                              <strong style={{ color: '#dc2626' }}>-₹ {(d.abs_shap / 100000).toFixed(2)} L</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discrete Counterfactual Scenarios Preview */}
                  {counterfactuals.length > 0 && (
                    <div
                      style={{
                        backgroundColor: 'var(--gd-warm-card)',
                        border: '1px solid var(--gd-warm-border)',
                        borderRadius: 'var(--gd-radius-xl)',
                        padding: '24px',
                        boxShadow: 'var(--gd-shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--gd-text-charcoal)' }}>
                          What-If Sensitivity Scenarios (/api/v1/counterfactual)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveTab('simulator')}
                          style={{ background: 'none', border: 'none', color: 'var(--gd-terra-600)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Explore Simulator →
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {counterfactuals.map((sc) => (
                          <div key={sc.scenario} style={{ background: 'var(--gd-warm-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--gd-warm-border)', fontSize: '12px' }}>
                            <div style={{ color: 'var(--gd-text-muted)', fontSize: '11px', fontWeight: 700 }}>{sc.perturbation}</div>
                            <strong style={{ display: 'block', fontSize: '14px', margin: '4px 0', fontFamily: 'monospace' }}>
                              {sc.predicted_price_formatted}
                            </strong>
                            <span style={{ color: sc.percentage_change >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                              {sc.percentage_change >= 0 ? `+${sc.percentage_change}%` : `${sc.percentage_change}%`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Educational & Research Disclaimer */}
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', lineHeight: 1.6, padding: '12px 16px', background: 'var(--gd-warm-card)', borderRadius: '8px', border: '1px solid var(--gd-warm-border)' }}>
                    <strong>Research Disclaimer:</strong> The AST-XGB fair value and conformal uncertainty intervals are computed via gradient boosted regression trees and conformal quantile calibration on historical housing transaction records. This algorithmic estimate is for academic and indicative discovery purposes and does not constitute a guaranteed bank appraisal or legal property valuation.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Full SHAP Attribution Breakdown */}
        {activeTab === 'shap' && (
          <PropertyAnalysisView
            city={city}
            locality={locality}
            propertyType={propertyType}
            area={area}
            bedrooms={bhk}
            bathrooms={bathrooms}
            age={age}
            floor={floor}
            totalFloors={totalFloors}
            prediction={
              prediction
                ? {
                    predicted_price_inr: prediction.predictedPriceInr,
                    predicted_price_formatted: prediction.predictedPriceFormatted,
                    price_per_sqft: prediction.pricePerSqft,
                    conformal_lower_90_inr: prediction.conformal.lower90Inr,
                    conformal_upper_90_inr: prediction.conformal.upper90Inr,
                    conformal_lower_90_formatted: prediction.conformal.lowerFormatted,
                    conformal_upper_90_formatted: prediction.conformal.upperFormatted,
                    active_market_regime: prediction.activeMarketRegime,
                    regime_confidence: prediction.regimeConfidence,
                    latency_ms: prediction.latencyMs,
                    model_version: prediction.modelVersion,
                    validation_warnings: prediction.validationWarnings,
                  }
                : null
            }
            shapPositives={shapPositives}
            shapNegatives={shapNegatives}
            onEditDetails={() => setActiveTab('valuation')}
            loadingExplain={status === 'loading'}
          />
        )}

        {/* Tab 3: 7-Model Multi-Ensemble Comparison Matrix */}
        {activeTab === 'comparison' && multiModelData && (
          <MultiModelComparisonView data={multiModelData} />
        )}
        {activeTab === 'comparison' && !multiModelData && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gd-text-muted)', background: 'var(--gd-warm-card)', borderRadius: '16px', border: '1px solid var(--gd-warm-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gd-text-charcoal)', marginBottom: '8px' }}>
              Multi-Model Comparison Matrix
            </h3>
            <p style={{ maxWidth: '440px', margin: '0 auto 20px auto' }}>
              Run the full 7-model suite (XGBoost, LightGBM, CatBoost, Random Forest, Gradient Boosting, Linear Regression, and MLP) to evaluate model spread and consensus.
            </p>
            <button type="button" className="gd-btn-search" onClick={handleCompareAll} style={{ display: 'inline-flex' }}>
              Run 7-Model Ensemble Evaluation
            </button>
          </div>
        )}

        {/* Tab 4: What-If Scenario Simulator */}
        {activeTab === 'simulator' && (
          <WhatIfSimulatorView
            city={city}
            locality={locality}
            propertyType={propertyType}
            baseArea={area}
            baseBhk={bhk}
            baseBathrooms={bathrooms}
            baseAge={age}
            baseFloor={floor}
            baseTotalFloors={totalFloors}
            basePrice={prediction ? prediction.predictedPriceInr : 10000000}
          />
        )}

        {/* Tab 5: Macro Market Insights */}
        {activeTab === 'market' && (
          <MarketInsightsView
            city={city}
            prediction={
              prediction
                ? {
                    predicted_price_inr: prediction.predictedPriceInr,
                    predicted_price_formatted: prediction.predictedPriceFormatted,
                    price_per_sqft: prediction.pricePerSqft,
                    conformal_lower_90_inr: prediction.conformal.lower90Inr,
                    conformal_upper_90_inr: prediction.conformal.upper90Inr,
                    conformal_lower_90_formatted: prediction.conformal.lowerFormatted,
                    conformal_upper_90_formatted: prediction.conformal.upperFormatted,
                    active_market_regime: prediction.activeMarketRegime,
                    regime_confidence: prediction.regimeConfidence,
                    latency_ms: prediction.latencyMs,
                    model_version: prediction.modelVersion,
                    validation_warnings: prediction.validationWarnings,
                  }
                : null
            }
          />
        )}
      </div>
    </div>
  );
};
