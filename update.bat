@echo off
:: Set the path to your project folder
set PROJECT_DIR="C:\path\to\your\project"

echo [PROCESS] Moving to project directory...
cd /d %PROJECT_DIR%

:: Check if the directory is actually a git repository
if not exist .git (
    echo [ERROR] This directory is not a Git repository.
    pause
    exit /b
)

echo [PROCESS] Pulling latest changes from remote...
git pull

:: Check if the pull was successful
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Project updated successfully.
) else (
    echo [ERROR] Git pull failed. Check for merge conflicts or connection issues.
)

pause