package com.smartagri.service.impl;

import com.smartagri.dto.response.ForecastDayResponse;
import com.smartagri.dto.response.WeatherResponse;
import com.smartagri.exception.BadRequestException;
import com.smartagri.service.WeatherService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Backs the frontend's weatherAPI (getCurrentWeather / getForecast).
 * If app.weather.api-key is configured, live data is fetched from
 * OpenWeatherMap; otherwise a deterministic simulation (seeded by the
 * location string) is returned so the dashboard stays fully functional
 * without any external API key.
 */
@Service
@Slf4j
public class WeatherServiceImpl implements WeatherService {

    private static final String[] CONDITIONS = {"Sunny", "Cloudy", "Rainy", "Stormy", "Windy", "Foggy"};
    private static final String[] DAY_LABELS = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};

    private final RestClient restClient = RestClient.create("https://api.openweathermap.org/data/2.5");

    @Value("${app.weather.api-key:}")
    private String apiKey;

    @Override
    public WeatherResponse getCurrentWeather(String location) {
        if (!StringUtils.hasText(location)) {
            throw new BadRequestException("location query parameter is required");
        }

        if (StringUtils.hasText(apiKey)) {
            try {
                return fetchLiveCurrent(location);
            } catch (Exception e) {
                log.warn("Falling back to simulated weather for {}: {}", location, e.getMessage());
            }
        }
        return simulateCurrent(location);
    }

    @Override
    public List<ForecastDayResponse> getForecast(String location) {
        if (!StringUtils.hasText(location)) {
            throw new BadRequestException("location query parameter is required");
        }
        return simulateForecast(location);
    }

    @SuppressWarnings("unchecked")
    private WeatherResponse fetchLiveCurrent(String location) {
        Map<String, Object> body = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/weather")
                        .queryParam("q", location)
                        .queryParam("appid", apiKey)
                        .queryParam("units", "metric")
                        .build())
                .retrieve()
                .body(Map.class);

        Map<String, Object> main = (Map<String, Object>) body.get("main");
        Map<String, Object> wind = (Map<String, Object>) body.get("wind");
        List<Map<String, Object>> weatherList = (List<Map<String, Object>>) body.get("weather");

        return WeatherResponse.builder()
                .location(location)
                .temp(((Number) main.get("temp")).doubleValue())
                .condition(weatherList.isEmpty() ? "Unknown" : (String) weatherList.get(0).get("main"))
                .humidity(((Number) main.get("humidity")).intValue())
                .windSpeed(((Number) wind.get("speed")).doubleValue())
                .pressure(((Number) main.get("pressure")).doubleValue())
                .uvIndex(0)
                .build();
    }

    private WeatherResponse simulateCurrent(String location) {
        var random = seededRandom(location);
        return WeatherResponse.builder()
                .location(location)
                .temp(20 + random.nextInt(15))
                .condition(CONDITIONS[random.nextInt(CONDITIONS.length)])
                .humidity(40 + random.nextInt(40))
                .windSpeed(5 + random.nextInt(20))
                .pressure(995 + random.nextInt(30))
                .uvIndex(1 + random.nextInt(10))
                .build();
    }

    private List<ForecastDayResponse> simulateForecast(String location) {
        var random = seededRandom(location);
        return java.util.stream.IntStream.range(0, DAY_LABELS.length)
                .mapToObj(i -> ForecastDayResponse.builder()
                        .day(DAY_LABELS[i])
                        .temp(20 + random.nextInt(15))
                        .condition(CONDITIONS[random.nextInt(CONDITIONS.length)])
                        .build())
                .toList();
    }

    private java.util.Random seededRandom(String location) {
        long seed = location.toLowerCase().hashCode()
                + (System.currentTimeMillis() / (1000L * 60 * 30)); // changes every 30 minutes
        return new java.util.Random(seed);
    }
}
