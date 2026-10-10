package com.smartagri.config;

import com.smartagri.security.JwtAuthenticationEntryPoint;
import com.smartagri.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/marketplace/products/**",
            "/marketplace/categories",
            "/marketplace/sellers/*",
            "/marketplace/coupons",
            // Uploaded product/store images must be readable by anyone browsing the catalog.
            "/marketplace/media/files/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                // CORS is handled by API Gateway
                // Do NOT configure CORS here
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(eh ->
                        eh.authenticationEntryPoint(authenticationEntryPoint)
                )

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()

                        // Must come before /marketplace/products/** and /marketplace/sellers/*
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/marketplace/products/my-listings",
                                "/marketplace/sellers/me",
                                "/marketplace/sellers/me/analytics",
                                "/marketplace/coupons/admin"
                        ).authenticated()

                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                PUBLIC_GET_ENDPOINTS
                        ).permitAll()

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}