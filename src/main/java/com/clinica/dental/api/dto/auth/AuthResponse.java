package com.clinica.dental.api.dto.auth;

import com.clinica.dental.domain.enums.UserRole;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        String fullName,
        String email,
        UserRole role
) {
}
