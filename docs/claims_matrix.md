# Patent Novelty Claims & Invention Disclosure Matrix

## Primary Patent Claims

1. **Claim 1 (Leakage-Safe Temporal Engine)**: A computer-implemented method for property valuation comprising constructing a point-in-time spatio-temporal lookup graph $\mathcal{H}(N, t) = \{ j \mid j \in \text{Neighborhood}(N), \, t - W \le t_j < t \}$, dynamically enforcing temporal non-leakage invariants where historical valuations and spatial rollups exclude any transaction occurring at or after evaluation time $t$.
2. **Claim 2 (GMM Market Regime Softmax Ensemble)**: An adaptive machine learning ensemble system comprising:
   - Extracting a 5-dimensional macroeconomic state vector $z_t = [\Delta P_{3m}(t), \sigma_{\text{price}}(t), V_{\text{trans}}(t), \text{Dispersion}(t), \Delta P_{\text{neighborhood}}(t)]^T$;
   - Unsupervised clustering of state vectors into latent market regimes using a Gaussian Mixture Model (GMM);
   - Dynamically adjusting base estimator weights using a rolling Softmax error-loss function $w_{k,t} = \frac{\exp(-\lambda E_{k,t})}{\sum_{j=1}^K \exp(-\lambda E_{j,t})}$ where $E_{k,t}$ represents rolling 30-day out-of-fold validation error of learner $k$ in regime $r_t$.
3. **Claim 3 (Conformal Counterfactual Decision Support)**: Integrated valuation decision support engine pairing split conformal quantile prediction intervals with constrained local counterfactual perturbation optimization $\Delta \hat{y} = f(x + \Delta x) - f(x)$ subject to domain feasibility bounds $\mathcal{S}_{\text{feasible}}$.
