@echo off
title Smart Agriculture - Spring Cloud Microservices Launcher
color 0B

echo ===============================================================================
echo        SMART AGRICULTURE - FULL SPRING CLOUD MICROSERVICES LAUNCHER
echo ===============================================================================
echo.
echo  This script launches all 7 backend Spring Boot microservices in the correct order:
echo.
echo   [1/7] Eureka Service Discovery       (Port: 8761)
echo   [2/7] Spring Cloud API Gateway       (Port: 8080)
echo   [3/7] Auth & User Service            (Port: 8081)
echo   [4/7] Marketplace & Chat Service     (Port: 8082 + Socket.IO 9099)
echo   [5/7] Weather Service                (Port: 8084)
echo   [6/7] IoT Crop Telemetry Service     (Port: 8085)
echo   [7/7] Multilingual AgricultureBot    (Port: 8086)
echo.
echo ===============================================================================
echo  Press any key to begin launching the services stack...
echo  (Or close this window to cancel)
echo ===============================================================================
pause >nul

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend

echo.
echo [1/7] Starting Eureka Discovery Server (Port 8761)...
start "Eureka Server [Port 8761]" cmd /k "cd /d "%BACKEND_DIR%\eureka-server" && color 0A && echo Starting Eureka Discovery Server... && mvnw.cmd spring-boot:run"
echo Waiting 12 seconds for Eureka Server initialization...
timeout /t 12 /nobreak >nul

echo.
echo [2/7] Starting API Gateway (Port 8080)...
start "API Gateway [Port 8080]" cmd /k "cd /d "%BACKEND_DIR%\api-gateway" && color 0B && echo Starting API Gateway... && mvnw.cmd spring-boot:run"
echo Waiting 6 seconds for API Gateway...
timeout /t 6 /nobreak >nul

echo.
echo [3/7] Starting Auth & User Service (Port 8081)...
start "Auth Service [Port 8081]" cmd /k "cd /d "%BACKEND_DIR%\auth-service" && color 0C && echo Starting Auth Service... && mvnw.cmd spring-boot:run"
echo Waiting 6 seconds for Auth Service...
timeout /t 6 /nobreak >nul

echo.
echo [4/7] Starting Marketplace & Chat Service (Port 8082, Socket 9099)...
start "Marketplace Service [Port 8082]" cmd /k "cd /d "%BACKEND_DIR%\marketplace-service" && color 0D && echo Starting Marketplace Service with Socket.IO... && mvnw.cmd spring-boot:run"
echo Waiting 6 seconds for Marketplace Service...
timeout /t 6 /nobreak >nul

echo.
echo [5/7] Starting Weather Service (Port 8084)...
start "Weather Service [Port 8084]" cmd /k "cd /d "%BACKEND_DIR%\weather-service" && color 0E && echo Starting Weather Service... && mvnw.cmd spring-boot:run"
echo Waiting 4 seconds for Weather Service...
timeout /t 4 /nobreak >nul

echo.
echo [6/7] Starting IoT Sensor Telemetry Service (Port 8085)...
start "IoT Service [Port 8085]" cmd /k "cd /d "%BACKEND_DIR%\iot-service" && color 0A && echo Starting IoT Sensor Telemetry Service... && mvnw.cmd spring-boot:run"
echo Waiting 4 seconds for IoT Service...
timeout /t 4 /nobreak >nul

echo.
echo [7/7] Starting Multilingual AgricultureBot Service (Port 8086)...
start "Chatbot Service [Port 8086]" cmd /k "cd /d "%BACKEND_DIR%\chatbot-service" && color 0F && echo Starting Multilingual AgricultureBot Service... && mvnw.cmd spring-boot:run"

echo.
echo ===============================================================================
echo  ALL 7 MICROSERVICES HAVE BEEN LAUNCHED IN DEDICATED WINDOWS!
echo ===============================================================================
echo.
echo  * Eureka Discovery Dashboard : http://localhost:8761
echo  * API Gateway Route Base      : http://localhost:8080
echo.
echo  Tip: To stop all running services in 1 click, run: stop-all-services.bat
echo ===============================================================================
echo.
set /p open_eureka="Open Eureka Discovery Dashboard in browser now? (Y/N): "
if /i "%open_eureka%"=="Y" start http://localhost:8761

echo.
echo Press any key to exit this launcher window (services will remain running).
pause >nul
