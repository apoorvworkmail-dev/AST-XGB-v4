# Phase 19 — Conformal Prediction Methodology
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  

---

## 1. Mathematical Formulation

Let $\mathcal{D}_{\text{cal}} = \{(x_i, y_i)\}_{i=1}^n$ denote the calibration dataset (`final_temporal_val_v4.csv`, $n = 2,103$) and $\hat{f}(x)$ denote the fixed base predictor (Optimized XGBoost v4 fit on training data).

### Nonconformity Score
For each calibration property $i$, we define the absolute residual nonconformity score on the native INR scale:
$$s_i = |y_i - \hat{f}(x_i)|$$

### Conformal Quantile
For a target error rate $\alpha \in (0, 1)$ corresponding to nominal coverage $1 - \alpha$, the finite-sample conformal quantile $q_{1-\alpha}$ is computed as:
$$q_{1-\alpha} = \text{Quantile}\left(s_1, \dots, s_n; \frac{\lceil(n+1)(1-\alpha)\rceil}{n}\right)$$

### Prediction Interval Construction
For a test property $x_{n+1}$ with point prediction $\hat{y}_{n+1} = \hat{f}(x_{n+1})$, the $1-\alpha$ prediction interval is:
$$C(x_{n+1}) = \left[ \max(0, \hat{y}_{n+1} - q_{1-\alpha}), \; \hat{y}_{n+1} + q_{1-\alpha} \right]$$

---

## 2. Proper Interval Scoring (Winkler Score)

To penalize both interval width and coverage violations, we calculate the Winkler Interval Score:
$$IS_\alpha = (U - L) + \frac{2}{\alpha}(L - y)\mathbb{I}(y < L) + \frac{2}{\alpha}(y - U)\mathbb{I}(y > U)$$
where $L$ is the lower bound, $U$ is the upper bound, and $\mathbb{I}(\cdot)$ is the indicator function. Lower scores indicate superior sharpness and calibration.
