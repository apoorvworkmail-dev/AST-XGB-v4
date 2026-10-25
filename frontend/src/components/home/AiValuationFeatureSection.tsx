import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Layers,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  BarChart2,
} from 'lucide-react';

export const AiValuationFeatureSection: React.FC = () => {
  return (
    <section className="gd-section">
      <div className="gd-container">
        <div className="gd-ai-showcase-section">
          <div className="gd-container">
            <div className="gd-ai-showcase-grid">
              {/* Left Content */}
              <div className="gd-ai-content">
                <div className="gd-ai-badge">
                  <Sparkles size={14} />
                  <span>The AST-XGB Intelligence Engine</span>
                </div>

                <h3>
                  Beyond Guesswork: Certified Valuation with Conformal Confidence
                </h3>

                <p>
                  Most property portals provide arbitrary price ranges. GharDhundo is powered by the{' '}
                  <strong>AST-XGB Multi-Model Architecture</strong>, trained on thousands of verified transactions across 7 Indian metros to deliver statistically guaranteed 90% price intervals.
                </p>

                {/* 4 Architectural Pillars */}
                <div className="gd-ai-pillars">
                  <div className="gd-pillar-card">
                    <h5>
                      <ShieldCheck size={16} color="#38bdf8" />
                      <span>Conformal Bands</span>
                    </h5>
                    <p>
                      Mathematically valid 90% confidence lower and upper bounds for bulletproof negotiation clarity.
                    </p>
                  </div>

                  <div className="gd-pillar-card">
                    <h5>
                      <Layers size={16} color="#a855f7" />
                      <span>7-Model Ensemble</span>
                    </h5>
                    <p>
                      Real-time consensus across XGBoost, LightGBM, CatBoost, Random Forest, and Deep MLP models.
                    </p>
                  </div>

                  <div className="gd-pillar-card">
                    <h5>
                      <Activity size={16} color="#34d399" />
                      <span>GMM Regime Classifier</span>
                    </h5>
                    <p>
                      Gaussian Mixture Models dynamically classify macro volatility (Stable, Growth, Cooling, Shock).
                    </p>
                  </div>

                  <div className="gd-pillar-card">
                    <h5>
                      <BarChart2 size={16} color="#f472b6" />
                      <span>SHAP Explainability</span>
                    </h5>
                    <p>
                      Game-theoretic feature attribution exposing exact price contributions for floor, age, and location.
                    </p>
                  </div>
                </div>

                {/* Launch CTA Button */}
                <Link to="/ai-valuation" className="gd-btn-ai-launch">
                  <Sparkles size={16} />
                  <span>Launch AI Valuation Studio</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Right Interactive Preview Card */}
              <div className="gd-ai-interactive-preview">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#c7d2fe', letterSpacing: '0.05em' }}>
                    Live Model Output Simulation
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
                    Active Regime: Growth
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Bengaluru • Whitefield • 3 BHK (1,850 sq.ft)
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>
                    ₹ 1.45 Cr
                  </div>
                  <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>
                    ₹ 7,837 / sq.ft • Inference Latency: 12.4ms
                  </div>
                </div>

                {/* Conformal 90% Visual Band */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '6px' }}>
                    <span>90% Conformal Band:</span>
                    <strong style={{ color: '#38bdf8' }}>₹ 1.34 Cr — ₹ 1.58 Cr</strong>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '25%', right: '20%', height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '999px' }} />
                  </div>
                </div>

                {/* Multi-model consensus bar */}
                <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Multi-Model Consensus:</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>High (Spread: 4.8%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
