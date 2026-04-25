package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.treatment.TreatmentResponse;
import com.clinica.dental.application.mapper.ApiMapper;
import com.clinica.dental.infrastructure.repository.TreatmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TreatmentService {

    private final TreatmentRepository treatmentRepository;

    @Transactional(readOnly = true)
    public List<TreatmentResponse> findActive() {
        return treatmentRepository.findByActiveTrueOrderByCategoryAscNameAsc()
                .stream()
                .map(ApiMapper::toTreatmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TreatmentResponse> findAll() {
        return treatmentRepository.findAllByOrderByCategoryAscNameAsc()
                .stream()
                .map(ApiMapper::toTreatmentResponse)
                .toList();
    }
}