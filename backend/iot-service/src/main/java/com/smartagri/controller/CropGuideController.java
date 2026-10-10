package com.smartagri.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/crops")
public class CropGuideController {

    @GetMapping("/guides")
    public ResponseEntity<?> getCropGuides() {
        return ResponseEntity.ok(List.of(
                Map.of(
                        "crop", "Wheat (Gandum)",
                        "season", "Rabi (Nov - Apr)",
                        "optimalMoisture", "50% - 65%",
                        "optimalTemp", "15°C - 25°C",
                        "soil", "Loamy, Clay Loam",
                        "npkRatio", "120:60:60",
                        "irrigationRounds", "4 - 5 critical waterings (Crown root, Tillering, Flowering, Milking)"
                ),
                Map.of(
                        "crop", "Rice (Basmati / IRRI)",
                        "season", "Kharif (May - Nov)",
                        "optimalMoisture", "75% - 90%",
                        "optimalTemp", "25°C - 35°C",
                        "soil", "Clayey, Submerged Silt",
                        "npkRatio", "100:50:50",
                        "irrigationRounds", "Continuous ponding during vegetative stage, drain before harvest"
                ),
                Map.of(
                        "crop", "Cotton (Kapas / Phutti)",
                        "season", "Kharif (Apr - Nov)",
                        "optimalMoisture", "45% - 60%",
                        "optimalTemp", "28°C - 38°C",
                        "soil", "Deep alluvial loam",
                        "npkRatio", "150:60:60",
                        "irrigationRounds", "6 - 8 irrigations, avoid waterlogging during boll formation"
                ),
                Map.of(
                        "crop", "Sugarcane (Kamand)",
                        "season", "Annual (Spring / Autumn)",
                        "optimalMoisture", "60% - 75%",
                        "optimalTemp", "24°C - 35°C",
                        "soil", "Heavy loam with good drainage",
                        "npkRatio", "200:100:100",
                        "irrigationRounds", "16 - 20 irrigations, frequent light applications"
                )
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getFieldStatus() {
        return ResponseEntity.ok(List.of(
                Map.of("field", "Zone 1 - Wheat Field", "stage", "Tillering Stage", "healthScore", 94, "soilStatus", "Optimal"),
                Map.of("field", "Zone 2 - Rice Nursery", "stage", "Transplanting", "healthScore", 88, "soilStatus", "Requires Water Inflow"),
                Map.of("field", "Zone 3 - Cotton Field", "stage", "Vegetative Growth", "healthScore", 96, "soilStatus", "Optimal")
        ));
    }
}
