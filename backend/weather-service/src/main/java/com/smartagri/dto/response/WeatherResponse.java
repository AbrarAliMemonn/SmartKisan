package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponse {
    private String location;
    private double temp;
    private String condition;
    private int humidity;
    private double windSpeed;
    private double pressure;
    private int uvIndex;
}
