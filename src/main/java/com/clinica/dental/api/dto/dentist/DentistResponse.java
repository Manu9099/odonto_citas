package com.clinica.dental.api.dto.dentist;

public record DentistResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String phone,
        String specialty,
        String licenseNumber,
        String bio,
        String avatarUrl
) {
}
