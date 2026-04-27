package com.clinica.dental.api.dto.appointment;

import com.clinica.dental.domain.enums.AppointmentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AppointmentResponse(
        Long id,
        Long dentistId,
        String dentistName,
        Long patientId,
        String patientName,
        OffsetDateTime scheduledAt,
        OffsetDateTime endsAt,
        Integer durationMinutes,
        AppointmentStatus status,
        Long treatmentId,
        String treatmentType,
        BigDecimal treatmentBasePrice,
        String notes,
        String cancelledReason
) {
}