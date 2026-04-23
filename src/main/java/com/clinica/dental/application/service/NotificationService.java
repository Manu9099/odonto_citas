package com.clinica.dental.application.service;

import com.clinica.dental.domain.enums.*;
import com.clinica.dental.domain.model.Notification;
import com.clinica.dental.infrastructure.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@local.test}")
    private String fromEmail;

    @Value("${app.notifications.mail-enabled:false}")
    private boolean mailEnabled;

    @Scheduled(fixedDelayString = "${app.notifications.dispatch-delay-ms:60000}")
    public void dispatchPendingNotifications() {
        List<Notification> pending = notificationRepository.findByStatusAndScheduledForBefore(
                NotificationStatus.PENDING,
                OffsetDateTime.now()
        );

        for (Notification notification : pending) {
            try {
                if (notification.getChannel() == NotificationChannel.EMAIL) {
                    sendEmail(notification);
                } else {
                    log.info("Canal {} pendiente de implementación para notificación {}", notification.getChannel(), notification.getId());
                }

                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(OffsetDateTime.now());
                notification.setErrorMessage(null);
            } catch (Exception ex) {
                notification.setStatus(NotificationStatus.FAILED);
                notification.setErrorMessage(ex.getMessage());
                log.error("Error enviando notificación {}", notification.getId(), ex);
            }
            notificationRepository.save(notification);
        }
    }

    private void sendEmail(Notification notification) {
        String to = notification.getAppointment().getDentist().getUser().getEmail();
        String subject = "Recordatorio de cita - " + notification.getAppointment().getPatient().getUser().getFullName();
        String body = """
                Tienes una cita programada para mañana.

                Paciente: %s
                Fecha y hora: %s
                Tratamiento: %s
                """
                .formatted(
                        notification.getAppointment().getPatient().getUser().getFullName(),
                        notification.getAppointment().getScheduledAt(),
                        notification.getAppointment().getTreatmentType()
                );

        if (!mailEnabled) {
            log.info("[MAIL-DISABLED] To={} Subject={} Body={}", to, subject, body);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
