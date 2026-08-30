"""
Master Comprehensive Application Verification Suite (Phases 1 - 26)
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra

Executes all verification and test suites:
  1. Phase 1-20 Dataset, Model & Pipeline Freeze Verification
  2. Phase 21 Production Inference Pipeline Unit Tests
  3. Phase 22 FastAPI Backend API Integration Tests
  4. Phase 24 End-to-End Frontend-to-Backend-to-ML Integration Tests
  5. Phase 25 Security, Performance (100-request benchmark), & ML Safety Audit
  6. Phase 26 Production Deployment Configuration & Build Audit
"""

import sys, os, time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from scratch.verify_phase_1_to_20 import audit_passed as p1_20_pass
from tests.test_phase21_inference import run_all_tests as run_p21
from tests.test_phase22_backend_api import run_all_backend_tests as run_p22
from tests.test_phase24_integration import run_all_integration_tests as run_p24
from tests.test_phase25_audit import run_all_phase25_audits as run_p25
from tests.test_phase26_deployment import run_all_phase26_tests as run_p26

def main():
    print("=" * 80)
    print("      AST-XGB MASTER APPLICATION HEALTH & INTEGRATION AUDIT (PHASES 1-26)")
    print("=" * 80)
    
    t0 = time.time()
    
    # 1. Pipeline Freeze Verification
    print("\n>>> STAGE 1: Phase 1-20 Pipeline & Model Freeze Verification")
    if not p1_20_pass:
        print("❌ STAGE 1 FAILED")
        sys.exit(1)
        
    # 2. Phase 21 Inference Pipeline
    print("\n>>> STAGE 2: Phase 21 Production Inference Pipeline Unit Tests")
    run_p21()
    
    # 3. Phase 22 Backend API
    print("\n>>> STAGE 3: Phase 22 FastAPI Backend API Integration Tests")
    run_p22()
    
    # 4. Phase 24 Full Integration
    print("\n>>> STAGE 4: Phase 24 Frontend-to-Backend-to-ML Integration Tests")
    run_p24()
    
    # 5. Phase 25 Security & Performance Audit
    print("\n>>> STAGE 5: Phase 25 Security, Performance, & ML Safety Audit")
    run_p25()
    
    # 6. Phase 26 Deployment Audit
    print("\n>>> STAGE 6: Phase 26 Production Deployment Audit")
    run_p26()
    
    elapsed = time.time() - t0
    
    print("\n" + "=" * 80)
    print(f"MASTER APPLICATION AUDIT COMPLETED IN {elapsed:.2f} SECONDS")
    print("FINAL APPLICATION STATUS: 100% OPERATIONAL & VERIFIED  ✅")
    print("=================================================" + "=" * 31)

if __name__ == '__main__':
    main()
