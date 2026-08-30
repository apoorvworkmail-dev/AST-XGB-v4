# Installation & Setup Guide

**Project:** AST-XGB Real Estate Property Price Valuation System  
**Author:** Apoorv Mishra  

---

## 1. System Requirements

*   **Operating System**: Windows 10/11, macOS 12+, or Ubuntu 20.04+ Linux
*   **Python**: 3.10 or 3.11
*   **Node.js**: 18.x or 20.x
*   **RAM**: 8 GB minimum (16 GB recommended)
*   **Disk Space**: 2 GB free disk space

---

## 2. Environment Setup

### Step 1: Clone Repository & Create Virtual Environment
```bash
# Navigate to project directory
cd c:\Users\apoorv mishra\Desktop\Ml_project

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
source venv/bin/activate
```

### Step 2: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 3. Running Application Components

### Running Automated Test Suites
```bash
# Execute master test suite (all 28 tests):
python -X utf8 scratch/run_all_tests.py
```

### Starting Backend FastAPI API Server
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```
*   **API Base**: `http://localhost:8000`
*   **Swagger API Docs**: `http://localhost:8000/docs`

### Starting Frontend React Web Console
```bash
cd frontend
npm run dev
```
*   **Web Dashboard**: `http://localhost:5173`

---

## 4. Docker Container Orchestration

To run the complete production application inside Docker containers:

```bash
# Build and launch multi-container application:
docker-compose up --build -d

# Check running container status:
docker-compose ps

# View backend container logs:
docker-compose logs -f backend

# Stop container stack:
docker-compose down
```
