package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.payment.PaymentCreateRequest;
import com.clinica.dental.api.dto.payment.PaymentResponse;
import com.clinica.dental.application.mapper.ApiMapper;
import com.clinica.dental.application.service.payment.PaymentGateway;
import com.clinica.dental.application.service.payment.PaymentGatewayResult;
import com.clinica.dental.common.exception.BadRequestException;
import com.clinica.dental.common.exception.ConflictException;
import com.clinica.dental.common.exception.NotFoundException;
import com.clinica.dental.domain.enums.PaymentProvider;
import com.clinica.dental.domain.enums.PaymentStatus;
import com.clinica.dental.domain.model.Appointment;
import com.clinica.dental.domain.model.Payment;
import com.clinica.dental.domain.model.Treatment;
import com.clinica.dental.infrastructure.repository.AppointmentRepository;
import com.clinica.dental.infrastructure.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

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

        BigDecimal amount = resolveAmountFromAppointment(appointment);

        Payment payment = paymentRepository.save(Payment.builder()
                .appointment(appointment)
                .amount(amount)
                .currency(resolveCurrency(request.currency()))
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

    private BigDecimal resolveAmountFromAppointment(Appointment appointment) {
        Treatment treatment = appointment.getTreatment();

        if (treatment == null) {
            throw new BadRequestException("La cita no tiene tratamiento asociado para calcular el monto");
        }

        BigDecimal basePrice = treatment.getBasePrice();

        if (basePrice == null || basePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El tratamiento no tiene un precio base válido");
        }

        return basePrice;
    }

    private String resolveCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "PEN";
        }

        return currency.trim().toUpperCase();
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