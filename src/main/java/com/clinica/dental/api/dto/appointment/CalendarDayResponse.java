package com.clinica.dental.api.dto.appointment;

import java.time.LocalDate;
import java.util.List;

public record CalendarDayResponse(
        LocalDate date,
        String label,
        List<AppointmentResponse> appointments
) {
}
