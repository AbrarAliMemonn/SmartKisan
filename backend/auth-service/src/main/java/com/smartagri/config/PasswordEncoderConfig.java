package com.smartagri.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Kept separate from SecurityConfig on purpose: CustomOAuth2UserService
 * depends on PasswordEncoder, and SecurityConfig depends on
 * CustomOAuth2UserService (constructor injection for the security filter
 * chain wiring). Defining the encoder bean inside SecurityConfig itself
 * would create a circular dependency between the two beans.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
