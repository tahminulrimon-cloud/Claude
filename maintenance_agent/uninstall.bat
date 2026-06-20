@echo off
echo Removing Maintenance Agent...

:: Remove Task Scheduler task
schtasks /delete /tn "MaintenanceAgent" /f >nul 2>&1
echo  [OK] Scheduled task removed.

:: Remove startup shortcut
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
del "%STARTUP_DIR%\MaintenanceAgent.lnk" >nul 2>&1
echo  [OK] Startup shortcut removed.

echo  Done. The agent will no longer start automatically.
echo  Your logs and reports folders remain intact.
pause
