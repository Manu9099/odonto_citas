package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.auth.*;
import com.clinica.dental.common.exception.*;
import com.clinica.dental.domain.enums.UserRole;
import com.clinica.dental.domain.model.*;
import com.clinica.dental.infrastructure.repository.*;
import com.clinica.dental.infrastructure.security.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DentistRepository dentistRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    @Transactional
    public AuthResponse registerPatient(RegisterPatientRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("Ya existe un usuario con ese email");
        }
        if (request.dni() != null && !request.dni().isBlank() && patientRepository.existsByDni(request.dni())) {
            throw new ConflictException("Ya existe un paciente con ese DNI");
        }

        User user = userRepository.save(User.builder()
                .email(request.email().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(UserRole.PATIENT)
                .active(true)
                .build());

        patientRepository.save(Patient.builder()
                .user(user)
                .dateOfBirth(request.dateOfBirth())
                .dni(blankToNull(request.dni()))
                .emergencyContact(request.emergencyContact())
                .emergencyPhone(request.emergencyPhone())
                .medicalNotes(request.medicalNotes())
                .build());

        return buildTokens(user.getEmail());
    }

    @Transactional
    public AuthResponse registerDentist(RegisterDentistRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("Ya existe un usuario con ese email");
        }
        if (dentistRepository.existsByLicenseNumberIgnoreCase(request.licenseNumber())) {
            throw new ConflictException("Ya existe un odontólogo con ese número de colegiatura/licencia");
        }

        User user = userRepository.save(User.builder()
                .email(request.email().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(UserRole.DENTIST)
                .active(true)
                .build());

        dentistRepository.save(Dentist.builder()
                .user(user)
                .licenseNumber(request.licenseNumber())
                .specialty(request.specialty())
                .bio(request.bio())
                .avatarUrl(request.avatarUrl())
                .build());

        return buildTokens(user.getEmail());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
            return buildTokens(request.email());
        } catch (BadCredentialsException ex) {
            throw new UnauthorizedException("Credenciales inválidas");
        }
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token inválido"));

        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new UnauthorizedException("Refresh token expirado");
        }

        return buildTokens(token.getUser().getEmail());
    }

    private AuthResponse buildTokens(String email) {
        AppUserDetails userDetails = (AppUserDetails) customUserDetailsService.loadUserByUsername(email);
        refreshTokenRepository.deleteByUser(userDetails.getUser());

        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(userDetails.getUser())
                .token(refreshToken)
                .expiresAt(OffsetDateTime.now().plusDays(30))
                .revoked(false)
                .build());

        return new AuthResponse(
                accessToken,
                refreshToken,
                userDetails.getUser().getId(),
                userDetails.getUser().getFullName(),
                userDetails.getUser().getEmail(),
                userDetails.getUser().getRole()
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
