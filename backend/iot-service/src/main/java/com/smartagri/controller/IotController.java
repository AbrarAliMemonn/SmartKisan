package com.smartagri.controller;

import com.smartagri.model.SensorReading;
import com.smartagri.service.SensorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/iot")
@RequiredArgsConstructor
public class IotController {

    private final SensorService sensorService;

    @GetMapping("/sensors")
    public ResponseEntity<?> getSensors() {
        return ResponseEntity.ok(sensorService.getAllSensors());
    }

    @GetMapping("/sensors/{id}")
    public ResponseEntity<?> getSensorById(@PathVariable String id) {
        SensorReading reading = sensorService.getSensor(id);
        if (reading == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reading);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@RequestParam(required = false) String sensorId) {
        if (sensorId != null) {
            return ResponseEntity.ok(sensorService.getHistory().getOrDefault(sensorId, java.util.List.of()));
        }
        return ResponseEntity.ok(sensorService.getHistory());
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts() {
        return ResponseEntity.ok(sensorService.getAlerts());
    }

    /**
     * Hardware Ingestion Endpoint
     * Physical sensors (ESP32, Arduino, Raspberry Pi, LoRa gateway) POST live readings here.
     * Example JSON:
     * { "hardwareId": "ESP32_WHEAT_FIELD", "soilMoisture": 42.5, "temperature": 28.1, "humidity": 65 }
     */
    @PostMapping("/telemetry")
    public ResponseEntity<?> ingestTelemetry(@RequestBody Map<String, Object> payload) {
        sensorService.ingestHardwareTelemetry(payload);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Live hardware telemetry ingested successfully",
                "mode", "LIVE_HARDWARE"
        ));
    }

    @PostMapping("/mode")
    public ResponseEntity<?> setMode(@RequestParam boolean live) {
        sensorService.setHardwareLive(live);
        return ResponseEntity.ok(Map.of(
                "liveHardwareActive", sensorService.isHardwareLive(),
                "message", live ? "Switched to Live Hardware mode" : "Switched to Simulated Dummy mode"
        ));
    }

    @GetMapping("/irrigation/status")
    public ResponseEntity<?> getIrrigationStatus() {
        return ResponseEntity.ok(sensorService.getIrrigationStatus());
    }

    @PostMapping("/irrigation/toggle")
    public ResponseEntity<?> toggleIrrigation(@RequestBody Map<String, Object> body) {
        int zone = Integer.parseInt(String.valueOf(body.getOrDefault("zone", 1)));
        boolean status = Boolean.parseBoolean(String.valueOf(body.getOrDefault("status", true)));
        sensorService.toggleIrrigation(zone, status);
        return ResponseEntity.ok(Map.of(
                "message", "Irrigation zone " + zone + " set to " + (status ? "ACTIVE" : "INACTIVE"),
                "status", sensorService.getIrrigationStatus()
        ));
    }
}
