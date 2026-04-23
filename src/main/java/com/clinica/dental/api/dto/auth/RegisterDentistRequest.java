package com.clinica.dental.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterDentistRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        String phone,
        @NotBlank String licenseNumber,
        String specialty,
        String bio,
        String avatarUrl
) {
}
