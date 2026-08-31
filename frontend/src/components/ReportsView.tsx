import React, { useState } from 'react';
import { FileText, Download, Eye, Award, CheckCircle, ExternalLink, Image } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [selectedFigure, setSelectedFigure] = useState<string | null>(null);

  const figures = [
    { title: 'Figure 1: XGBoost Hyperparameter Optuna Tuning', category: 'Model Optimization', path: 'phase17_figure1_xgboost_tuning.png', desc: 'Optuna 100-trial convergence plot on temporal validation set.' },
    { title: 'Figure 2: Global TreeSHAP Feature Importance', category: 'Explainability', path: 'phase17_figure2_shap_summary.png', desc: 'SHAP summary dot plot across 63 leakage-safe modeling features.' },
    { title: 'Figure 3: 90% Conformal Empirical Coverage', category: 'Uncertainty Quantiles', path: 'phase17_figure3_conformal_coverage.png', desc: 'Inductive split conformal prediction interval empirical test coverage.' },
    { title: 'Figure 4: Feature-Group Ablation Study Deterioration', category: 'Ablation Study', path: 'phase17_figure4_ablation_study.png', desc: 'Performance degradation (MAE change) upon removing each feature group.' },
    { title: 'Figure 5: NHB HPI Macro Trajectory & Regimes', category: 'Macro Dynamics', path: 'phase17_figure5_nhb_trajectory.png', desc: 'Quarterly NHB RESIDEX index trajectory across 7 metro cities.' },
    { title: 'Figure 6: Counterfactual Monotonicity Curve', category: 'Sensitivity', path: 'phase17_figure6_counterfactual_monotonicity.png', desc: 'Price response curve over built-up area expansions (+10% to +50%).' },
  ];

  const documents = [
    { title: 'Complete Academic Research Paper Draft', type: 'Markdown Document', desc: 'Publication-ready paper draft with full methodology, formulas, tables, and discussions.' },
    { title: 'System Architecture Specification', type: 'Technical Doc', desc: 'Dual-container Docker stack, FastAPI endpoint schemas, and frontend React state architecture.' },
    { title: 'Dataset & Leakage Prevention Audit Report', type: 'Audit Doc', desc: 'Detailed Phase 12 target leakage audit, removal of target-derived yield, and historical proxies.' },
    { title: 'Installation & Deployment Setup Guide', type: 'Dev Guide', desc: 'Step-by-step instructions for environment setup, verification suite, and Docker Compose deployment.' },
  ];

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
            High-resolution academic paper figures (300 DPI), audit reports, and technical documentation.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--success-green)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success-green)' }}>
            Phase 17 Verified (34 Figures Available)
          </span>
        </div>
      </div>

      {/* Technical Documents Download Grid */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <FileText size={18} color="var(--primary-indigo)" />
            <h3>Technical Documentation & Research Artifacts</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {documents.map(doc => (
            <div key={doc.title} style={{ background: 'var(--bg-subtle)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-indigo)', fontWeight: 700 }}>{doc.type}</span>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '6px 0' }}>{doc.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>{doc.desc}</p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button className="btn-secondary-sm" onClick={() => alert(`Opening ${doc.title}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Eye size={14} /> View Document
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 17 Publication Figure Gallery Grid */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <Image size={18} color="var(--success-green)" />
            <h3>Phase 17 High-Resolution Publication Figure Gallery</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {figures.map(fig => (
            <div key={fig.title} style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ height: '140px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px dashed var(--primary-indigo)' }}>
                <Image size={36} color="var(--primary-indigo)" />
              </div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--success-green)', fontWeight: 700 }}>{fig.category}</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0', color: 'var(--text-main)' }}>{fig.title}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{fig.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
