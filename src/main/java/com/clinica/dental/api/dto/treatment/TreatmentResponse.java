package com.clinica.dental.api.dto.treatment;

import java.math.BigDecimal;

public record TreatmentResponse(
        Long id,
        String name,
        String category,
        Integer defaultDurationMinutes,
        Integer minDurationMinutes,
        Integer maxDurationMinutes,
        BigDecimal basePrice,
        Boolean active
) {
}