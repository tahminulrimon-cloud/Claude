@echo off
:: ============================================================
::  Windows 11 Maintenance Agent — Installer
::  Run this script as Administrator once.
:: ============================================================

setlocal EnableDelayedExpansion

echo.
echo  ===================================================
echo   Windows 11 Maintenance Agent — Installer
echo  ===================================================
echo.

:: --- Check for Admin rights ---
net session >nul 2>&1
if %errorlevel% NEQ 0 (
    echo  [ERROR] Please run this script as Administrator.
    echo  Right-click install.bat ^> "Run as administrator"
    pause
    exit /b 1
)

:: --- Locate Python ---
where python >nul 2>&1
if %errorlevel% NEQ 0 (
    echo  [ERROR] Python not found. Install Python 3.10+ from https://python.org
    echo  Make sure to tick "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo  [OK] Python found:
python --version

:: --- Install dependencies ---
echo.
echo  Installing Python dependencies...
python -m pip install --upgrade pip --quiet
python -m pip install -r "%~dp0requirements.txt"
if %errorlevel% NEQ 0 (
    echo  [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
echo  [OK] Dependencies installed.

:: --- Create required directories ---
mkdir "%~dp0logs"    2>nul
mkdir "%~dp0reports" 2>nul
mkdir "%~dp0staging" 2>nul
echo  [OK] Directories created.

:: --- Register as a Windows Task Scheduler task ---
echo.
echo  Registering scheduled task "MaintenanceAgent"...

set AGENT_PATH=%~dp0agent.py
set PYTHON_PATH=

:: Find python.exe path
for /f "tokens=*" %%i in ('where python') do (
    set PYTHON_PATH=%%i
    goto :found_python
)
:found_python

:: Delete existing task if present
schtasks /delete /tn "MaintenanceAgent" /f >nul 2>&1

:: Create task: runs at logon, restarts on failure, runs indefinitely
schtasks /create ^
    /tn "MaintenanceAgent" ^
    /tr "\"%PYTHON_PATH%\" \"%AGENT_PATH%\"" ^
    /sc ONLOGON ^
    /ru "%USERNAME%" ^
    /rl HIGHEST ^
    /f ^
    /delay 0001:00 ^
    >nul

if %errorlevel% NEQ 0 (
    echo  [WARN] Could not register Task Scheduler task.
    echo  You can still run the agent manually: python agent.py
) else (
    echo  [OK] Task "MaintenanceAgent" registered — starts 1 minute after every logon.
)

:: --- Create a shortcut in Startup folder (fallback) ---
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_VBS="%TEMP%\create_shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SHORTCUT_VBS%
echo sLinkFile = "%STARTUP_DIR%\MaintenanceAgent.lnk" >> %SHORTCUT_VBS%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SHORTCUT_VBS%
echo oLink.TargetPath = "%PYTHON_PATH%" >> %SHORTCUT_VBS%
echo oLink.Arguments = """%AGENT_PATH%""" >> %SHORTCUT_VBS%
echo oLink.WorkingDirectory = "%~dp0" >> %SHORTCUT_VBS%
echo oLink.WindowStyle = 7 >> %SHORTCUT_VBS%
echo oLink.Description = "Windows 11 Maintenance Agent" >> %SHORTCUT_VBS%
echo oLink.Save >> %SHORTCUT_VBS%

cscript //nologo %SHORTCUT_VBS%
del %SHORTCUT_VBS%
echo  [OK] Startup shortcut created in: %STARTUP_DIR%

:: --- Configure Windows Disk Cleanup presets (sagerun:1) ---
echo.
echo  Configuring Windows Disk Cleanup presets...
cleanmgr /sageset:1 >nul 2>&1
echo  [OK] Disk Cleanup preset configured (run once to select categories).

:: --- Summary ---
echo.
echo  ===================================================
echo   Installation complete!
echo.
echo   The agent will start automatically on next logon.
echo   To start it NOW:  python "%AGENT_PATH%"
echo   To check status:  python "%AGENT_PATH%" --status
echo   To force run:     python "%AGENT_PATH%" --once
echo   Reports saved to: %~dp0reports\
echo   Logs saved to:    %~dp0logs\
echo  ===================================================
echo.
pause
