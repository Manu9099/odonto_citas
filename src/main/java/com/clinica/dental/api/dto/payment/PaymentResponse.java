package com.clinica.dental.api.dto.payment;

import com.clinica.dental.domain.enums.PaymentProvider;
import com.clinica.dental.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long id,
        Long appointmentId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        PaymentProvider provider,
        String providerPaymentId,
        String providerRef,
        OffsetDateTime paidAt,
        String checkoutUrl
) {
}
