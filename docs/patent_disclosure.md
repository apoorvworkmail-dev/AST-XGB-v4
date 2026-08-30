# Patent Technical Disclosure: AST-XGB Valuation System

**Title**: Adaptive Spatio-Temporal and Explainable XGBoost Framework for AI-Driven Real Estate Property Valuation
**Inventor**: Apoorv Mishra

## Executive Summary
Conventional automated valuation models (AVMs) suffer from accuracy degradation during market regime shifts due to static model assumptions, spatial-temporal data leakage, and uncalibrated point estimates. The AST-XGB system introduces a novel closed-loop market state evaluation framework that dynamically re-weights diverse gradient-boosted ensembles based on real-time validation performance in GMM-clustered market regimes, integrated with split conformal prediction intervals and physical counterfactual sensitivity operators.

## Technical Architecture & Detailed Description
1. **Spatio-Temporal Graph Isolation**: Ensures strict temporal ordering for all historical spatial rollups and dynamic distance-decay comparable property computations.
2. **GMM Macro Regime Extraction**: Formulates a continuous 5D momentum vector $z_t$ evaluating 3-month price deltas, local volatility, transaction velocity, price dispersion, and neighborhood trend shifts.
3. **Dynamic Softmax Re-weighting**: Applies an exponential loss penalty function to assign higher weights to estimators demonstrating lower empirical loss in the currently active regime.
4. **Conformal Uncertainty & Counterfactual Operator**: Integrates distribution-free split conformal calibration providing exact 90% confidence bounds, paired with constrained localized feature perturbation optimization.
