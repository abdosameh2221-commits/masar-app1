@echo off
title Masar App - Thanawya & AI
echo ========================================================
echo   Launching Masar App for Abdo...
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo An error occurred. Press any key to exit...
    pause > nul
)
