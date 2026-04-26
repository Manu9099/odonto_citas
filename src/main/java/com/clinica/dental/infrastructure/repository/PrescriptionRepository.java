package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByAppointmentId(Long appointmentId);

    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    boolean existsByAppointmentId(Long appointmentId);
}