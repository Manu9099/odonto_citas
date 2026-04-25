package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.model.Treatment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TreatmentRepository extends JpaRepository<Treatment, Long> {

    List<Treatment> findByActiveTrueOrderByCategoryAscNameAsc();

    List<Treatment> findAllByOrderByCategoryAscNameAsc();

    boolean existsByNameIgnoreCase(String name);
}