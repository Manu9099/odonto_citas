package com.clinica.dental.api.dto.dentist;

import java.time.LocalTime;

public record DentistScheduleResponse(
        Long id,
        Short dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        Short slotMinutes,
        Boolean active
) {
}
