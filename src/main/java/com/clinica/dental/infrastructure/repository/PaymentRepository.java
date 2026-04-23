package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByAppointmentId(Long appointmentId);
    Optional<Payment> findByProviderPaymentId(String providerPaymentId);
}
