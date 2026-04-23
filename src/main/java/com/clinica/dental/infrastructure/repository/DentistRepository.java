package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.model.Dentist;
import com.clinica.dental.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DentistRepository extends JpaRepository<Dentist, Long> {
    Optional<Dentist> findByUser(User user);
    boolean existsByLicenseNumberIgnoreCase(String licenseNumber);
}
