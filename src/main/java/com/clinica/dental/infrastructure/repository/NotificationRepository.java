package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.enums.NotificationChannel;
import com.clinica.dental.domain.enums.NotificationStatus;
import com.clinica.dental.domain.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByAppointmentIdAndTypeAndChannel(
            Long appointmentId,
            String type,
            NotificationChannel channel
    );

    List<Notification> findByStatusAndScheduledForBefore(
            NotificationStatus status,
            OffsetDateTime now
    );
}