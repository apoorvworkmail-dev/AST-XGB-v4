import React from 'react';
import { Cpu, CheckSquare, Square, Zap, Sliders, AlertTriangle } from 'lucide-react';

export interface ModelOption {
  key: string;
  name: string;
  category: string;
  description: string;
  isBenchmark?: boolean;
}

export const ALL_MODELS: ModelOption[] = [
  { key: 'xgboost', name: 'XGBoost', category: 'Gradient Boosted Trees', description: 'Optuna-tuned extreme gradient boosting baseline (Phase 15 Reference)', isBenchmark: true },
  { key: 'lightgbm', name: 'LightGBM', category: 'Gradient Boosted Trees', description: 'Lightweight leaf-wise histogram tree booster' },
  { key: 'catboost', name: 'CatBoost', category: 'Gradient Boosted Trees', description: 'Symmetric decision tree ensemble with categorical encoding' },
  { key: 'random_forest', name: 'Random Forest', category: 'Bagged Trees', description: 'Parallelized random decision forest (100 trees)' },
  { key: 'gradient_boosting', name: 'Gradient Boosting', category: 'Gradient Boosted Trees', description: 'Sequential stage-wise additive gradient boosting' },
  { key: 'linear_regression', name: 'Linear Regression', category: 'Parametric Linear', description: 'Ordinary Least Squares linear hyperplane baseline' },
  { key: 'mlp', name: 'MLP (Neural Net)', category: 'Deep Learning', description: 'Multi-Layer Perceptron neural network (64, 32 hidden layers)' }
];

interface ModelSelectionPanelProps {
  selectedModels: string[];
  setSelectedModels: (models: string[]) => void;
  ensembleMethod: string;
  setEnsembleMethod: (method: string) => void;
}

export const ModelSelectionPanel: React.FC<ModelSelectionPanelProps> = ({
  selectedModels,
  setSelectedModels,
  ensembleMethod,
  setEnsembleMethod
}) => {
  const toggleModel = (key: string) => {
    if (selectedModels.includes(key)) {
      setSelectedModels(selectedModels.filter(m => m !== key));
    } else {
      setSelectedModels([...selectedModels, key]);
    }
  };

  const selectAll = () => {
    setSelectedModels(ALL_MODELS.map(m => m.key));
  };

  const clearAll = () => {
    setSelectedModels([]);
  };

  return (
    <div className="saas-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={20} color="var(--primary-indigo)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Select Machine Learning Models
          </h3>
          <span style={{ background: 'var(--primary-indigo)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
            Selected: {selectedModels.length} of 7
          </span>
        </div>

        {/* Quick Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={selectAll}
            className="btn-secondary-sm"
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="btn-secondary-sm"
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={selectAll}
            style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Compare All 7 Models
          </button>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {ALL_MODELS.map(model => {
          const isSelected = selectedModels.includes(model.key);
          return (
            <div
              key={model.key}
              onClick={() => toggleModel(model.key)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: isSelected ? '2px solid var(--primary-indigo)' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'var(--bg-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <div style={{ marginTop: '2px', color: isSelected ? 'var(--primary-indigo)' : 'var(--text-muted)' }}>
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{model.name}</span>
                  {model.isBenchmark && (
                    <span style={{ fontSize: '9px', background: 'var(--warning-amber)', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      REF
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--primary-indigo)', fontWeight: 600, display: 'block', margin: '2px 0' }}>
                  {model.category}
                </span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.3' }}>
                  {model.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zero Selection Validation Warning */}
      {selectedModels.length === 0 && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--error-red)', color: 'var(--error-red)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertTriangle size={16} />
          Please select at least 1 machine learning model to execute valuation inference.
        </div>
      )}

      {/* Ensemble Strategy Settings */}
      {selectedModels.length > 1 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--success-green)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              Ensemble Aggregation Strategy:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="ensemble_method"
                value="equal_weight"
                checked={ensembleMethod === 'equal_weight'}
                onChange={() => setEnsembleMethod('equal_weight')}
              />
              Equal Weight (Arithmetic Mean)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="ensemble_method"
                value="performance_weighted"
                checked={ensembleMethod === 'performance_weighted'}
                onChange={() => setEnsembleMethod('performance_weighted')}
              />
              Performance Weighted (Inverse RMSE)
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
