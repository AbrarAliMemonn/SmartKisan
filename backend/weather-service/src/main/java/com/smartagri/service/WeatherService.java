package com.smartagri.service;

import com.smartagri.dto.response.ForecastDayResponse;
import com.smartagri.dto.response.WeatherResponse;

import java.util.List;

public interface WeatherService {
    WeatherResponse getCurrentWeather(String location);
    List<ForecastDayResponse> getForecast(String location);
}
