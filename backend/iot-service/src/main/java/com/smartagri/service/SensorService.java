package com.smartagri.service;

import com.smartagri.model.SensorReading;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SensorService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.sensor-events:iot-sensor-events-topic}")
    private String sensorTopic;

    private boolean isHardwareLive = false;
    private Instant lastHardwarePing = null;

    private final Map<String, SensorReading> currentReadings = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> historyMap = new ConcurrentHashMap<>();

    // Irrigation status
    private boolean zone1IrrigationActive = true;
    private boolean zone2IrrigationActive = false;
    private int zone1MoistureTarget = 65;
    private int zone2MoistureTarget = 50;

    public SensorService(Optional<KafkaTemplate<String, Object>> kafkaTemplateOpt) {
        this.kafkaTemplate = kafkaTemplateOpt.orElse(null);
        initializeSensors();
    }

    private void initializeSensors() {
        registerSensor("soilMoisture", "Soil Moisture", 58.5, "%", "Capacitive Soil Moisture Sensor", 30.0, 80.0);
        registerSensor("temperature", "Air Temperature", 26.4, "°C", "DHT22 Sensor", 15.0, 35.0);
        registerSensor("humidity", "Air Humidity", 62.0, "%", "DHT22 Sensor", 40.0, 85.0);
        registerSensor("lightIntensity", "Light Intensity", 45000.0, "lux", "LDR Sensor Module", 5000.0, 80000.0);
        registerSensor("rainfall", "Rain Detection", 0.0, "%", "Rain Sensor Board", 0.0, 60.0);
        registerSensor("waterLevel", "Water Level", 85.0, "%", "Water Level Float Sensor", 20.0, 95.0);
        registerSensor("pressure", "Atmospheric Pressure", 1013.2, "hPa", "BMP280 Sensor", 990.0, 1030.0);
    }

    private void registerSensor(String id, String name, double initialVal, String unit, String module, double low, double high) {
        SensorReading reading = SensorReading.builder()
                .sensorId(id)
                .name(name)
                .value(initialVal)
                .unit(unit)
                .module(module)
                .minThreshold(low)
                .maxThreshold(high)
                .status("NORMAL")
                .source("SIMULATED")
                .timestamp(Instant.now())
                .build();

        currentReadings.put(id, reading);
        historyMap.put(id, new CopyOnWriteArrayList<>());
        appendHistory(id, initialVal);
    }

    private void appendHistory(String id, double val) {
        List<Map<String, Object>> hist = historyMap.get(id);
        if (hist != null) {
            Map<String, Object> pt = new HashMap<>();
            pt.put("time", String.format("%tT", new Date()));
            pt.put("value", Math.round(val * 100.0) / 100.0);
            hist.add(pt);
            if (hist.size() > 30) {
                hist.remove(0);
            }
        }
    }

    @Scheduled(fixedRate = 3000)
    public void generateOrMaintainReadings() {
        // If hardware hasn't sent telemetry in 30 seconds, revert to simulation
        if (isHardwareLive && lastHardwarePing != null &&
                Instant.now().isAfter(lastHardwarePing.plusSeconds(30))) {
            isHardwareLive = false;
            log.info("No hardware telemetry received in 30s. Reverting to realistic simulation.");
        }

        if (!isHardwareLive) {
            // Apply slight physical fluctuations
            currentReadings.forEach((id, r) -> {
                double delta = (Math.random() - 0.5) * getJitterRange(id);
                double nextVal = Math.round((r.getValue() + delta) * 100.0) / 100.0;
                r.setValue(nextVal);
                r.setSource("SIMULATED");
                r.setTimestamp(Instant.now());
                r.setStatus(computeStatus(nextVal, r.getMinThreshold(), r.getMaxThreshold()));
                appendHistory(id, nextVal);
            });
        }

        // Publish to Kafka if available
        if (kafkaTemplate != null) {
            try {
                kafkaTemplate.send(sensorTopic, getSummaryPayload());
            } catch (Exception e) {
                log.debug("Kafka send skipped: {}", e.getMessage());
            }
        }
    }

    private double getJitterRange(String id) {
        return switch (id) {
            case "soilMoisture", "humidity", "waterLevel", "rainfall" -> 0.8;
            case "temperature" -> 0.4;
            case "lightIntensity" -> 350.0;
            case "pressure" -> 0.2;
            default -> 0.5;
        };
    }

    private String computeStatus(double val, double low, double high) {
        if (val < low) return "WARNING_LOW";
        if (val > high) return "WARNING_HIGH";
        return "NORMAL";
    }

    public void ingestHardwareTelemetry(Map<String, Object> payload) {
        this.isHardwareLive = true;
        this.lastHardwarePing = Instant.now();

        String hardwareId = (String) payload.getOrDefault("hardwareId", "ESP32_DEFAULT");

        payload.forEach((key, val) -> {
            if (currentReadings.containsKey(key)) {
                try {
                    double numVal = Double.parseDouble(String.valueOf(val));
                    SensorReading r = currentReadings.get(key);
                    r.setValue(numVal);
                    r.setSource("LIVE_HARDWARE");
                    r.setHardwareId(hardwareId);
                    r.setTimestamp(Instant.now());
                    r.setStatus(computeStatus(numVal, r.getMinThreshold(), r.getMaxThreshold()));
                    appendHistory(key, numVal);
                } catch (Exception ignored) {}
            }
        });

        log.info("Live hardware telemetry recorded from {}", hardwareId);
    }

    public Map<String, Object> getAllSensors() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Double> valuesMap = new HashMap<>();
        currentReadings.forEach((k, v) -> valuesMap.put(k, v.getValue()));

        response.put("isHardwareLive", isHardwareLive);
        response.put("lastHardwarePing", lastHardwarePing);
        response.put("readings", valuesMap);
        response.put("sensors", new ArrayList<>(currentReadings.values()));
        return response;
    }

    public Map<String, Double> getSummaryPayload() {
        Map<String, Double> summary = new HashMap<>();
        currentReadings.forEach((k, v) -> summary.put(k, v.getValue()));
        return summary;
    }

    public SensorReading getSensor(String id) {
        return currentReadings.get(id);
    }

    public Map<String, List<Map<String, Object>>> getHistory() {
        return historyMap;
    }

    public List<Map<String, Object>> getAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        currentReadings.forEach((id, r) -> {
            if (!"NORMAL".equals(r.getStatus())) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("sensorId", id);
                alert.put("name", r.getName());
                alert.put("value", r.getValue());
                alert.put("unit", r.getUnit());
                alert.put("status", r.getStatus());
                alert.put("message", String.format("%s is currently %.1f %s (Threshold: %.1f - %.1f %s)",
                        r.getName(), r.getValue(), r.getUnit(), r.getMinThreshold(), r.getMaxThreshold(), r.getUnit()));
                alert.put("timestamp", r.getTimestamp());
                alerts.add(alert);
            }
        });
        return alerts;
    }

    public void setHardwareLive(boolean live) {
        this.isHardwareLive = live;
        if (live) this.lastHardwarePing = Instant.now();
    }

    public boolean isHardwareLive() {
        return this.isHardwareLive;
    }

    public Map<String, Object> getIrrigationStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("zone1Active", zone1IrrigationActive);
        status.put("zone2Active", zone2IrrigationActive);
        status.put("zone1MoistureTarget", zone1MoistureTarget);
        status.put("zone2MoistureTarget", zone2MoistureTarget);
        status.put("waterLevel", currentReadings.get("waterLevel").getValue());
        status.put("mode", "AUTOMATED");
        return status;
    }

    public void toggleIrrigation(int zone, boolean state) {
        if (zone == 1) zone1IrrigationActive = state;
        if (zone == 2) zone2IrrigationActive = state;
    }
}
