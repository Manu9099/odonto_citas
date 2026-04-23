package com.clinica.dental.application.service.payment;

import com.clinica.dental.domain.model.Payment;
import org.springframework.stereotype.Component;

@Component
public class MercadoPagoStubGateway implements PaymentGateway {

    @Override
    public PaymentGatewayResult createCheckout(Payment payment) {
        String externalId = "mp-" + payment.getAppointment().getId() + "-" + System.currentTimeMillis();
        String checkoutUrl = "https://example-checkout.local/mercadopago/" + externalId;
        return new PaymentGatewayResult(externalId, checkoutUrl, "{\"provider\":\"MERCADOPAGO\",\"mode\":\"stub\"}");
    }

    @Override
    public String getName() {
        return "MERCADOPAGO";
    }
}
