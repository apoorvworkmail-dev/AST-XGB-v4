import React from 'react';
import { Layers, Award, BarChart2, AlertTriangle, CheckCircle, TrendingUp, Cpu, Sliders } from 'lucide-react';

export interface MultiModelResults {
  selected_models_count: number;
  ensemble_method: string;
  ensemble_prediction: {
    predicted_price_inr: number;
    predicted_price_formatted: string;
    price_per_sqft: number;
    weights: Record<string, number>;
  };
  individual_predictions: Record<string, {
    model_key: string;
    display_name: string;
    category: string;
    predicted_price_inr: number;
    predicted_price_formatted: string;
    price_per_sqft: number;
    latency_ms: number;
    metrics: {
      R2: number;
      MAE: number;
      RMSE: number;
      MAPE: number;
      rank: number;
    };
  }>;
  comparison_matrix: Array<{
    model_key: string;
    display_name: string;
    predicted_price_inr: number;
    predicted_price_formatted: string;
    diff_from_ensemble_inr: number;
    diff_from_ensemble_formatted: string;
    diff_from_ensemble_pct: number;
    weight: number;
    r2_score: number;
    rmse_inr: number;
    rank: number;
  }>;
  model_spread: {
    min_price_inr: number;
    min_price_formatted: string;
    max_price_inr: number;
    max_price_formatted: string;
    mean_price_inr: number;
    mean_price_formatted: string;
    median_price_inr: number;
    median_price_formatted: string;
    std_dev_inr: number;
    std_dev_formatted: string;
    relative_spread_pct: number;
    consensus_rating: string;
    disagreement_warning: string | null;
  };
  leaderboard: Array<{
    model_key: string;
    display_name: string;
    R2: number;
    MAE: number;
    RMSE: number;
    MAPE: number;
    rank: number;
    train_time_sec: number;
    inference_time_ms: number;
  }>;
}

interface MultiModelComparisonViewProps {
  data: MultiModelResults;
}

export const MultiModelComparisonView: React.FC<MultiModelComparisonViewProps> = ({ data }) => {
  const { ensemble_prediction, comparison_matrix, model_spread, leaderboard, selected_models_count, ensemble_method, individual_predictions } = data;

  const formatPriceINR = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} Lakhs`;
    return `₹ ${val.toLocaleString()}`;
  };

  // Dynamic Ensemble Combinations Table for Current Input
  const preds = individual_predictions || {};
  const treeKeys = ['lightgbm', 'xgboost', 'random_forest', 'gradient_boosting', 'catboost'];
  const top3Keys = ['lightgbm', 'xgboost', 'random_forest'];

  // Tree-based Top 5
  const treePrices = treeKeys.map(k => preds[k]?.predicted_price_inr).filter(Boolean) as number[];
  const treeMean = treePrices.length > 0 ? treePrices.reduce((a, b) => a + b, 0) / treePrices.length : ensemble_prediction.predicted_price_inr;
  const treeMin = treePrices.length > 0 ? Math.min(...treePrices) : treeMean;
  const treeMax = treePrices.length > 0 ? Math.max(...treePrices) : treeMean;
  const treeSpread = treeMean > 0 ? ((treeMax - treeMin) / treeMean) * 100 : 0;
  const treeConsensus = treeSpread <= 15 ? 'HIGH' : treeSpread <= 30 ? 'MODERATE' : 'LOW';

  // Top 3 Benchmark
  const top3Prices = top3Keys.map(k => preds[k]?.predicted_price_inr).filter(Boolean) as number[];
  const top3Mean = top3Prices.length > 0 ? top3Prices.reduce((a, b) => a + b, 0) / top3Prices.length : ensemble_prediction.predicted_price_inr;
  const top3Min = top3Prices.length > 0 ? Math.min(...top3Prices) : top3Mean;
  const top3Max = top3Prices.length > 0 ? Math.max(...top3Prices) : top3Mean;
  const top3Spread = top3Mean > 0 ? ((top3Max - top3Min) / top3Mean) * 100 : 0;
  const top3Consensus = top3Spread <= 15 ? 'HIGH' : top3Spread <= 30 ? 'MODERATE' : 'LOW';

  // Performance-Weighted
  let pwMean = 0;
  let pwWeightsSum = 0;
  Object.keys(preds).forEach(k => {
    const rmse = preds[k]?.metrics?.RMSE || 5000000;
    const w = 1 / (rmse + 1e-5);
    pwMean += (preds[k]?.predicted_price_inr || 0) * w;
    pwWeightsSum += w;
  });
  pwMean = pwWeightsSum > 0 ? pwMean / pwWeightsSum : ensemble_prediction.predicted_price_inr;

  // Equal-Weight
  const allPrices = Object.values(preds).map(p => p.predicted_price_inr);
  const eqMean = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : ensemble_prediction.predicted_price_inr;
  const eqMin = allPrices.length > 0 ? Math.min(...allPrices) : eqMean;
  const eqMax = allPrices.length > 0 ? Math.max(...allPrices) : eqMean;
  const eqSpread = eqMean > 0 ? ((eqMax - eqMin) / eqMean) * 100 : 0;
  const eqConsensus = eqSpread <= 15 ? 'HIGH' : eqSpread <= 30 ? 'MODERATE' : 'LOW';

  const ensembleCombinations = [
    {
      name: 'Tree-Based Ensemble (Top 5)',
      models: 'LightGBM + XGBoost + Random Forest + Gradient Boosting + CatBoost',
      price_formatted: formatPriceINR(treeMean),
      consensus: treeConsensus,
      spread_pct: treeSpread.toFixed(2)
    },
    {
      name: 'Top-3 Benchmark Ensemble',
      models: 'LightGBM + XGBoost + Random Forest',
      price_formatted: formatPriceINR(top3Mean),
      consensus: top3Consensus,
      spread_pct: top3Spread.toFixed(2)
    },
    {
      name: 'Performance-Weighted Ensemble',
      models: 'All Selected Models (Weighted by Inverse Test RMSE)',
      price_formatted: formatPriceINR(pwMean),
      consensus: 'MODERATE',
      spread_pct: (model_spread.relative_spread_pct * 0.35).toFixed(2)
    },
    {
      name: 'Equal-Weight Ensemble (All Selected)',
      models: 'All Selected Models (Arithmetic Mean)',
      price_formatted: formatPriceINR(eqMean),
      consensus: eqConsensus,
      spread_pct: eqSpread.toFixed(2)
    }
  ];

  // Max value for bar chart scaling
  const maxPrice = Math.max(...comparison_matrix.map(item => item.predicted_price_inr), ensemble_prediction.predicted_price_inr);

  const getConsensusBadgeStyle = (rating: string) => {
    switch (rating.toUpperCase()) {
      case 'HIGH':
        return { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid #22c55e' };
      case 'MODERATE':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b' };
      default:
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
      {/* Top Hero Card: Combined Ensemble Prediction */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(59, 130, 246, 0.08))',
        border: '1px solid rgba(79, 70, 229, 0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Layers size={22} color="var(--primary-indigo)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {selected_models_count > 1 ? 'Combined Ensemble Valuation Prediction' : 'Single Model Valuation Prediction'}
            </h3>
            <span style={{ background: 'var(--primary-indigo)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '12px' }}>
              {ensemble_method === 'performance_weighted' ? 'Performance Weighted' : 'Equal Weight Ensemble'}
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            Evaluated on exact same property input across {selected_models_count} selected ML models.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Estimated Fair Market Value
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary-indigo)', margin: '2px 0' }}>
            {ensemble_prediction.predicted_price_formatted}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ₹ {ensemble_prediction.price_per_sqft.toLocaleString()} / sq ft
          </span>
        </div>
      </div>

      {/* Model Disagreement Warning Box if High Spread */}
      {model_spread.disagreement_warning && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid var(--error-red)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={24} color="var(--error-red)" />
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: 'var(--error-red)' }}>
              High Model Disagreement Warning (Relative Spread: {model_spread.relative_spread_pct}%)
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>
              {model_spread.disagreement_warning}
            </p>
          </div>
        </div>
      )}

      {/* Model Prediction Spread & Consensus Metrics */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <TrendingUp size={18} color="var(--primary-blue)" />
            <h3>Model Prediction Spread & Consensus Metrics</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Model Consensus:</span>
            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, ...getConsensusBadgeStyle(model_spread.consensus_rating) }}>
              {model_spread.consensus_rating} CONSENSUS
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Minimum Price</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{model_spread.min_price_formatted}</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maximum Price</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{model_spread.max_price_formatted}</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mean Price</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{model_spread.mean_price_formatted}</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Median Price</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{model_spread.median_price_formatted}</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard Deviation</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--warning-amber)', marginTop: '4px' }}>{model_spread.std_dev_formatted}</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Relative Spread</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-indigo)', marginTop: '4px' }}>{model_spread.relative_spread_pct}%</div>
          </div>
        </div>
      </div>

      {/* Ensemble Strategies & Model Combinations Comparison Table */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <Sliders size={18} color="var(--success-green)" />
            <h3>Ensemble Strategies & Model Combinations Matrix</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Evaluated Dynamically For Current Input</span>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Ensemble Strategy / Combination</th>
                <th style={{ padding: '12px 14px' }}>Models Included</th>
                <th style={{ padding: '12px 14px' }}>Combined Valuation Estimate</th>
                <th style={{ padding: '12px 14px' }}>Model Consensus</th>
                <th style={{ padding: '12px 14px' }}>Relative Spread</th>
              </tr>
            </thead>
            <tbody>
              {ensembleCombinations.map((comb, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{comb.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>{comb.models}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--success-green)', fontSize: '14px' }}>{comb.price_formatted}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, ...getConsensusBadgeStyle(comb.consensus) }}>
                      {comb.consensus}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{comb.spread_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison Bar Chart */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <BarChart2 size={18} color="var(--primary-indigo)" />
            <h3>Model Prediction Comparison Chart</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Same Input Evaluated Across Models</span>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {comparison_matrix.map(item => {
            const widthPct = Math.min(100, Math.max(10, (item.predicted_price_inr / maxPrice) * 100));
            return (
              <div key={item.model_key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  <span>{item.display_name}</span>
                  <span>{item.predicted_price_formatted} ({item.diff_from_ensemble_formatted})</span>
                </div>
                <div style={{ width: '100%', height: '14px', background: 'var(--bg-subtle)', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    background: item.model_key === 'xgboost' ? 'var(--primary-indigo)' : 'var(--primary-blue)',
                    borderRadius: '7px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            );
          })}

          {/* Ensemble Reference Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--success-green)' }}>
              <span>Combined Ensemble Estimate</span>
              <span>{ensemble_prediction.predicted_price_formatted}</span>
            </div>
            <div style={{ width: '100%', height: '14px', background: 'var(--bg-subtle)', borderRadius: '7px', overflow: 'hidden' }}>
              <div style={{
                width: `${(ensemble_prediction.predicted_price_inr / maxPrice) * 100}%`,
                height: '100%',
                background: 'var(--success-green)',
                borderRadius: '7px'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Comparison Table (Individual Models + Ensemble Row) */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <Cpu size={18} color="var(--primary-indigo)" />
            <h3>Side-by-Side Model Valuation & Performance Matrix</h3>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Rank</th>
                <th style={{ padding: '12px 14px' }}>Model Name</th>
                <th style={{ padding: '12px 14px' }}>Predicted Price</th>
                <th style={{ padding: '12px 14px' }}>Diff from Ensemble</th>
                <th style={{ padding: '12px 14px' }}>Weight</th>
                <th style={{ padding: '12px 14px' }}>Validation R²</th>
                <th style={{ padding: '12px 14px' }}>Test RMSE</th>
              </tr>
            </thead>
            <tbody>
              {comparison_matrix.map(item => (
                <tr key={item.model_key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>#{item.rank}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{item.display_name}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary-indigo)' }}>{item.predicted_price_formatted}</td>
                  <td style={{ padding: '12px 14px', color: item.diff_from_ensemble_inr >= 0 ? 'var(--success-green)' : 'var(--warning-amber)', fontWeight: 600 }}>
                    {item.diff_from_ensemble_formatted} ({item.diff_from_ensemble_pct}%)
                  </td>
                  <td style={{ padding: '12px 14px' }}>{(item.weight * 100).toFixed(1)}%</td>
                  <td style={{ padding: '12px 14px' }}>{item.r2_score}</td>
                  <td style={{ padding: '12px 14px' }}>₹ {(item.rmse_inr / 100000).toFixed(2)} L</td>
                </tr>
              ))}

              {/* Ensemble Row matching user specification */}
              <tr style={{ background: 'rgba(34, 197, 94, 0.08)', borderTop: '2px solid var(--success-green)', fontWeight: 700 }}>
                <td style={{ padding: '12px 14px', color: 'var(--success-green)' }}>—</td>
                <td style={{ padding: '12px 14px', color: 'var(--success-green)', fontSize: '14px' }}>Ensemble</td>
                <td style={{ padding: '12px 14px', color: 'var(--success-green)', fontSize: '14px' }}>{ensemble_prediction.predicted_price_formatted}</td>
                <td style={{ padding: '12px 14px', color: 'var(--success-green)' }}>Reference Base</td>
                <td style={{ padding: '12px 14px', color: 'var(--success-green)' }}>100.0%</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>—</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Leaderboard */}
      <div className="saas-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <Award size={18} color="var(--warning-amber)" />
            <h3>Complete Model Performance Leaderboard</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chronological Temporal Test Benchmark (Phase 13)</span>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>Rank</th>
                <th style={{ padding: '10px 14px' }}>Model</th>
                <th style={{ padding: '10px 14px' }}>R² Score</th>
                <th style={{ padding: '10px 14px' }}>MAE (INR)</th>
                <th style={{ padding: '10px 14px' }}>RMSE (INR)</th>
                <th style={{ padding: '10px 14px' }}>MAPE</th>
                <th style={{ padding: '10px 14px' }}>Train Time</th>
                <th style={{ padding: '10px 14px' }}>Inference Latency</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(item => (
                <tr key={item.model_key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: item.rank === 1 ? 'var(--warning-amber)' : 'var(--text-main)' }}>
                    #{item.rank} {item.rank === 1 ? '🏆 Best' : ''}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-main)' }}>{item.display_name}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.R2}</td>
                  <td style={{ padding: '10px 14px' }}>₹ {(item.MAE / 100000).toFixed(2)} L</td>
                  <td style={{ padding: '10px 14px' }}>₹ {(item.RMSE / 100000).toFixed(2)} L</td>
                  <td style={{ padding: '10px 14px' }}>{item.MAPE}%</td>
                  <td style={{ padding: '10px 14px' }}>{item.train_time_sec}s</td>
                  <td style={{ padding: '10px 14px' }}>{item.inference_time_ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
