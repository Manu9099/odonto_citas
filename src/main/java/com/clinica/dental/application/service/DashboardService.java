package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.dashboard.DashboardDayRevenueResponse;
import com.clinica.dental.api.dto.dashboard.DashboardSummaryResponse;
import com.clinica.dental.api.dto.dashboard.PaymentStatusSummaryResponse;
import com.clinica.dental.domain.enums.AppointmentStatus;
import com.clinica.dental.domain.enums.PaymentStatus;
import com.clinica.dental.domain.model.Appointment;
import com.clinica.dental.domain.model.Payment;
import com.clinica.dental.infrastructure.repository.AppointmentRepository;
import com.clinica.dental.infrastructure.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final ZoneId LIMA_ZONE = ZoneId.of("America/Lima");

    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        List<Appointment> appointments = appointmentRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        LocalDate today = LocalDate.now(LIMA_ZONE);
        OffsetDateTime startOfToday = today.atStartOfDay(LIMA_ZONE).toOffsetDateTime();
        OffsetDateTime startOfTomorrow = today.plusDays(1).atStartOfDay(LIMA_ZONE).toOffsetDateTime();

        long todayAppointments = appointments.stream()
                .filter(appointment ->
                        !appointment.getScheduledAt().isBefore(startOfToday)
                                && appointment.getScheduledAt().isBefore(startOfTomorrow)
                )
                .count();

        long pendingAppointments = countAppointmentsByStatus(appointments, AppointmentStatus.PENDING);
        long confirmedAppointments = countAppointmentsByStatus(appointments, AppointmentStatus.CONFIRMED);
        long completedAppointments = countAppointmentsByStatus(appointments, AppointmentStatus.COMPLETED);
        long cancelledAppointments = countAppointmentsByStatus(appointments, AppointmentStatus.CANCELLED);
        long noShowAppointments = countAppointmentsByStatus(appointments, AppointmentStatus.NO_SHOW);

        Set<Long> approvedPaymentAppointmentIds = payments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.APPROVED)
                .map(payment -> payment.getAppointment().getId())
                .collect(java.util.stream.Collectors.toSet());

        long paidAppointments = approvedPaymentAppointmentIds.size();

        long unpaidAppointments = appointments.stream()
                .filter(appointment -> appointment.getStatus() != AppointmentStatus.CANCELLED)
                .filter(appointment -> !approvedPaymentAppointmentIds.contains(appointment.getId()))
                .count();

        long pendingPayments = payments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.PENDING)
                .count();

        BigDecimal approvedRevenue = sumPaymentsByStatus(payments, PaymentStatus.APPROVED);
        BigDecimal pendingRevenue = sumPaymentsByStatus(payments, PaymentStatus.PENDING);

        List<PaymentStatusSummaryResponse> paymentsByStatus = Arrays.stream(PaymentStatus.values())
                .map(status -> new PaymentStatusSummaryResponse(
                        status,
                        payments.stream().filter(payment -> payment.getStatus() == status).count(),
                        sumPaymentsByStatus(payments, status)
                ))
                .toList();

        List<DashboardDayRevenueResponse> revenueByDay = IntStream.rangeClosed(0, 6)
                .mapToObj(index -> {
                    LocalDate date = today.minusDays(6L - index);

                    BigDecimal amount = payments.stream()
                            .filter(payment -> payment.getStatus() == PaymentStatus.APPROVED)
                            .filter(payment -> payment.getPaidAt() != null)
                            .filter(payment -> payment.getPaidAt().atZoneSameInstant(LIMA_ZONE).toLocalDate().equals(date))
                            .map(Payment::getAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return new DashboardDayRevenueResponse(date, amount);
                })
                .toList();

        return new DashboardSummaryResponse(
                todayAppointments,
                pendingAppointments,
                confirmedAppointments,
                completedAppointments,
                cancelledAppointments,
                noShowAppointments,
                paidAppointments,
                unpaidAppointments,
                pendingPayments,
                approvedRevenue,
                pendingRevenue,
                paymentsByStatus,
                revenueByDay
        );
    }

    private long countAppointmentsByStatus(
            List<Appointment> appointments,
            AppointmentStatus status
    ) {
        return appointments.stream()
                .filter(appointment -> appointment.getStatus() == status)
                .count();
    }

    private BigDecimal sumPaymentsByStatus(
            List<Payment> payments,
            PaymentStatus status
    ) {
        return payments.stream()
                .filter(payment -> payment.getStatus() == status)
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}