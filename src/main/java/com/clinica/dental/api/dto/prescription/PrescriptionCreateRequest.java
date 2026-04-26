package com.clinica.dental.api.dto.prescription;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record PrescriptionCreateRequest(
        @NotNull Long appointmentId,
        String diagnosis,
        @NotBlank String indications,
        LocalDate nextControlDate,
        String notes,
        @Valid List<PrescriptionItemRequest> items
) {
}