package com.smartagri;

import com.smartagri.entity.Role;
import com.smartagri.entity.User;
import com.smartagri.entity.UserType;
import com.smartagri.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableDiscoveryClient
@EnableScheduling
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "junejoabuhurera52@gmail.com";
            userRepository.findByEmail(adminEmail).ifPresentOrElse(
                user -> {
                    user.setName("Abu Hurera Junejo");
                    user.setRole(Role.ADMIN);
                    user.setUserType(UserType.ADMIN);
                    user.setEmailVerified(true);
                    user.setPasswordHash(passwordEncoder.encode("112233"));
                    userRepository.save(user);
                },
                () -> {
                    User admin = User.builder()
                            .name("Abu Hurera Junejo")
                            .email(adminEmail)
                            .passwordHash(passwordEncoder.encode("112233"))
                            .role(Role.ADMIN)
                            .userType(UserType.ADMIN)
                            .emailVerified(true)
                            .phone("+92 300 9876543")
                            .location("Karachi, Sindh, Pakistan")
                            .build();
                    userRepository.save(admin);
                }
            );

            // Also ensure typo version remains supported if present
            userRepository.findByEmail("juenjoabuhurera52@gmail.com").ifPresent(user -> {
                user.setPasswordHash(passwordEncoder.encode("112233"));
                userRepository.save(user);
            });

            // Ensure old admin is demoted if present
            userRepository.findByEmail("admin@smartagri.com").ifPresent(user -> {
                user.setRole(Role.USER);
                user.setUserType(UserType.FARMER);
                userRepository.save(user);
            });
        };
    }
}

