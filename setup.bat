@echo off
REM ============================================================
REM  Restaurant POS & Order Management - One-command setup
REM  Builds the React frontend, installs the Python backend,
REM  seeds demo data, and starts the app on http://localhost:8000
REM ============================================================
setlocal

cd /d "%~dp0"

echo.
echo ============================================================
echo   Restaurant POS - Setup
echo ============================================================
echo.

REM --- 1. Check prerequisites -------------------------------------------------
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed or not on PATH.
    echo         Install Python 3.10+ from https://www.python.org/downloads/
    echo         and tick "Add Python to PATH" during install.
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH.
    echo         Install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM --- 2. Build the React frontend -------------------------------------------
echo [1/4] Installing frontend packages (npm install)...
cd frontend
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo [2/4] Building the React app (npm run build)...
call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
)
cd ..

REM --- 3. Set up the Python backend ------------------------------------------
echo [3/4] Setting up Python virtual environment + dependencies...
cd backend
if not exist venv (
    py -3.12 -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] pip install failed.
    pause
    exit /b 1
)

REM --- 4. Start the app (auto-seeds demo data on first run) -------------------
echo.
echo ============================================================
echo   [4/4] Starting the app...
echo   Open your browser to:  http://localhost:8000
echo   Press Ctrl+C in this window to stop the server.
echo ============================================================
echo.
python -m uvicorn main:app --host 127.0.0.1 --port 8000

endlocal
