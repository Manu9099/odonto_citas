package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.enums.AppointmentStatus;
import com.clinica.dental.domain.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderByScheduledAtDesc(Long patientId);
    List<Appointment> findByDentistIdOrderByScheduledAtAsc(Long dentistId);
    List<Appointment> findByDentistIdAndScheduledAtBetweenOrderByScheduledAtAsc(Long dentistId, OffsetDateTime start, OffsetDateTime end);
    List<Appointment> findByStatusAndScheduledAtBetween(AppointmentStatus status, OffsetDateTime start, OffsetDateTime end);
    boolean existsByDentistIdAndScheduledAtLessThanAndScheduledAtGreaterThan(Long dentistId, OffsetDateTime end, OffsetDateTime start);
}
