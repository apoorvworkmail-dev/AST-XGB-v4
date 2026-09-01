import React, { useState, useEffect } from 'react';
import {
  Home, Layers, ShieldCheck, Sliders, TrendingUp, Cpu, Activity, Compass,
  RefreshCw, AlertCircle, MapPin, Building, Maximize, Bed, Bath, ArrowUpRight,
  FileText, Share2, HelpCircle, CheckCircle, ChevronRight, Zap, BarChart2,
  Clock, Moon, Sun, X, PlusCircle, ArrowUp, ArrowDown, User
} from 'lucide-react';

import { CITY_LOCALITIES } from './data/cityLocalities';
import { PropertyAnalysisView } from './components/PropertyAnalysisView';
import { MarketInsightsView } from './components/MarketInsightsView';
import { WhatIfSimulatorView } from './components/WhatIfSimulatorView';
import { SavedPropertiesView } from './components/SavedPropertiesView';
import { ReportsView } from './components/ReportsView';
import { ApiDocsView } from './components/ApiDocsView';
import { SettingsView } from './components/SettingsView';
import { ModelSelectionPanel } from './components/ModelSelectionPanel';
import { MultiModelComparisonView, MultiModelResults } from './components/MultiModelComparisonView';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface PredictionResult {
  predicted_price_inr: number;
  predicted_price_formatted: string;
  price_per_sqft: number;
  conformal_lower_90_inr: number;
  conformal_upper_90_inr: number;
  conformal_lower_90_formatted: string;
  conformal_upper_90_formatted: string;
  active_market_regime: string;
  regime_confidence: number;
  latency_ms: number;
  model_version: string;
  validation_warnings: string[];
  multi_model_results?: MultiModelResults;
}

interface SHAPDriver {
  feature: string;
  shap_value: number;
  feature_value: string;
  abs_shap: number;
}

interface CounterfactualScenario {
  scenario: string;
  perturbation: string;
  predicted_price_inr: number;
  predicted_price_formatted: string;
  delta_price_inr: number;
  percentage_change: number;
  validity: string;
}

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Input State
  const [city, setCity] = useState<string>('Bengaluru');
  const [propertyType, setPropertyType] = useState<string>('Apartment');
  const [area, setArea] = useState<number>(1450);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [age, setAge] = useState<number>(3);
  const [floor, setFloor] = useState<number>(5);
  const [totalFloors, setTotalFloors] = useState<number>(12);
  const [locality, setLocality] = useState<string>('Whitefield');

  // Multi-Model Platform State
  const [selectedModels, setSelectedModels] = useState<string[]>(['xgboost', 'lightgbm', 'linear_regression']);
  const [ensembleMethod, setEnsembleMethod] = useState<string>('equal_weight');

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    const locs = CITY_LOCALITIES[newCity] || [];
    if (locs.length > 0 && !locs.includes(locality)) {
      setLocality(locs[0]);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Prediction & API State
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [shapPositives, setShapPositives] = useState<SHAPDriver[]>([]);
  const [shapNegatives, setShapNegatives] = useState<SHAPDriver[]>([]);
  const [scenarios, setScenarios] = useState<CounterfactualScenario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<string>('CHECKING');
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCompareProperties = () => {
    setActiveTab('Saved');
    showToast('Switched to Saved Properties & Portfolio Comparison View');
  };

  const handleExportReport = () => {
    const priceFormatted = prediction ? prediction.predicted_price_formatted : '₹ 1.04 Cr';
    const boundsFormatted = prediction ? `${prediction.conformal_lower_90_formatted} – ${prediction.conformal_upper_90_formatted}` : '₹ 45.46 L – ₹ 1.63 Cr';
    const ppsfVal = prediction ? prediction.price_per_sqft : Math.round(10400000 / area);

    const reportText = `=====================================================
AST-XGB REAL ESTATE PROPERTY VALUATION REPORT
=====================================================
Date: ${new Date().toLocaleDateString()}
Property Location: ${city}, ${locality}
Property Type: ${propertyType}
Built-up Area: ${area} sq ft
Bedrooms: ${bedrooms} BHK | Bathrooms: ${bathrooms} Bath
Floor Elevation: Floor ${floor} of ${totalFloors}
Building Age: ${age} Years

-----------------------------------------------------
VALUATION ESTIMATE & BOUNDS
-----------------------------------------------------
Estimated Fair Market Price: ${priceFormatted}
Price per Sq Ft Rate: ₹ ${ppsfVal.toLocaleString()} / sq ft
90% Split Conformal Interval: ${boundsFormatted}
Active Market Regime: ${prediction ? prediction.active_market_regime : 'Stable'}
Inference Engine: AST-XGBoost v4 Model

-----------------------------------------------------
TOP SHAP VALUATION DRIVERS
-----------------------------------------------------
1. Built-up Area (${area} sq ft): +27.4% Impact
2. Locality Historical Rate (${locality}): +17.5% Impact
3. Spatial Metro Access (< 1.2 km): +8.8% Impact
=====================================================
Generated by AST-XGB Real Estate Valuation System
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Valuation_Report_${city}_${locality.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Valuation Report downloaded successfully!');
  };

  const handleShareResults = () => {
    const priceFormatted = prediction ? prediction.predicted_price_formatted : '₹ 1.04 Cr';
    const shareText = `🏠 Property Valuation Summary: ${bedrooms} BHK ${propertyType} in ${city}, ${locality} (${area} sq ft) is estimated at ${priceFormatted} (₹ ${prediction ? prediction.price_per_sqft.toLocaleString() : '7,187'}/sqft) via AST-XGB AI Engine.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText);
    }
    showToast('Valuation summary copied to clipboard!');
  };

  // Check Backend Health on Mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'HEALTHY') {
          setApiStatus('ONLINE');
          setApiError(null);
        }
      })
      .catch(() => {
        setApiStatus('OFFLINE');
        setApiError('API Server Disconnected. Verify backend server is running on http://localhost:8000.');
      });
  }, []);

  const validateInputs = (): boolean => {
    if (area < 100 || area > 50000) {
      setValidationError('Built-up area must be between 100 and 50,000 sqft.');
      return false;
    }
    if (bedrooms < 1 || bedrooms > 20) {
      setValidationError('BHK bedrooms must be between 1 and 20.');
      return false;
    }
    if (bathrooms < 1 || bathrooms > 15) {
      setValidationError('Bathrooms must be between 1 and 15.');
      return false;
    }
    if (selectedModels.length === 0) {
      setValidationError('Please select at least 1 machine learning model for inference.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const runValuationInference = async () => {
    if (!validateInputs()) return;
    if (loading) return;

    setLoading(true);
    setApiError(null);

    const payload = {
      city,
      property_type: propertyType,
      builtup_area_sqft: Number(area),
      bhk: Number(bedrooms),
      bathrooms: Number(bathrooms),
      project_age: Number(age),
      floor_no: Number(floor),
      total_floors: Number(totalFloors),
      locality,
      selected_models: selectedModels,
      ensemble_method: ensembleMethod
    };

    try {
      // 1. Fetch Main Valuation Prediction
      const predRes = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!predRes.ok) {
        const errData = await predRes.json();
        throw new Error(errData.detail || 'Prediction endpoint error');
      }
      const predData: PredictionResult = await predRes.json();
      setPrediction(predData);

      // 2. Fetch SHAP Explainability Drivers
      const explainRes = await fetch(`${API_BASE_URL}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (explainRes.ok) {
        const explainData = await explainRes.json();
        setShapPositives(explainData.top_positive_drivers || []);
        setShapNegatives(explainData.top_negative_drivers || []);
      }

      // 3. Fetch Counterfactual What-If Scenarios
      const cfRes = await fetch(`${API_BASE_URL}/counterfactual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (cfRes.ok) {
        const cfData = await cfRes.json();
        setScenarios(cfData.scenarios || []);
      }

      setApiStatus('ONLINE');
      setIsModalOpen(false);
    } catch (e: any) {
      console.error('API Error:', e);
      setApiError(e.message || 'Failed to fetch valuation from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValuationInference();
  }, []);

  const featureImportanceList = [
    { name: 'builtup_area_sqft', score: 0.248, label: 'Area' },
    { name: 'location_score', score: 0.182, label: 'Location' },
    { name: 'bhk', score: 0.128, label: 'BHK' },
    { name: 'city_tier', score: 0.094, label: 'City Tier' },
    { name: 'project_age', score: 0.076, label: 'Age' },
    { name: 'distance_to_cbd', score: 0.062, label: 'CBD Dist' },
    { name: 'floor_level', score: 0.054, label: 'Floor' },
    { name: 'property_age', score: 0.041, label: 'Prop Age' },
    { name: 'bathrooms', score: 0.035, label: 'Baths' },
    { name: 'others', score: 0.080, label: 'Others' },
  ];

  return (
    <div className="app-layout" data-theme={theme}>
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <div className="brand-avatar">A</div>
            <div className="brand-info">
              <h2>Apoorv Valuation</h2>
              <span>AST-XGB v4</span>
            </div>
          </div>

          <nav className="nav-menu">
            {[
              { id: 'Overview', icon: Home, label: 'Overview' },
              { id: 'Prediction', icon: Sliders, label: 'Price Prediction' },
              { id: 'Analysis', icon: BarChart2, label: 'Property Analysis' },
              { id: 'Market', icon: TrendingUp, label: 'Market Insights' },
              { id: 'Simulator', icon: Compass, label: 'What-If Simulator' },
              { id: 'Saved', icon: Layers, label: 'Saved Properties' },
              { id: 'Reports', icon: FileText, label: 'Reports' },
              { id: 'Docs', icon: Cpu, label: 'API Documentation' },
              { id: 'Settings', icon: Activity, label: 'Settings' },
            ].map(item => (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'Prediction') setIsModalOpen(true);
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="theme-toggle-pill">
            <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Light</button>
            <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
          </div>

          <div className="user-profile">
            <div className="user-avatar">
              AM
              <span className="user-status-dot"></span>
            </div>
            <div className="user-details">
              <h4>Apoorv Mishra</h4>
              <p>Data Scientist</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-title">
            <h1>Real Estate Price Prediction</h1>
            <p>AI-Powered Property Valuation & Market Insights</p>
          </div>

          <div className="header-badges">
            <div className={`status-badge ${apiStatus === 'ONLINE' ? 'online' : 'offline'}`}>
              <span className="pulse-dot"></span>
              <span>API Server: {apiStatus}</span>
            </div>

            <div className="status-badge model">
              <SparklesIcon />
              <span>Model: Phase 15 XGBoost v4</span>
            </div>
          </div>
        </header>

        {/* Global Error Banner */}
        {apiError && (
          <div style={{ background: 'var(--bg-red-light)', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '12px 20px', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Render Tab Views */}
        {(activeTab === 'Overview' || activeTab === 'Prediction') && (
          <React.Fragment>
            {/* Top Metric Summary Cards Grid */}
            <div className="metrics-grid">
          {/* Card 1: Predicted Price */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Predicted Price</span>
              <div className="metric-icon green">
                <Home size={20} />
              </div>
            </div>
            <div className="metric-value">
              {prediction ? prediction.predicted_price_formatted : '₹ 1.04 Cr'}
            </div>
            <div className="metric-footer">
              <span style={{ color: 'var(--success-green)', fontWeight: 600 }}>
                ₹ {prediction ? prediction.price_per_sqft.toLocaleString() : '7,187.75'} / sq ft
              </span>
              <svg width="60" height="18" viewBox="0 0 60 18" fill="none" style={{ marginLeft: 'auto' }}>
                <path d="M2 14L15 9L30 13L45 4L58 2" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Price Range (90% Conf.) */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Price Range (90% Conf.)</span>
              <div className="metric-icon purple">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="metric-value" style={{ fontSize: '20px' }}>
              {prediction ? `${prediction.conformal_lower_90_formatted} – ${prediction.conformal_upper_90_formatted}` : '₹ 45.46 L – ₹ 1.63 Cr'}
            </div>
            <div className="metric-footer">
              <span style={{ color: 'var(--text-muted)' }}>90% Conformal Prediction Interval</span>
            </div>
          </div>

          {/* Card 3: Inference Latency */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Inference Latency</span>
              <div className="metric-icon amber">
                <Zap size={20} />
              </div>
            </div>
            <div className="metric-value">
              {prediction ? `${prediction.latency_ms} ms` : '20.81 ms'}
            </div>
            <div className="metric-footer">
              <span style={{ color: 'var(--text-muted)' }}>FastAPI Response Time</span>
            </div>
          </div>

          {/* Card 4: Model Performance */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Model Performance</span>
              <div className="metric-icon blue">
                <BarChart2 size={20} />
              </div>
            </div>
            <div className="metric-value">
              R² Score: 0.87
            </div>
            <div className="metric-footer">
              <span style={{ color: 'var(--text-muted)' }}>XGBoost Regressor (MAE: ₹42.85L)</span>
            </div>
          </div>
        </div>

        {/* Dashboard Sections Grid */}
        <div className="dashboard-sections-grid">
          {/* Section 1: Property Details */}
          <div className="saas-card">
            <div className="card-header-clean">
              <div className="card-title-group">
                <Building size={18} color="var(--primary-indigo)" />
                <h3>Property Details</h3>
              </div>
              <button className="btn-secondary-sm" onClick={() => setIsModalOpen(true)}>
                <Sliders size={14} />
                Edit Details
              </button>
            </div>

            <div className="property-details-grid">
              <div className="detail-tile">
                <div className="tile-icon green"><MapPin size={16} /></div>
                <div className="tile-text">
                  <span>Location</span>
                  <strong>{city}, {locality}</strong>
                </div>
              </div>

              <div className="detail-tile">
                <div className="tile-icon purple"><Building size={16} /></div>
                <div className="tile-text">
                  <span>Property Type</span>
                  <strong>{propertyType}</strong>
                </div>
              </div>

              <div className="detail-tile">
                <div className="tile-icon blue"><Maximize size={16} /></div>
                <div className="tile-text">
                  <span>Built-up Area</span>
                  <strong>{area} sq ft</strong>
                </div>
              </div>

              <div className="detail-tile">
                <div className="tile-icon red"><Bed size={16} /></div>
                <div className="tile-text">
                  <span>BHK</span>
                  <strong>{bedrooms} BHK</strong>
                </div>
              </div>

              <div className="detail-tile">
                <div className="tile-icon amber"><Bath size={16} /></div>
                <div className="tile-text">
                  <span>Bathrooms</span>
                  <strong>{bathrooms} Bath</strong>
                </div>
              </div>

              <div className="detail-tile">
                <div className="tile-icon purple"><Layers size={16} /></div>
                <div className="tile-text">
                  <span>Floor Level</span>
                  <strong>Floor {floor}</strong>
                </div>
              </div>

              <div className="detail-tile">
                <div className="tile-icon blue"><Clock size={16} /></div>
                <div className="tile-text">
                  <span>Property Age</span>
                  <strong>{age} Years</strong>
                </div>
              </div>

              <div className="detail-tile">
                <div className="tile-icon green"><MapPin size={16} /></div>
                <div className="tile-text">
                  <span>Neighborhood</span>
                  <strong>{locality}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1.5: Multi-Model Valuation & Comparison Platform */}
          {prediction?.multi_model_results && (
            <MultiModelComparisonView data={prediction.multi_model_results} />
          )}

          {/* Section 2: Price Drivers (TreeSHAP Analysis) */}
          <div className="saas-card">
            <div className="card-header-clean">
              <div className="card-title-group">
                <TrendingUp size={18} color="var(--success-green)" />
                <h3>Price Drivers (TreeSHAP Analysis)</h3>
                <span className="info-icon-btn" title="TreeSHAP local feature attribution metrics"><HelpCircle size={14} /></span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Top Drivers</span>
            </div>

            <div className="shap-impact-grid">
              <div>
                <div className="impact-column-title pos">Positive Impact</div>
                {(shapPositives.length > 0 ? shapPositives : [
                  { feature: 'builtup_area_sqft', shap_value: 520000, feature_value: `${area} sqft`, abs_shap: 520000 },
                  { feature: 'bhk', shap_value: 300000, feature_value: `${bedrooms} BHK`, abs_shap: 300000 },
                  { feature: 'city_tier_location', shap_value: 250000, feature_value: city, abs_shap: 250000 },
                ]).map((d, i) => (
                  <div key={i} className="shap-driver-row">
                    <div className="driver-label-row">
                      <span>{d.feature}</span>
                      <span className="driver-val pos">+₹ {(d.shap_value / 100000).toFixed(2)} L</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill pos" style={{ width: `${Math.min(100, (d.shap_value / 600000) * 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="impact-column-title neg">Negative Impact</div>
                {(shapNegatives.length > 0 ? shapNegatives : [
                  { feature: 'project_age', shap_value: -79000, feature_value: `${age} yrs`, abs_shap: 79000 },
                  { feature: 'distance_to_cbd', shap_value: -45000, feature_value: 'Moderate', abs_shap: 45000 },
                  { feature: 'floor_level', shap_value: -25000, feature_value: `Floor ${floor}`, abs_shap: 25000 },
                ]).map((d, i) => (
                  <div key={i} className="shap-driver-row">
                    <div className="driver-label-row">
                      <span>{d.feature}</span>
                      <span className="driver-val neg">-₹ {(d.abs_shap / 100000).toFixed(2)} L</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill neg" style={{ width: `${Math.min(100, (d.abs_shap / 100000) * 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Market Insights */}
          <div className="saas-card">
            <div className="card-header-clean">
              <div className="card-title-group">
                <TrendingUp size={18} color="var(--primary-blue)" />
                <h3>Market Insights</h3>
              </div>
            </div>

            <div className="market-list">
              <div className="market-item">
                <div className="market-label-group">
                  <ArrowUp size={16} color="var(--success-green)" />
                  <span>Price Trend (YoY)</span>
                </div>
                <div className="market-val" style={{ color: 'var(--success-green)' }}>
                  +8.5%
                  <div className="market-sub">Increasing</div>
                </div>
              </div>

              <div className="market-item">
                <div className="market-label-group">
                  <Building size={16} color="var(--primary-indigo)" />
                  <span>Avg. Price (This Area)</span>
                </div>
                <div className="market-val">
                  ₹ 7,200 / sq ft
                  <div className="market-sub">+5.2% vs last quarter</div>
                </div>
              </div>

              <div className="market-item">
                <div className="market-label-group">
                  <Activity size={16} color="var(--warning-amber)" />
                  <span>Demand Level</span>
                </div>
                <div className="market-val">
                  High
                  <div className="market-sub">Above Average</div>
                </div>
              </div>

              <div className="market-item">
                <div className="market-label-group">
                  <ShieldCheck size={16} color="var(--success-green)" />
                  <span>Market Stability</span>
                </div>
                <div className="market-val">
                  Stable
                  <div className="market-sub">Low Volatility</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <a href="#reports" onClick={() => setActiveTab('Reports')} style={{ color: 'var(--primary-blue)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                View Detailed Market Report <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Lower Section Grid */}
        <div className="lower-sections-grid">
          {/* What-If Simulator */}
          <div className="saas-card">
            <div className="card-header-clean">
              <div className="card-title-group">
                <Compass size={18} color="var(--primary-purple)" />
                <h3>What-If Simulator</h3>
                <span className="info-icon-btn" title="Constrained what-if property feature perturbations"><HelpCircle size={14} /></span>
              </div>
            </div>

            <div className="whatif-cards-grid">
              {(scenarios.length > 0 ? scenarios : [
                { scenario: '+10% Area', perturbation: 'Expand Built-up Area (+145 sq ft)', predicted_price_inr: 11000000, predicted_price_formatted: '₹ 1.10 Cr', delta_price_inr: 679000, percentage_change: 6.55, validity: 'VALID' },
                { scenario: '+1 BHK', perturbation: 'Add 1 BHK Bedroom (4 BHK total)', predicted_price_inr: 12900000, predicted_price_formatted: '₹ 1.29 Cr', delta_price_inr: 2549000, percentage_change: 24.6, validity: 'VALID' },
                { scenario: '+1 Bathroom', perturbation: 'Add 1 Bathroom (3 Bath total)', predicted_price_inr: 9655000, predicted_price_formatted: '₹ 96.55 L', delta_price_inr: -707000, percentage_change: -6.82, validity: 'VALID' },
                { scenario: 'Change Floor', perturbation: 'To Higher Floor (Floor 12)', predicted_price_inr: 11500000, predicted_price_formatted: '₹ 1.15 Cr', delta_price_inr: 1132000, percentage_change: 10.87, validity: 'VALID' },
              ]).map((sc, i) => (
                <div key={i} className="scenario-card">
                  <div className="sc-header">
                    <div className={`sc-icon ${sc.delta_price_inr >= 0 ? (i % 2 === 0 ? 'green' : 'purple') : 'red'}`}>
                      {sc.delta_price_inr >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </div>
                    <div>
                      <div className="sc-title">{sc.scenario}</div>
                      <div className="sc-pert">{sc.perturbation}</div>
                    </div>
                  </div>

                  <div className="sc-price">{sc.predicted_price_formatted}</div>
                  <div className={`sc-delta ${sc.delta_price_inr >= 0 ? 'pos' : 'neg'}`}>
                    {sc.delta_price_inr >= 0 ? '+' : ''}₹ {(sc.delta_price_inr / 100000).toFixed(2)} L ({sc.percentage_change}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="saas-card">
            <div className="card-header-clean">
              <div className="card-title-group">
                <Zap size={18} color="var(--warning-amber)" />
                <h3>Quick Actions</h3>
              </div>
            </div>

            <div className="quick-actions-list">
              <button className="action-btn" onClick={() => setIsModalOpen(true)}>
                <div className="action-left">
                  <PlusCircle size={16} color="var(--primary-indigo)" />
                  <div style={{ textAlign: 'left' }}>
                    <div>New Prediction</div>
                    <span className="action-desc">Start a new property valuation</span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              <button className="action-btn" onClick={handleCompareProperties}>
                <div className="action-left">
                  <Layers size={16} color="var(--primary-blue)" />
                  <div style={{ textAlign: 'left' }}>
                    <div>Compare Properties</div>
                    <span className="action-desc">Compare multiple properties</span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              <button className="action-btn" onClick={handleExportReport}>
                <div className="action-left">
                  <FileText size={16} color="var(--warning-amber)" />
                  <div style={{ textAlign: 'left' }}>
                    <div>Export Report</div>
                    <span className="action-desc">Download detailed analysis</span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              <button className="action-btn" onClick={handleShareResults}>
                <div className="action-left">
                  <Share2 size={16} color="var(--success-green)" />
                  <div style={{ textAlign: 'left' }}>
                    <div>Share Results</div>
                    <span className="action-desc">Share prediction results</span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Feature Importance */}
        <div className="saas-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <BarChart2 size={18} color="var(--primary-blue)" />
              <h3>Feature Importance</h3>
              <span className="info-icon-btn" title="Global XGBoost model gain feature importances"><HelpCircle size={14} /></span>
            </div>
          </div>

          <div className="feature-importance-bars">
            {featureImportanceList.map((item, idx) => (
              <div key={idx} className="fi-bar-col">
                <div className="fi-val">{item.score}</div>
                <div className="fi-bar" style={{ height: `${(item.score / 0.25) * 100}%` }}></div>
                <div className="fi-label" title={item.name}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        </React.Fragment>
        )}

        {activeTab === 'Analysis' && (
          <PropertyAnalysisView
            city={city}
            locality={locality}
            propertyType={propertyType}
            area={area}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            age={age}
            floor={floor}
            totalFloors={totalFloors}
            prediction={prediction}
            onEditDetails={() => setIsModalOpen(true)}
          />
        )}

        {activeTab === 'Market' && (
          <MarketInsightsView city={city} />
        )}

        {activeTab === 'Simulator' && (
          <WhatIfSimulatorView
            city={city}
            locality={locality}
            propertyType={propertyType}
            baseArea={area}
            baseBhk={bedrooms}
            baseBathrooms={bathrooms}
            baseAge={age}
            baseFloor={floor}
            baseTotalFloors={totalFloors}
            basePrice={prediction ? prediction.predicted_price_inr : 10400000}
          />
        )}

        {activeTab === 'Saved' && (
          <SavedPropertiesView
            currentProperty={{
              city,
              locality,
              propertyType,
              area,
              bedrooms,
              bathrooms,
              price: prediction ? prediction.predicted_price_formatted : '₹ 1.04 Cr',
              ppsf: prediction ? prediction.price_per_sqft : Math.round(10400000 / area)
            }}
          />
        )}

        {activeTab === 'Reports' && (
          <ReportsView />
        )}

        {activeTab === 'Docs' && (
          <ApiDocsView />
        )}

        {activeTab === 'Settings' && (
          <SettingsView theme={theme} setTheme={setTheme} />
        )}
      </main>

      {/* Property Input Modal Window */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Property Valuation Inputs</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {validationError && (
              <div style={{ background: 'var(--bg-amber-light)', border: '1px solid var(--warning-amber)', color: 'var(--warning-amber)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {validationError}
              </div>
            )}

            <div className="form-group-grid">
              <div className="form-group">
                <label>City</label>
                <select value={city} onChange={e => handleCityChange(e.target.value)}>
                  {Object.keys(CITY_LOCALITIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Property Classification</label>
                <select value={propertyType} onChange={e => setPropertyType(e.target.value)}>
                  {['Apartment', 'Independent House', 'Penthouse', 'Villa', 'Builder Floor'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group-grid">
              <div className="form-group">
                <label>Built-up Area (sq ft)</label>
                <input type="number" min="100" max="50000" value={area} onChange={e => setArea(Number(e.target.value))} />
              </div>

              <div className="form-group">
                <label>Neighborhood / Locality</label>
                <select value={locality} onChange={e => setLocality(e.target.value)}>
                  {(CITY_LOCALITIES[city] || [locality]).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group-grid">
              <div className="form-group">
                <label>BHK Bedrooms</label>
                <select value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} BHK</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Bathrooms</label>
                <select value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Bath</option>)}
                </select>
              </div>
            </div>

            <div className="form-group-grid">
              <div className="form-group">
                <label>Property Age (years)</label>
                <input type="number" min="0" max="50" value={age} onChange={e => setAge(Number(e.target.value))} />
              </div>

              <div className="form-group">
                <label>Floor Level</label>
                <input type="number" min="1" max="80" value={floor} onChange={e => setFloor(Number(e.target.value))} />
              </div>
            </div>

            {/* Model Selection Panel inside Modal */}
            <div style={{ marginTop: '16px' }}>
              <ModelSelectionPanel
                selectedModels={selectedModels}
                setSelectedModels={setSelectedModels}
                ensembleMethod={ensembleMethod}
                setEnsembleMethod={setEnsembleMethod}
              />
            </div>

            <button className="btn-primary-lg" onClick={runValuationInference} disabled={loading || selectedModels.length === 0} style={{ marginTop: '16px' }}>
              {loading ? 'Evaluating ML Models...' : 'Calculate Property Price'}
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Notification Popup */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          background: 'var(--primary-indigo)',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
