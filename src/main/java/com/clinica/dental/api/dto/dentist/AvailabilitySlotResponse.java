package com.clinica.dental.api.dto.dentist;

import java.time.OffsetDateTime;

public record AvailabilitySlotResponse(
        OffsetDateTime start,
        OffsetDateTime end,
        boolean available
) {
}
