@echo off
title Smart Agriculture - Stop All Services
color 0C

echo ===============================================================================
echo            SMART AGRICULTURE PLATFORM - STOP ALL SERVICES
echo ===============================================================================
echo.
echo  Closing all running microservices and background processes on ports:
echo  8761, 8080, 8081, 8082, 8084, 8085, 8086, 9099, 3000
echo.

setlocal enabledelayedexpansion

set PORTS=8761 8080 8081 8082 8084 8085 8086 9099 3000

for %%P in (%PORTS%) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        set PID=%%a
        if not "!PID!"=="" if not "!PID!"=="0" (
            echo Stopping process on port %%P (PID !PID!)...
            taskkill /F /PID !PID! 2>nul
        )
    )
)

echo.
echo ===============================================================================
echo  All microservices on designated ports have been terminated successfully.
echo ===============================================================================
echo.
pause
