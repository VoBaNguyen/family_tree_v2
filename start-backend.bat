@echo off
echo 🌳 Family Tree Backend Setup
echo ==============================

REM Check if we're in the correct directory
if not exist "backend" (
    echo ❌ Backend directory not found. Please run this script from the family-chart directory.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version') do echo ✓ Node.js version: %%i
)

REM Check if package.json exists
if not exist "backend\package.json" (
    echo ❌ package.json not found in backend directory.
    pause
    exit /b 1
)

REM Create data and backup directories
echo.
echo 📁 Creating data directories...
if not exist "backend\data" (
    mkdir "backend\data"
    echo ✓ Created data directory
) else (
    echo ✓ Data directory already exists
)

if not exist "backend\backups" (
    mkdir "backend\backups"
    echo ✓ Created backups directory
) else (
    echo ✓ Backups directory already exists
)

REM Create image directories
if not exist "backend\images" (
    mkdir "backend\images"
    echo ✓ Created images directory
) else (
    echo ✓ Images directory already exists
)

if not exist "backend\images\BaNa" (
    mkdir "backend\images\BaNa"
    echo ✓ Created BaNa images directory
) else (
    echo ✓ BaNa images directory already exists
)

if not exist "backend\images\MeNa" (
    mkdir "backend\images\MeNa"
    echo ✓ Created MeNa images directory
) else (
    echo ✓ MeNa images directory already exists
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
) else (
    echo ✓ Dependencies installed successfully
)

REM Start the server
echo.
echo 🚀 Starting Family Tree API Server...
echo Server will be available at: http://localhost:3001 |  https://family-tree-v2.onrender.com
echo API endpoints:
echo   - Health check: GET /api/health
echo   - Get trees: GET /api/trees
echo   - Get tree: GET /api/trees/{id}
echo   - Save tree: POST /api/trees/{id}
echo   - Auto-save: PUT /api/trees/{id}/autosave
echo   - Get backups: GET /api/trees/{id}/backups
echo   - Restore backup: POST /api/trees/{id}/restore/{backup}
echo   - Upload image: POST /api/images/{treeId}/upload
echo   - List images: GET /api/images/{treeId}
echo   - Delete image: DELETE /api/images/{treeId}/{filename}
echo   - Serve images: GET /images/{treeId}/{filename}
echo.
echo Press Ctrl+C to stop the server
echo ==============================

node "%~dp0backend\server.js"
