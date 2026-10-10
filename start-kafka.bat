@echo off
title Apache Kafka Server (KRaft Mode)
echo ========================================================
echo Starting Apache Kafka 4.2.1 (KRaft Mode - No ZooKeeper)
echo ========================================================

cd /d "%~dp0kafka_2.13-4.2.1"

:format_check
if not exist "data\kraft-combined-logs\__cluster_metadata-0" (
    echo Formatting Kafka KRaft storage...
    call bin\windows\kafka-storage.bat format -t FEKYEaNpQMWnHYCQx2nTzg -c config\server.properties --standalone
)

echo Starting Kafka Broker on localhost:9092 ...
call bin\windows\kafka-server-start.bat config\server.properties

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================================
    echo [Kafka Self-Healing] Recovering from unclean shutdown...
    echo ========================================================
    rd /s /q "data\kraft-combined-logs" 2>nul
    echo Storage cleaned. Re-formatting fresh KRaft cluster...
    call bin\windows\kafka-storage.bat format -t FEKYEaNpQMWnHYCQx2nTzg -c config\server.properties --standalone
    echo Retrying Kafka Broker start...
    call bin\windows\kafka-server-start.bat config\server.properties
)

pause
