package com.clinica.dental.api.dto.dentist;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record DentistScheduleRequest(
        @NotNull @Min(1) @Max(7) Short dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotNull @Min(10) @Max(240) Short slotMinutes
) {
}
