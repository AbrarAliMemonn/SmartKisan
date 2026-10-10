package com.smartagri.controller;

import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.ForecastDayResponse;
import com.smartagri.dto.response.WeatherResponse;
import com.smartagri.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/current")
    public ApiResponse<WeatherResponse> getCurrentWeather(@RequestParam String location) {
        return ApiResponse.success(weatherService.getCurrentWeather(location));
    }

    @GetMapping("/forecast")
    public ApiResponse<List<ForecastDayResponse>> getForecast(@RequestParam String location) {
        return ApiResponse.success(weatherService.getForecast(location));
    }
}
