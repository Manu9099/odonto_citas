package com.clinica.dental.api.dto.prescription;

public record PrescriptionItemResponse(
        Long id,
        String medicationName,
        String dose,
        String frequency,
        String duration,
        String instructions
) {
}
