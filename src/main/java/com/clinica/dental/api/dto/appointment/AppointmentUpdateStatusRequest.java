package com.clinica.dental.api.dto.appointment;

import com.clinica.dental.domain.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public record AppointmentUpdateStatusRequest(
        @NotNull AppointmentStatus status,
        String cancelledReason
) {
}
