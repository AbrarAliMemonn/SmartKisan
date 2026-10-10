# Start Apache Kafka 4.2.1 in KRaft mode with Self-Healing
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Starting Apache Kafka 4.2.1 (KRaft Mode - No ZooKeeper)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$kafkaDir = Join-Path $PSScriptRoot "kafka_2.13-4.2.1"
$logDir = Join-Path $kafkaDir "data\kraft-combined-logs"
$metaDir = Join-Path $logDir "__cluster_metadata-0"

if (-not (Test-Path $metaDir)) {
    Write-Host "Formatting KRaft metadata storage..." -ForegroundColor Cyan
    & "$kafkaDir\bin\windows\kafka-storage.bat" format -t FEKYEaNpQMWnHYCQx2nTzg -c "$kafkaDir\config\server.properties" --standalone
}

Write-Host "Starting Kafka Broker on localhost:9092..." -ForegroundColor Yellow
& "$kafkaDir\bin\windows\kafka-server-start.bat" "$kafkaDir\config\server.properties"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[Kafka Self-Healing] Auto-recovering from unclean shutdown..." -ForegroundColor Red
    if (Test-Path $logDir) { Remove-Item -Recurse -Force $logDir }
    Write-Host "Re-formatting fresh cluster storage..." -ForegroundColor Cyan
    & "$kafkaDir\bin\windows\kafka-storage.bat" format -t FEKYEaNpQMWnHYCQx2nTzg -c "$kafkaDir\config\server.properties" --standalone
    Write-Host "Restarting Kafka Broker on localhost:9092..." -ForegroundColor Yellow
    & "$kafkaDir\bin\windows\kafka-server-start.bat" "$kafkaDir\config\server.properties"
}
