package com.clinica.dental.config;

import com.clinica.dental.domain.enums.UserRole;
import com.clinica.dental.domain.model.User;
import com.clinica.dental.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class SeedConfig {

    @Bean
    @Profile("local")
    public CommandLineRunner seedAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            userRepository.findByEmailIgnoreCase("admin@clinic.local").orElseGet(() ->
                    userRepository.save(User.builder()
                            .fullName("Admin Demo")
                            .email("admin@clinic.local")
                            .phone("999999999")
                            .passwordHash(passwordEncoder.encode("Admin123*"))
                            .role(UserRole.ADMIN)
                            .active(true)
                            .build())
            );
        };
    }
}
