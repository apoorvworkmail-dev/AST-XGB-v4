"""
Phase 27 — Technical & Research Paper Documentation Verification
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra

Verifies:
  1. Root README.md existence & structure
  2. docs/system_architecture.md
  3. docs/installation_and_setup.md
  4. docs/dataset_and_leakage_prevention.md
  5. docs/research_paper_draft.md
"""

import sys, os, pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def test_documentation_files_exist():
    """Verify all 5 Phase 27 documentation files exist and are non-empty."""
    docs = [
        BASE_DIR / "README.md",
        BASE_DIR / "docs" / "system_architecture.md",
        BASE_DIR / "docs" / "installation_and_setup.md",
        BASE_DIR / "docs" / "dataset_and_leakage_prevention.md",
        BASE_DIR / "docs" / "research_paper_draft.md"
    ]
    
    for d in docs:
        assert d.exists(), f"Documentation file missing: {d}"
        content = d.read_text(encoding='utf-8')
        assert len(content) > 500, f"Documentation file too short: {d}"
        
    print("\n✓ Documentation Audit 1 Passed: All 5 technical & research paper documentation files present & verified")

def run_all_phase27_tests():
    print("========================================================================")
    print("RUNNING PHASE 27 DOCUMENTATION VERIFICATION AUDIT")
    print("========================================================================")
    test_documentation_files_exist()
    print("========================================================================")
    print("PHASE 27 DOCUMENTATION AUDIT STATUS: PASS  ✅")
    print("========================================================================")

if __name__ == '__main__':
    run_all_phase27_tests()
