@echo off
:: Navigate to the script's current directory
cd /d "%~dp0"

echo [1/3] Checking dependencies...
:: If node_modules doesn't exist, run npm install automatically
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing...
    call npm install
)

echo [2/3] Cleaning previous build artifacts...
:: Deletes the 'dist' or '.next' folder to ensure a fresh build
if exist "dist\" rmdir /s /q "dist\"
if exist ".next\" rmdir /s /q ".next\"

echo [3/3] Starting production build...
:: 'call' is required to prevent the script from exiting after npm finishes
call npm run build

:: Check if the build command succeeded
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo [SUCCESS] Build completed successfully.
    echo ==========================================
) else (
    echo.
    echo [ERROR] Build failed. Check the logs above.
)

pause