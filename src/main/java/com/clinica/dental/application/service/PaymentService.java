package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.payment.*;
import com.clinica.dental.application.mapper.ApiMapper;
import com.clinica.dental.application.service.payment.*;
import com.clinica.dental.common.exception.*;
import com.clinica.dental.domain.enums.PaymentProvider;
import com.clinica.dental.domain.enums.PaymentStatus;
import com.clinica.dental.domain.model.*;
import com.clinica.dental.infrastructure.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.clinica.dental.domain.enums.PaymentProvider;
import com.clinica.dental.domain.enums.PaymentStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final List<PaymentGateway> gateways;

    @Transactional
    public PaymentResponse create(PaymentCreateRequest request) {
        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new NotFoundException("Cita no encontrada"));

        if (paymentRepository.findByAppointmentId(appointment.getId()).isPresent()) {
            throw new ConflictException("La cita ya tiene un pago asociado");
        }

        Payment payment = paymentRepository.save(Payment.builder()
                .appointment(appointment)
                .amount(request.amount())
                .currency(request.currency() == null || request.currency().isBlank() ? "PEN" : request.currency())
                .provider(request.provider())
                .status(PaymentStatus.PENDING)
                .build());

        PaymentGateway gateway = gatewayByName(request.provider());
        PaymentGatewayResult result = gateway.createCheckout(payment);

        payment.setProviderPaymentId(result.externalPaymentId());
        payment.setProviderRef(result.rawReference());

        if (request.provider() == PaymentProvider.CASH) {
            payment.setStatus(PaymentStatus.APPROVED);
            payment.setPaidAt(OffsetDateTime.now());
        }

        paymentRepository.save(payment);

        return ApiMapper.toPaymentResponse(payment, result.checkoutUrl());
    }

    @Transactional(readOnly = true)
    public Optional<PaymentResponse> getByAppointment(Long appointmentId) {
        return paymentRepository.findByAppointmentId(appointmentId)
                .map(payment -> ApiMapper.toPaymentResponse(payment, null));
    }

    @Transactional
    public void markApproved(String providerPaymentId) {
        Payment payment = paymentRepository.findByProviderPaymentId(providerPaymentId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));

        payment.setStatus(PaymentStatus.APPROVED);
        payment.setPaidAt(OffsetDateTime.now());
        paymentRepository.save(payment);
    }

    private PaymentGateway gatewayByName(PaymentProvider provider) {
        Map<String, PaymentGateway> byName = gateways.stream()
                .collect(Collectors.toMap(PaymentGateway::getName, Function.identity()));
        PaymentGateway gateway = byName.get(provider.name());
        if (gateway == null) {
            throw new BadRequestException("No hay pasarela implementada para: " + provider.name());
        }
        return gateway;
    }
}
