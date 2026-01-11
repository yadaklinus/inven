@echo off
:: Navigate to the folder where this script is located
cd /d "%~dp0"

echo [1/3] Cleaning up Prisma migrations...
if exist "prisma\migrations" (
    rmdir /s /q "prisma\migrations"
    mkdir "prisma\migrations"
    echo [OK] migrations folder cleared.
) else (
    echo [SKIP] No migrations folder found.
)

echo [2/3] Pulling from Git...
git pull

:: Handle potential Git errors
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git pull failed. Check for merge conflicts.
    pause
    exit /b
)

echo [3/3] Syncing Prisma...
:: This ensures your local DB matches the newly pulled schema
call npx prisma generate

echo.
echo ==========================================
echo [DONE] Project updated successfully.
echo ==========================================
pause