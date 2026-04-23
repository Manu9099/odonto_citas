package com.clinica.dental.api.dto.payment;

import com.clinica.dental.domain.enums.PaymentProvider;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PaymentCreateRequest(
        @NotNull Long appointmentId,
        @NotNull @DecimalMin("0.0") BigDecimal amount,
        String currency,
        @NotNull PaymentProvider provider
) {
}
