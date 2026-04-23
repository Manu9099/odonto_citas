package com.clinica.dental.api.dto.notification;

import com.clinica.dental.domain.enums.NotificationChannel;
import com.clinica.dental.domain.enums.NotificationStatus;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        Long appointmentId,
        String type,
        NotificationChannel channel,
        NotificationStatus status,
        OffsetDateTime scheduledFor,
        OffsetDateTime sentAt,
        String errorMessage
) {
}
