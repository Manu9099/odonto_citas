package com.clinica.dental.api.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardDayRevenueResponse(
        LocalDate date,
        BigDecimal amount
) {
}