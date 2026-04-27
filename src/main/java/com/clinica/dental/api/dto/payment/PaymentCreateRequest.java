package com.clinica.dental.api.dto.payment;

import com.clinica.dental.domain.enums.PaymentProvider;
import jakarta.validation.constraints.NotNull;

public record PaymentCreateRequest(
        @NotNull Long appointmentId,
        String currency,
        @NotNull PaymentProvider provider
) {
}