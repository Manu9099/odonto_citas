package com.clinica.dental.application.service.payment;

import com.clinica.dental.domain.model.Payment;

public interface PaymentGateway {
    PaymentGatewayResult createCheckout(Payment payment);
    String getName();
}
