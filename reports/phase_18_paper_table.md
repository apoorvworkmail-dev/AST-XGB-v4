# Phase 18 — Paper-Ready Feature-Group Ablation Table
**System:** AST-XGB India Property Valuation Pipeline  

| Feature Configuration | Features | Test MAE (INR) | Test RMSE (INR) | $R^2$ Score | MAPE (%) |
|---|---|---|---|---|---|
| Full Model (All 9 Groups) | 63 | ₹4,265,419.5 | ₹14,222,156.66 | 0.4099 | 39.5% |
| PROPERTY | 15 | ₹4,353,026.0 | ₹14,706,809.35 | 0.369 | 42.72% |
| PROPERTY + SPATIAL | 23 | ₹4,270,049.0 | ₹14,444,869.07 | 0.3913 | 42.3% |
| PROPERTY + SPATIAL + RENTAL | 30 | ₹4,195,831.5 | ₹14,232,829.7 | 0.409 | 41.27% |
| PROPERTY + SPATIAL + RENTAL + MARKET | 35 | ₹4,262,150.0 | ₹14,298,084.68 | 0.4036 | 40.79% |
| PROPERTY + SPATIAL + RENTAL + MARKET + RBI | 42 | ₹4,225,388.0 | ₹14,152,623.65 | 0.4157 | 40.69% |
| PROPERTY + SPATIAL + RENTAL + MARKET + RBI + MOSPI | 45 | ₹4,238,191.0 | ₹14,224,890.83 | 0.4097 | 40.47% |
| PROPERTY + SPATIAL + RENTAL + MARKET + RBI + MOSPI + RERA | 52 | ₹4,250,297.5 | ₹14,105,855.09 | 0.4195 | 42.35% |
| PROPERTY + SPATIAL + RENTAL + MARKET + RBI + MOSPI + RERA + CPCB | 57 | ₹4,271,824.5 | ₹14,374,518.53 | 0.3972 | 40.78% |
| PROPERTY + SPATIAL + RENTAL + MARKET + RBI + MOSPI + RERA + CPCB + DERIVED | 63 | ₹4,265,419.5 | ₹14,222,156.66 | 0.4099 | 39.5% |
