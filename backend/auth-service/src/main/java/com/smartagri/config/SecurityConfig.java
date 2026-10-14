package com.smartagri.config;

import com.smartagri.security.CustomUserDetailsService;
import com.smartagri.security.JwtAuthenticationEntryPoint;
import com.smartagri.security.JwtAuthenticationFilter;
import com.smartagri.security.oauth2.CustomOAuth2UserService;
import com.smartagri.security.oauth2.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final PasswordEncoder passwordEncoder;

    /*
     * Auth-service only owns authentication/identity endpoints.
     *
     * CORS is handled centrally by the API Gateway.
     * Therefore, CORS configuration is intentionally NOT defined here.
     */

    // Public GET endpoints
    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/uploads/**"
    };

    // Public authentication endpoints
    private static final String[] PUBLIC_ENDPOINTS = {
            "/auth/**",
            "/oauth2/**",
            "/api/oauth2/**",
            "/login/**",
            "/api/login/**",
            "/actuator/health",
            "/actuator/info"
    };

    /**
     * Authentication Manager
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * DAO Authentication Provider
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    /**
     * Spring Security Filter Chain
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http

                // JWT based REST API -> CSRF disabled
                .csrf(csrf -> csrf.disable())

                // IMPORTANT:
                // CORS is handled by API Gateway.
                // Do NOT configure another CORS source here.

                // Stateless authentication
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Authentication error handling
                .exceptionHandling(eh ->
                        eh.authenticationEntryPoint(
                                authenticationEntryPoint
                        )
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Authentication endpoints are public
                        .requestMatchers(PUBLIC_ENDPOINTS)
                        .permitAll()

                        // Public GET endpoints
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                PUBLIC_GET_ENDPOINTS
                        )
                        .permitAll()

                        // Admin endpoints
                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")

                        // Everything else requires authentication
                        .anyRequest()
                        .authenticated()
                )

                // Google OAuth2 login
                .oauth2Login(oauth2 ->
                        oauth2
                                .authorizationEndpoint(authorization ->
                                        authorization.baseUri("/api/oauth2/authorization")
                                )
                                .redirectionEndpoint(redirection ->
                                        redirection.baseUri("/api/login/oauth2/code/*")
                                )
                                .userInfoEndpoint(userInfo ->
                                        userInfo.userService(
                                                customOAuth2UserService
                                        )
                                )
                                .successHandler(
                                        oAuth2AuthenticationSuccessHandler
                                )
                )

                // Authentication provider
                .authenticationProvider(
                        authenticationProvider()
                )

                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}