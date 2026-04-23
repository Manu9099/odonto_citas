package com.clinica.dental.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterPatientRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        String phone,
        LocalDate dateOfBirth,
        String dni,
        String emergencyContact,
        String emergencyPhone,
        String medicalNotes
) {
}
