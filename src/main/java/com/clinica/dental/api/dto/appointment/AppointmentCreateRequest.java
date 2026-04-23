package com.clinica.dental.api.dto.appointment;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record AppointmentCreateRequest(
        @NotNull Long dentistId,
        @NotNull @Future OffsetDateTime scheduledAt,
        @Min(15) Integer durationMinutes,
        String treatmentType,
        String notes
) {
}
