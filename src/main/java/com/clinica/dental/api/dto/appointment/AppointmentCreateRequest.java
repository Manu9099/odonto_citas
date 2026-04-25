package com.clinica.dental.api.dto.appointment;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record AppointmentCreateRequest(
        @NotNull Long dentistId,
        @NotNull @Future OffsetDateTime scheduledAt,
        @NotNull Long treatmentId,
        String notes
) {
}
