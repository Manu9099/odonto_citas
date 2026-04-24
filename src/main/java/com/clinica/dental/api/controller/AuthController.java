package com.clinica.dental.api.controller;

import com.clinica.dental.api.dto.auth.*;
import com.clinica.dental.application.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.clinica.dental.domain.enums.UserRole;
import com.clinica.dental.domain.model.User;
import com.clinica.dental.infrastructure.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register/patient")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerPatient(@Valid @RequestBody RegisterPatientRequest request) {
        return authService.registerPatient(request);
    }

    @PostMapping("/register/dentist")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerDentist(@Valid @RequestBody RegisterDentistRequest request) {
        return authService.registerDentist(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }
    @PostMapping("/dev-reset-admin")
    public ResponseEntity<?> devResetAdmin() {
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

        return ResponseEntity.ok(Map.of(
                "email", "admin@clinic.local",
                "password", "Admin123*",
                "message", "Admin reseteado correctamente"
        ));
    }
}
