package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.appointment.*;
import com.clinica.dental.application.mapper.ApiMapper;
import com.clinica.dental.common.exception.*;
import com.clinica.dental.domain.enums.*;
import com.clinica.dental.domain.model.*;
import com.clinica.dental.infrastructure.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DentistRepository dentistRepository;
    private final PatientRepository patientRepository;
    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public AppointmentResponse create(AppointmentCreateRequest request) {
        User user = currentUserService.getCurrentUser();
        if (user.getRole() != UserRole.PATIENT && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Solo un paciente o admin puede crear citas");
        }

        Patient patient = user.getRole() == UserRole.ADMIN
                ? patientRepository.findAll().stream().findFirst().orElseThrow(() -> new NotFoundException("No hay pacientes registrados"))
                : patientRepository.findByUser(user).orElseThrow(() -> new NotFoundException("Perfil de paciente no encontrado"));

        Dentist dentist = dentistRepository.findById(request.dentistId())
                .orElseThrow(() -> new NotFoundException("Odontólogo no encontrado"));

        int duration = request.durationMinutes() == null ? 30 : request.durationMinutes();

        OffsetDateTime newStart = request.scheduledAt();
        OffsetDateTime newEnd = newStart.plusMinutes(duration);

        List<Appointment> sameDayAppointments = appointmentRepository.findByDentistIdAndScheduledAtBetweenOrderByScheduledAtAsc(
                dentist.getId(),
                newStart.minusHours(12),
                newEnd.plusHours(12)
        );

        boolean overlaps = sameDayAppointments.stream().anyMatch(existing ->
                existing.getScheduledAt().isBefore(newEnd) && existing.getEndsAt().isAfter(newStart)
                        && existing.getStatus() != AppointmentStatus.CANCELLED
        );
        if (overlaps) {
            throw new ConflictException("El odontólogo ya tiene una cita en ese horario");
        }

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .dentist(dentist)
                .patient(patient)
                .scheduledAt(newStart)
                .durationMinutes(duration)
                .status(AppointmentStatus.PENDING)
                .treatmentType(request.treatmentType())
                .notes(request.notes())
                .build());

        scheduleReminderIfNeeded(appointment);

        return ApiMapper.toAppointmentResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments() {
        User user = currentUserService.getCurrentUser();

        if (user.getRole() == UserRole.PATIENT) {
            Patient patient = patientRepository.findByUser(user)
                    .orElseThrow(() -> new NotFoundException("Perfil de paciente no encontrado"));
            return appointmentRepository.findByPatientIdOrderByScheduledAtDesc(patient.getId())
                    .stream()
                    .map(ApiMapper::toAppointmentResponse)
                    .toList();
        }

        if (user.getRole() == UserRole.DENTIST) {
            Dentist dentist = dentistRepository.findByUser(user)
                    .orElseThrow(() -> new NotFoundException("Perfil de odontólogo no encontrado"));
            return appointmentRepository.findByDentistIdOrderByScheduledAtAsc(dentist.getId())
                    .stream()
                    .map(ApiMapper::toAppointmentResponse)
                    .toList();
        }

        return appointmentRepository.findAll().stream().map(ApiMapper::toAppointmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public CalendarDayResponse getOwnCalendarDay(LocalDate date) {
        User user = currentUserService.getCurrentUser();

        ZoneId zoneId = ZoneId.of("America/Lima");
        OffsetDateTime start = date.atStartOfDay(zoneId).toOffsetDateTime();
        OffsetDateTime end = date.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

        List<Appointment> appointments;
        if (user.getRole() == UserRole.DENTIST) {
            Dentist dentist = dentistRepository.findByUser(user).orElseThrow(() -> new NotFoundException("Perfil de odontólogo no encontrado"));
            appointments = appointmentRepository.findByDentistIdAndScheduledAtBetweenOrderByScheduledAtAsc(dentist.getId(), start, end);
        } else if (user.getRole() == UserRole.PATIENT) {
            Patient patient = patientRepository.findByUser(user).orElseThrow(() -> new NotFoundException("Perfil de paciente no encontrado"));
            appointments = appointmentRepository.findByPatientIdOrderByScheduledAtDesc(patient.getId()).stream()
                    .filter(a -> !a.getScheduledAt().isBefore(start) && a.getScheduledAt().isBefore(end))
                    .toList();
        } else {
            appointments = appointmentRepository.findAll().stream()
                    .filter(a -> !a.getScheduledAt().isBefore(start) && a.getScheduledAt().isBefore(end))
                    .sorted((a, b) -> a.getScheduledAt().compareTo(b.getScheduledAt()))
                    .toList();
        }

        String monthName = date.getMonth().getDisplayName(java.time.format.TextStyle.FULL, Locale.forLanguageTag("es-PE"));
        String label = "Hoy " + switch (date.getDayOfWeek()) {
            case MONDAY -> "lunes";
            case TUESDAY -> "martes";
            case WEDNESDAY -> "miércoles";
            case THURSDAY -> "jueves";
            case FRIDAY -> "viernes";
            case SATURDAY -> "sábado";
            case SUNDAY -> "domingo";
        } + " " + date.getDayOfMonth() + " de " + monthName;

        return new CalendarDayResponse(date, label, appointments.stream().map(ApiMapper::toAppointmentResponse).toList());
    }

    @Transactional
    public AppointmentResponse updateStatus(Long appointmentId, AppointmentUpdateStatusRequest request) {
        User user = currentUserService.getCurrentUser();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Cita no encontrada"));

        boolean canModify =
                user.getRole() == UserRole.ADMIN ||
                        (user.getRole() == UserRole.PATIENT && appointment.getPatient().getUser().getId().equals(user.getId())) ||
                        (user.getRole() == UserRole.DENTIST && appointment.getDentist().getUser().getId().equals(user.getId()));

        if (!canModify) {
            throw new AccessDeniedException("No puedes modificar esta cita");
        }

        if (request.status() == AppointmentStatus.CANCELLED && (request.cancelledReason() == null || request.cancelledReason().isBlank())) {
            throw new BadRequestException("Debes indicar el motivo de cancelación");
        }

        appointment.setStatus(request.status());
        appointment.setCancelledReason(request.cancelledReason());
        appointmentRepository.save(appointment);

        return ApiMapper.toAppointmentResponse(appointment);
    }

    private void scheduleReminderIfNeeded(Appointment appointment) {
        OffsetDateTime reminderAt = appointment.getScheduledAt().minusHours(24);
        if (reminderAt.isAfter(OffsetDateTime.now())) {
            if (!notificationRepository.existsByAppointmentIdAndTypeAndChannel(
                    appointment.getId(), "REMINDER_24H", NotificationChannel.EMAIL)) {
                notificationRepository.save(Notification.builder()
                        .appointment(appointment)
                        .type("REMINDER_24H")
                        .channel(NotificationChannel.EMAIL)
                        .status(NotificationStatus.PENDING)
                        .scheduledFor(reminderAt)
                        .build());
            }
        }
    }
}
