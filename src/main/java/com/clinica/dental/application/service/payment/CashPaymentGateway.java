package com.clinica.dental.application.service.payment;

import com.clinica.dental.domain.model.Payment;
import org.springframework.stereotype.Component;

@Component
public class CashPaymentGateway implements PaymentGateway {

    @Override
    public PaymentGatewayResult createCheckout(Payment payment) {
        return new PaymentGatewayResult(
                "cash-" + payment.getAppointment().getId(),
                null,
                "Pago en local"
        );
    }

    @Override
    public String getName() {
        return "CASH";
    }
}
