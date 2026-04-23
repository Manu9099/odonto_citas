package com.clinica.dental.application.service.payment;

import com.clinica.dental.domain.model.Payment;
import org.springframework.stereotype.Component;

@Component
public class StripeStubGateway implements PaymentGateway {

    @Override
    public PaymentGatewayResult createCheckout(Payment payment) {
        String externalId = "st-" + payment.getAppointment().getId() + "-" + System.currentTimeMillis();
        String checkoutUrl = "https://example-checkout.local/stripe/" + externalId;
        return new PaymentGatewayResult(externalId, checkoutUrl, "{\"provider\":\"STRIPE\",\"mode\":\"stub\"}");
    }

    @Override
    public String getName() {
        return "STRIPE";
    }
}
