package com.clinica.dental.api.dto.prescription;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record PrescriptionResponse(
        Long id,
        Long appointmentId,

        Long patientId,
        String patientName,

        Long dentistId,
        String dentistName,

        String diagnosis,
        String indications,
        String notes,
        LocalDate nextControlDate,

        List<PrescriptionItemResponse> items,

        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}