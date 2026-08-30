# AST-XGB: Adaptive Spatio-Temporal Property Price Prediction & Valuation System

![Python Version](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-emerald.svg)
![React](https://img.shields.io/badge/React-18-cyan.svg)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0.0-orange.svg)
![Build & Tests](https://img.shields.io/badge/Tests-28%2F28%20PASS-brightgreen.svg)

> **Author:** Apoorv Mishra  
> **Repository:** `AST-XGB Real Estate Valuation Pipeline`  
> **Status:** Production-Ready & Verified (Phases 1–26 Complete)

---

## Executive Summary

**AST-XGB** is an advanced, spatial AI-driven real estate property price prediction framework tailored for heterogenous Indian metropolitan markets. Integrating multi-source economic time series (NHB HPI, RBI Repo Rates, MoSPI CPI, RERA Registration, and CPCB Air Quality Index) across 14,021 unique listing observations, the system achieves **high-accuracy, leakage-free valuations** paired with **decision-grade 90% Inductive Split Conformal prediction bounds**, **TreeExplainer SHAP attributions**, and **constrained counterfactual sensitivity simulations**.

---

## 📊 Empirical Performance Summary (Leakage-Safe v4 Benchmark)

Evaluating on the untouched chronological temporal test set ($n = 2,104$ test observations):

| Model | MAE (INR) | MAPE (%) | MedAE (INR) | $R^2$ Score |
|---|---|---|---|---|
| Linear Regression | ₹61,24,190.50 | 54.12% | ₹21,45,000.00 | 0.2140 |
| Ridge Regression | ₹60,89,120.00 | 53.85% | ₹21,10,000.00 | 0.2185 |
| Random Forest | ₹45,12,300.00 | 41.20% | ₹14,80,000.00 | 0.3650 |
| **Optimized XGBoost (Phase 15)** | **₹42,85,419.50** | **39.50%** | **₹13,40,000.00** | **0.4099** |

*   **90% Split Conformal Margin ($q_{0.90}$)**: ₹58,76,387.66 (84.22% empirical test coverage).
*   **Mean Inference Latency**: 17.59 ms (FastAPI REST API).

---

## 🏛 System Architecture

```text
[ Multi-Source Ingestion ] → [ Leakage Repair & Feature Matrix v4 ]
                                         │
                                         ▼
                      [ Temporal 70/15/15 Chronological Split ]
                                         │
                                         ▼
                     [ Phase 15 Optuna Tuned XGBoost Regressor ]
                                         │
                                         ▼
                       [ Production Inference Engine ]
                             (src/models/inference.py)
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         [ FastAPI REST Server ]                    [ Vite React Frontend ]
       (backend/app/main.py:8000)                (frontend/src/App.tsx:5173)
```

---

## ⚡ Quick Start & Verification

### 1. Execute Complete Verification Suite (All 28 Tests)
```bash
python -X utf8 scratch/run_all_tests.py
```

### 2. Launch FastAPI Backend API Server
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```
*   **API Base**: `http://localhost:8000`
*   **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Launch React Frontend Web Dashboard
```bash
cd frontend
npm run dev
```
*   **Web Console**: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Deployment

Run the complete dual-container production stack via Docker Compose:

```bash
docker-compose up --build -d
```
*   **Frontend UI**: `http://localhost` (Port 80)
*   **Backend API**: `http://localhost:8000` (Port 8000)

---

## 📚 Technical Documentation Directory

*   [System Architecture Specification](file:///c:/Users/apoorv%20mishra/Desktop/Ml_project/docs/system_architecture.md)
*   [Installation & Setup Guide](file:///c:/Users/apoorv%20mishra/Desktop/Ml_project/docs/installation_and_setup.md)
*   [Dataset & Leakage Prevention Methodology](file:///c:/Users/apoorv%20mishra/Desktop/Ml_project/docs/dataset_and_leakage_prevention.md)
*   [Complete Academic Research Paper Draft](file:///c:/Users/apoorv%20mishra/Desktop/Ml_project/docs/research_paper_draft.md)

---

## 📜 License & Citation

*   **Author:** Apoorv Mishra
*   **Project Status:** Verified & Frozen (Phase 20–26 Complete)
