@echo off
title Smart Agriculture Platform - Control Center
color 0A

:menu
cls
echo ===============================================================================
echo            SMART AGRICULTURE PLATFORM - CONTROL CENTER
echo ===============================================================================
echo.
echo  [1] Start Apache Kafka Broker (KRaft Mode - Port 9092)
echo  [2] Start FULL Spring Cloud Microservices Stack (All 7 Services in 1-Click)
echo  [3] Start Fast Services Runner (IoT & AgricultureBot on Ports 8085 & 8086)
echo  [4] Start Frontend (React 19 + Vite on http://localhost:3000)
echo  [5] Stop All Running Services (1-Click Port Killer)
echo  [6] View Microservices Architecture & Port Mapping
echo  [7] Exit
echo.
echo ===============================================================================
set /p choice="Select an option [1-7]: "

if "%choice%"=="1" goto start_kafka
if "%choice%"=="2" goto start_spring
if "%choice%"=="3" goto start_fast_services
if "%choice%"=="4" goto start_frontend
if "%choice%"=="5" goto stop_services
if "%choice%"=="6" goto show_arch
if "%choice%"=="7" goto exit_app

echo Invalid selection. Please try again.
pause
goto menu

:start_kafka
echo.
echo Starting Apache Kafka Broker in a new window...
start "Apache Kafka Broker" cmd /k "%~dp0start-kafka.bat"
echo Kafka window launched!
pause
goto menu

:start_spring
echo.
echo Launching all 7 Spring Boot microservices in sequence...
call "%~dp0start-all-spring-services.bat"
goto menu

:start_fast_services
echo.
echo Starting IoT Telemetry & Multilingual AgricultureBot fast runner...
start "IoT & Chatbot Services Runner" cmd /k "cd /d "%~dp0backend" && node services-runner.js"
echo Services runner launched!
pause
goto menu

:start_frontend
echo.
echo Starting Vite Frontend on http://localhost:3000 ...
start "SmartAgri Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo Frontend launched!
pause
goto menu

:stop_services
echo.
call "%~dp0stop-all-services.bat"
goto menu

:show_arch
cls
echo ===============================================================================
echo                     MICROSERVICES & PORT ALLOCATION
echo ===============================================================================
echo.
echo  * Frontend (React 19 + Vite)        : http://localhost:3000
echo  * API Gateway (Spring Cloud)        : http://localhost:8080
echo  * Eureka Service Discovery          : http://localhost:8761
echo  * Auth & User Service               : http://localhost:8081
echo  * Marketplace Service (Socket.IO)   : http://localhost:8082 (Socket: 9099)
echo  * Weather Service                   : http://localhost:8084
echo  * IoT Sensor Telemetry Service      : http://localhost:8085
echo  * Multilingual AgricultureBot       : http://localhost:8086
echo  * Apache Kafka Broker (KRaft)       : localhost:9092
echo  * MySQL Database (MySQL80)          : localhost:3306
echo.
echo ===============================================================================
pause
goto menu

:exit_app
exit
