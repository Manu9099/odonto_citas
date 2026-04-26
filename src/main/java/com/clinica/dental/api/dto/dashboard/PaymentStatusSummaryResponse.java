package com.clinica.dental.api.dto.dashboard;

import com.clinica.dental.domain.enums.PaymentStatus;

import java.math.BigDecimal;

public record PaymentStatusSummaryResponse(
        PaymentStatus status,
        Long count,
        BigDecimal amount
) {
}