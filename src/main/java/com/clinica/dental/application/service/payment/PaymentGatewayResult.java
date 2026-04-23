package com.clinica.dental.application.service.payment;

public record PaymentGatewayResult(
        String externalPaymentId,
        String checkoutUrl,
        String rawReference
) {
}
