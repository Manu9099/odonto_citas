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
    public CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            User admin = userRepository.findByEmailIgnoreCase("admin@clinic.local")
                    .orElseGet(() -> User.builder()
                            .fullName("Admin Demo")
                            .email("admin@clinic.local")
                            .phone("999999999")
                            .role(UserRole.ADMIN)
                            .active(true)
                            .build());

            admin.setFullName("Admin Demo");
            admin.setEmail("admin@clinic.local");
            admin.setPhone("999999999");
            admin.setRole(UserRole.ADMIN);
            admin.setActive(true);
            admin.setPasswordHash(passwordEncoder.encode("Admin123*"));

            userRepository.save(admin);

            System.out.println("✅ Admin local reseteado:");
            System.out.println("   email: admin@clinic.local");
            System.out.println("   password: Admin123*");
        };
    }
}