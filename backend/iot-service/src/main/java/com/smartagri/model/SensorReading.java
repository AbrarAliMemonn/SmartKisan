package com.smartagri.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorReading {
    private String sensorId;
    private String name;
    private double value;
    private String unit;
    private String module;
    private double minThreshold;
    private double maxThreshold;
    private String status; // NORMAL, WARNING, CRITICAL
    private String source; // SIMULATED, LIVE_HARDWARE
    private String hardwareId;
    private Instant timestamp;
}
