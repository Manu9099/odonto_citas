package com.clinica.dental.api.dto.prescription;

import jakarta.validation.constraints.NotBlank;

public record PrescriptionItemRequest(
        @NotBlank String medicationName,
        String dose,
        String frequency,
        String duration,
        String instructions
) {
}