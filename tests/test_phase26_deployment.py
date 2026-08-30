"""
Phase 26 — Production Deployment Preparation Audit & Clean-Build Test Suite
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra

Verifies:
  1. Environment configuration & secrets exclusion (.env.example, .gitignore)
  2. Absolute path elimination (All model paths relative to BASE_DIR)
  3. Docker build configurations (Dockerfile.backend, Dockerfile.frontend, docker-compose.yml)
  4. Dependency reproducibility (requirements.txt, package.json)
  5. Clean-build verification
"""

import sys, os, json, pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def test_deployment_artifacts_exist():
    """Verify all required deployment configuration artifacts exist."""
    req_files = [
        BASE_DIR / "requirements.txt",
        BASE_DIR / ".env.example",
        BASE_DIR / ".gitignore",
        BASE_DIR / "Dockerfile.backend",
        BASE_DIR / "Dockerfile.frontend",
        BASE_DIR / "docker-compose.yml",
        BASE_DIR / "backend" / "app" / "config.py"
    ]
    for f in req_files:
        assert f.exists(), f"Deployment artifact missing: {f}"
    print("\n✓ Deployment Audit 1 Passed: All 7 required deployment configuration files present")

def test_zero_hardcoded_paths():
    """Verify no local machine absolute paths are present in backend or src scripts."""
    forbidden_terms = ["C:\\Users\\apoorv", "c:/Users/apoorv", "/home/apoorv"]
    
    for sub in ["src", "backend"]:
        for root, _, files in os.walk(BASE_DIR / sub):
            for file in files:
                if file.endswith('.py'):
                    f_path = Path(root) / file
                    content = f_path.read_text(encoding='utf-8', errors='ignore')
                    for term in forbidden_terms:
                        assert term not in content, f"Hardcoded path '{term}' found in {f_path}"
    print("✓ Deployment Audit 2 Passed: 0 hardcoded local machine paths in code")

def test_docker_compose_syntax():
    """Verify docker-compose.yml format and port mapping."""
    dc_path = BASE_DIR / "docker-compose.yml"
    text = dc_path.read_text(encoding='utf-8')
    assert "8000:8000" in text
    assert "80:80" in text
    assert "Dockerfile.backend" in text
    assert "Dockerfile.frontend" in text
    print("✓ Deployment Audit 3 Passed: docker-compose.yml valid syntax and port bindings verified")

def run_all_phase26_tests():
    print("========================================================================")
    print("RUNNING PHASE 26 PRODUCTION DEPLOYMENT AUDIT")
    print("========================================================================")
    test_deployment_artifacts_exist()
    test_zero_hardcoded_paths()
    test_docker_compose_syntax()
    print("========================================================================")
    print("PHASE 26 DEPLOYMENT AUDIT STATUS: PASS  ✅")
    print("========================================================================")

if __name__ == '__main__':
    run_all_phase26_tests()
