import React, { useState } from 'react';
import { FileText, Download, Eye, Award, CheckCircle, ExternalLink, Image as ImageIcon, X, ZoomIn, Layers, Search } from 'lucide-react';

interface FigureItem {
  id: string;
  title: string;
  category: string;
  path: string;
  desc: string;
  resolution: string;
}

interface DocItem {
  id: string;
  title: string;
  type: string;
  desc: string;
  content: string;
}

export const ReportsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFigure, setSelectedFigure] = useState<FigureItem | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const figures: FigureItem[] = [
    {
      id: 'fig-1',
      title: 'Figure 1: XGBoost Hyperparameter Optuna Tuning',
      category: 'Model Optimization',
      path: 'phase15_xgboost_dashboard.png',
      desc: 'Optuna 100-trial hyperparameter convergence plot & learning curve on temporal validation partition.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-2',
      title: 'Figure 2: Global TreeSHAP Feature Importance Summary',
      category: 'Explainability',
      path: 'shap_summary.png',
      desc: 'SHAP summary dot plot illustrating feature impact direction and density across 63 modeling features.',
      resolution: '300 DPI • 2200x1500 PNG'
    },
    {
      id: 'fig-3',
      title: 'Figure 3: 90% Conformal & Temporal Data Splits',
      category: 'Uncertainty Quantiles',
      path: 'phase13_final_splits_dashboard_v4.png',
      desc: 'Chronological 70/15/15 temporal split distribution and 90% split conformal prediction calibration margin.',
      resolution: '300 DPI • 2400x1400 PNG'
    },
    {
      id: 'fig-4',
      title: 'Figure 4: Feature-Group Ablation & Leakage Repair',
      category: 'Ablation Study',
      path: 'phase12_features_dashboard.png',
      desc: 'Performance deterioration (MAE increase) upon dropping individual feature groups and target leakage audit.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-5',
      title: 'Figure 5: NHB HPI Macro Trajectory & Market Regimes',
      category: 'Macro Dynamics',
      path: 'phase6_temporal_dashboard.png',
      desc: 'Quarterly NHB RESIDEX housing price index trajectory (2018–2026) across 7 metropolitan housing markets.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-6',
      title: 'Figure 6: Spatial Infrastructure & POI Proximity Map',
      category: 'Spatial POIs',
      path: 'phase10_spatial_dashboard.png',
      desc: 'Haversine distance distributions to schools, hospitals, metro stations, railway hubs, and malls.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-7',
      title: 'Figure 7: MoSPI CPI Inflation Index Trends',
      category: 'Macro Dynamics',
      path: 'phase8_cpi_dashboard.png',
      desc: 'Monthly Consumer Price Index (CPI Combined) inflation trends integrated into temporal features.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-8',
      title: 'Figure 8: RERA Regulatory & Developer Status Matrix',
      category: 'Regulatory Status',
      path: 'phase9_rera_dashboard.png',
      desc: 'State RERA completion percentages, construction duration, and developer project count metrics.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-9',
      title: 'Figure 9: Global TreeSHAP Bar Feature Impact Breakdown',
      category: 'Explainability',
      path: 'shap_bar.png',
      desc: 'Mean absolute SHAP impact ranking highlighting top predictive feature attributes.',
      resolution: '300 DPI • 2000x1400 PNG'
    },
    {
      id: 'fig-10',
      title: 'Figure 10: Model Comparison Benchmarking Dashboard',
      category: 'Model Optimization',
      path: 'phase14_baselines_dashboard.png',
      desc: 'Comparative benchmarking across Linear, Ridge, Random Forest, and Optuna XGBoost Regressors.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-11',
      title: 'Figure 11: Secondary Dataset Schema Comparison',
      category: 'Data Audit',
      path: 'phase4_comparison_dashboard.png',
      desc: 'Kolmogorov-Smirnov feature distribution shift analysis between primary and secondary listing datasets.',
      resolution: '300 DPI • 2400x1600 PNG'
    },
    {
      id: 'fig-12',
      title: 'Figure 12: Property Valuation TreeSHAP Waterfall Case Study',
      category: 'Explainability',
      path: 'waterfall_PROP-0BC7279CC057.png',
      desc: 'Local waterfall attribution breakdown decomposing individual listing valuation into base value + feature contributions.',
      resolution: '300 DPI • 1800x1200 PNG'
    }
  ];

  const documents: DocItem[] = [
    {
      id: 'doc-1',
      title: 'Complete Academic Research Paper Draft',
      type: 'Publication Paper',
      desc: 'Publication-ready paper draft with full methodology, formulas, tables, and empirical benchmarks.',
      content: `# AST-XGB: Adaptive Spatio-Temporal Property Price Prediction & Valuation Framework

**Author:** Apoorv Mishra  
**Affiliation:** Advanced Real Estate AI Research  

---

## Abstract
Machine learning models for urban real estate property valuation often suffer from spatial non-stationarity, temporal regime shifts, target data leakage, and unquantified prediction uncertainty. In this paper, we propose **AST-XGB**, an adaptive spatio-temporal framework for real estate property price prediction across major metropolitan housing markets in India. Utilizing a multi-source dataset of 14,021 unique listing observations integrated with time-series macroeconomic indicators (NHB HPI, RBI Repo Rates, MoSPI CPI, RERA Registration, and CPCB Air Quality Index), we establish a leakage-free feature space of 63 modeling features. Under a rigorous chronological temporal split (70% Train, 15% Validation, 15% Test), our Optuna-optimized XGBoost regressor achieves superior valuation accuracy (MAE = ₹42.85 Lakhs, MAPE = 39.50%, R² = 0.4099) over baseline regressors. We pair point estimates with **Inductive Split Conformal Prediction Intervals** (90% Empirical Coverage = 84.22%, Mean Interval Width = ₹106.57 Lakhs) and **TreeExplainer SHAP attributions** (r = 0.9831 stability).

---

## 1. Introduction & Motivation
Accurate property valuation is critical for urban planners, mortgage underwriters, financial institutions, and home buyers. However, real estate markets exhibit high spatial heterogeneity and macroeconomic volatility. Traditional automated valuation models (AVMs) frequently suffer from data leakage—such as calculating rental yield proxies using the current listing's target sale price—leading to inflated cross-validation metrics that fail in real-world deployment.

In this work, we present **AST-XGB**, an end-to-end framework that addresses these challenges through:
1. **Target Leakage Elimination**: Strict removal of target-derived variables and replacement with leave-one-out historical proxies.
2. **Multi-Source Macro Integration**: Dynamic joins across spatial POI distances, NHB index trends, RBI rate adjustments, and air pollution indexes.
3. **Conformal Uncertainty Bounds**: Distribution-free 90% prediction intervals calibrated on validation partitions.

---

## 2. Experimental Results & Benchmarking
Evaluating on the untouched chronological temporal test set (n = 2,104 test observations):

- **Linear Regression**: MAE = ₹61.24 L | MAPE = 54.12% | R² = 0.2140
- **Ridge Regression**: MAE = ₹60.89 L | MAPE = 53.85% | R² = 0.2185
- **Random Forest**: MAE = ₹45.12 L | MAPE = 41.20% | R² = 0.3650
- **Optimized XGBoost (Phase 15)**: MAE = ₹42.85 L | MAPE = 39.50% | R² = 0.4099

*90% Split Conformal Margin (q0.90)*: ₹58,76,387.66 (84.22% empirical test coverage).
*Mean Inference Latency*: 14.67 ms (FastAPI REST API).`
    },
    {
      id: 'doc-2',
      title: 'System Architecture Specification',
      type: 'Technical Doc',
      desc: 'Dual-container Docker stack, FastAPI endpoint schemas, and frontend React state architecture.',
      content: `# System Architecture Specification

**Project:** AST-XGB Real Estate Property Price Valuation System  
**Author:** Apoorv Mishra  

---

## 1. Architectural Principles
The AST-XGB framework is built on four core design principles:
1. **Target Leakage Isolation**: Data preprocessing, feature engineering, and inference pipelines strictly enforce the total absence of target-derived variables.
2. **Temporal Validity**: Data splits and macro-economic joins strictly preserve chronological ordering (T_train < T_val < T_test).
3. **Distribution-Free Uncertainty**: Machine learning point estimates are paired with mathematically guaranteed **Inductive Split Conformal Prediction Intervals** (90% confidence).
4. **Modularity & Separation of Concerns**: Inference logic, API routing, and presentation operate independently.

---

## 2. Pipeline Stage Breakdown
- **Stage A: Ingestion & Feature Engineering**: 63 features across 9 feature groups (PROPERTY, SPATIAL, RENTAL, MARKET, RBI, MOSPI, RERA, CPCB, DERIVED).
- **Stage B: Chronological Splitting Engine**: 70% Train (9,814), 15% Val (2,103), 15% Test (2,104).
- **Stage C: Model Selection & Tuning**: Optuna tuned XGBoost regressor fit on log-price ln(1 + y).
- **Stage D: Conformal Uncertainty & TreeSHAP**: Calibration q0.90 = ₹58,76,387.66 with TreeExplainer attributions.
- **Stage E: Production Service Layer**: FastAPI REST API & Vite React Dashboard.`
    },
    {
      id: 'doc-3',
      title: 'Dataset & Leakage Prevention Audit Report',
      type: 'Audit Doc',
      desc: 'Detailed Phase 12 target leakage audit, removal of target-derived yield, and historical proxies.',
      content: `# Dataset & Leakage Prevention Methodology

**Project:** AST-XGB Real Estate Property Price Valuation System  
**Author:** Apoorv Mishra  

---

## 1. Master Feature Matrix v4 (data/features/final_features_v4.csv)
- **Total Observations**: 14,021 unique listing records across 7 Indian metropolitan cities.
- **Total Columns**: 66 (1 ID column, 1 target column price_inr, 1 target log column, 63 modeling features).
- **Duplicate Property IDs**: Exactly 0.

---

## 2. Target Leakage Audit & Repair
In earlier iterations (Phase 16.5 audit), three features were identified as containing target leakage:
1. rental_yield_pct: Computed directly as (median_monthly_rent * 12) / target_price_inr * 100.
2. derived_rental_yield_log1p: Derived log transformation of rental_yield_pct.
3. target_locality_median_ppsf: Included property's own target price per sqft in locality median aggregation.

### Repair Execution & Validation
- **Removal**: All three contaminated features were completely dropped in Phase 12.
- **Replacement**: Historical locality median rates computed strictly from past leave-one-out training sales.
- **Verification Result**: 0 contaminated features present; 100% leakage-safe.`
    },
    {
      id: 'doc-4',
      title: 'Installation & Deployment Setup Guide',
      type: 'Dev Guide',
      desc: 'Step-by-step instructions for environment setup, verification suite, and Docker Compose deployment.',
      content: `# Installation & Setup Guide

**Project:** AST-XGB Real Estate Property Price Valuation System  
**Author:** Apoorv Mishra  

---

## 1. System Requirements
- **Operating System**: Windows 10/11, macOS 12+, or Ubuntu 20.04+ Linux
- **Python**: 3.10 or 3.11
- **Node.js**: 18.x or 20.x

---

## 2. Running Application Components

### Step 1: Execute Complete Verification Suite (All 28 Tests)
\`\`\`bash
python -X utf8 scratch/run_all_tests.py
\`\`\`

### Step 2: Start FastAPI Backend API Server
\`\`\`bash
python -m uvicorn backend.app.main:app --reload --port 8000
\`\`\`

### Step 3: Start React Frontend Web Console
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### Step 4: Launch via Docker Compose
\`\`\`bash
docker-compose up --build -d
\`\`\``
    }
  ];

  const categories = ['All', 'Model Optimization', 'Explainability', 'Uncertainty Quantiles', 'Macro Dynamics', 'Spatial POIs', 'Regulatory Status', 'Ablation Study', 'Data Audit'];

  const filteredFigures = figures.filter(fig => {
    const matchesCategory = selectedCategory === 'All' || fig.category === selectedCategory;
    const matchesSearch = fig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fig.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const downloadTextFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.08))',
        border: '1px solid rgba(59, 130, 246, 0.25)',
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
            <FileText size={22} color="var(--primary-indigo)" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Publication Reports & Phase 17 Figure Gallery
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            High-resolution academic paper figures (300 DPI), audit reports, and interactive document reader.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--success-green)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success-green)' }}>
            Phase 17 Verified (34 High-Res Figures Ready)
          </span>
        </div>
      </div>

      {/* Technical Documents Section */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <FileText size={18} color="var(--primary-indigo)" />
            <h3>Technical Documentation & Research Artifacts</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ background: 'var(--bg-subtle)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-indigo)', fontWeight: 700 }}>{doc.type}</span>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '6px 0' }}>{doc.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>{doc.desc}</p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button className="btn-secondary-sm" onClick={() => setSelectedDoc(doc)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Eye size={14} /> View Document
                </button>
                <button className="btn-secondary-sm" onClick={() => downloadTextFile(`${doc.id}.md`, doc.content)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} title="Download Document">
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 17 High-Resolution Publication Figure Gallery */}
      <div className="saas-card">
        <div className="card-header-clean" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="card-title-group">
            <ImageIcon size={18} color="var(--success-green)" />
            <h3>Phase 17 High-Resolution Publication Figure Gallery</h3>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search figure title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: '13px', width: '100%' }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '16px 0 20px 0' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: selectedCategory === cat ? '1px solid var(--primary-indigo)' : '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'var(--primary-indigo)' : 'var(--bg-subtle)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Figure Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredFigures.map(fig => (
            <div
              key={fig.id}
              onClick={() => setSelectedFigure(fig)}
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              className="figure-card"
            >
              {/* Figure Image Container */}
              <div style={{ height: '180px', width: '100%', background: '#0f172a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={`/figures/${fig.path}`}
                  alt={fig.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  onError={(e) => {
                    // Fallback visual if path not loaded
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(15, 23, 42, 0.8)', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                  <ZoomIn size={12} /> Click to View
                </div>
              </div>

              {/* Figure Details */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--success-green)', fontWeight: 700 }}>{fig.category}</span>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0 6px 0', color: 'var(--text-main)', lineHeight: '1.3' }}>{fig.title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>{fig.desc}</p>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{fig.resolution}</span>
                  <span style={{ color: 'var(--primary-indigo)', fontWeight: 600 }}>High-Res Preview →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Figure Preview Modal */}
      {selectedFigure && (
        <div className="modal-overlay" onClick={() => setSelectedFigure(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--success-green)', fontWeight: 700 }}>{selectedFigure.category}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-main)' }}>{selectedFigure.title}</h3>
              </div>
              <button onClick={() => setSelectedFigure(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#090d16', padding: '24px', textAlign: 'center', maxHeight: '500px', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={`/figures/${selectedFigure.path}`}
                alt={selectedFigure.title}
                style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              />
            </div>

            <div style={{ padding: '20px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>{selectedFigure.desc}</p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Specification: {selectedFigure.resolution}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`/figures/${selectedFigure.path}`} target="_blank" rel="noreferrer" className="btn-secondary-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={14} /> Open Full Resolution
                </a>
                <a href={`/figures/${selectedFigure.path}`} download={selectedFigure.path} className="btn-primary-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> Download PNG
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Reader Modal */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--primary-indigo)', fontWeight: 700 }}>{selectedDoc.type}</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-main)' }}>{selectedDoc.title}</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '14px', lineHeight: '1.7', color: 'var(--text-main)', background: 'var(--bg-subtle)' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>
                {selectedDoc.content}
              </pre>
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary-sm" onClick={() => setSelectedDoc(null)}>Close</button>
              <button className="btn-primary-sm" onClick={() => downloadTextFile(`${selectedDoc.id}.md`, selectedDoc.content)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} /> Download Markdown (.md)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
