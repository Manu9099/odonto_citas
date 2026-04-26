package com.clinica.dental.api.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        Long todayAppointments,
        Long pendingAppointments,
        Long confirmedAppointments,
        Long completedAppointments,
        Long cancelledAppointments,
        Long noShowAppointments,

        Long paidAppointments,
        Long unpaidAppointments,
        Long pendingPayments,

        BigDecimal approvedRevenue,
        BigDecimal pendingRevenue,

        List<PaymentStatusSummaryResponse> paymentsByStatus,
        List<DashboardDayRevenueResponse> revenueByDay
) {
}