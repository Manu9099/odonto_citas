package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.model.Patient;
import com.clinica.dental.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUser(User user);
    boolean existsByDni(String dni);
}
