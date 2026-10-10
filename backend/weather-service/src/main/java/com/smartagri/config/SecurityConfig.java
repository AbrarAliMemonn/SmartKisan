// package com.smartagri.config;

// import com.smartagri.security.JwtAuthenticationEntryPoint;
// import com.smartagri.security.JwtAuthenticationFilter;
// import lombok.RequiredArgsConstructor;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.web.SecurityFilterChain;
// import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.CorsConfigurationSource;
// import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// import java.util.List;

// /**
//  * Stateless resource-server style security: no login here (that only
//  * happens in auth-service). Requests arrive already carrying a JWT which
//  * JwtAuthenticationFilter verifies against the shared signing secret.
//  */
// @Configuration
// @EnableWebSecurity
// @EnableMethodSecurity(prePostEnabled = true)
// @RequiredArgsConstructor
// public class SecurityConfig {

//     private final JwtAuthenticationFilter jwtAuthenticationFilter;
//     private final JwtAuthenticationEntryPoint authenticationEntryPoint;

//     @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:*}")
//     private String allowedOrigins;

//     private static final String[] PUBLIC_GET_ENDPOINTS = {
//             "/weather/**"
//     };

//     @Bean
//     public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//         http
//                 .csrf(csrf -> csrf.disable())
//                 .cors(cors -> cors.configurationSource(corsConfigurationSource()))
//                 .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//                 .exceptionHandling(eh -> eh.authenticationEntryPoint(authenticationEntryPoint))
//                 .authorizeHttpRequests(auth -> auth
//                         .requestMatchers("/actuator/health", "/actuator/info").permitAll()
//                         .requestMatchers(org.springframework.http.HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
//                         .anyRequest().authenticated()
//                 )
//                 .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

//         return http.build();
//     }

//     @Bean
//     public CorsConfigurationSource corsConfigurationSource() {
//         CorsConfiguration configuration = new CorsConfiguration();
//         configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
//         configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
//         configuration.setAllowedHeaders(List.of("*"));
//         configuration.setAllowCredentials(true);

//         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//         source.registerCorsConfiguration("/**", configuration);
//         return source;
//     }
// }


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

/**
 * Weather Service Security Configuration.
 *
 * CORS is handled by the API Gateway.
 * This service should NOT add its own CORS headers because requests
 * from the frontend go through the API Gateway.
 *
 * JWT authentication is still handled here for protected endpoints.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    /**
     * Public GET endpoints.
     *
     * The frontend can access weather information without sending
     * a JWT token.
     */
    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/weather/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // Disable CSRF because this is a stateless REST API.
                .csrf(csrf -> csrf.disable())

                // IMPORTANT:
                // Do NOT configure CORS here.
                // API Gateway is responsible for CORS.
                
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(eh ->
                        eh.authenticationEntryPoint(authenticationEntryPoint)
                )

                .authorizeHttpRequests(auth -> auth

                        // Actuator endpoints
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()

                        // Public weather GET APIs
                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                PUBLIC_GET_ENDPOINTS
                        ).permitAll()

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )

                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}