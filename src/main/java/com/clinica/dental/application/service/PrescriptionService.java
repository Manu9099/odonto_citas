package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.prescription.PrescriptionCreateRequest;
import com.clinica.dental.api.dto.prescription.PrescriptionResponse;
import com.clinica.dental.common.exception.BadRequestException;
import com.clinica.dental.common.exception.NotFoundException;
import com.clinica.dental.application.mapper.ApiMapper;
import com.clinica.dental.domain.enums.AppointmentStatus;
import com.clinica.dental.domain.model.Appointment;
import com.clinica.dental.domain.model.Prescription;
import com.clinica.dental.domain.model.PrescriptionItem;
import com.clinica.dental.infrastructure.repository.AppointmentRepository;
import com.clinica.dental.infrastructure.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public PrescriptionResponse create(PrescriptionCreateRequest request) {
        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new NotFoundException("Cita no encontrada"));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "Solo se puede crear receta para una cita completada"
            );
        }

        if (prescriptionRepository.existsByAppointmentId(appointment.getId())) {
            throw new BadRequestException(
                    "Esta cita ya tiene una receta registrada"
            );
        }

        Prescription prescription = Prescription.builder()
                .appointment(appointment)
                .patient(appointment.getPatient())
                .dentist(appointment.getDentist())
                .diagnosis(clean(request.diagnosis()))
                .indications(clean(request.indications()))
                .notes(clean(request.notes()))
                .nextControlDate(request.nextControlDate())
                .build();

        List<PrescriptionItem> items = Optional.ofNullable(request.items())
                .orElse(Collections.emptyList())
                .stream()
                .map(item -> PrescriptionItem.builder()
                        .medicationName(clean(item.medicationName()))
                        .dose(clean(item.dose()))
                        .frequency(clean(item.frequency()))
                        .duration(clean(item.duration()))
                        .instructions(clean(item.instructions()))
                        .build())
                .toList();

        items.forEach(prescription::addItem);

        Prescription saved = prescriptionRepository.save(prescription);

        return ApiMapper.toPrescriptionResponse(saved);
    }

    @Transactional(readOnly = true)
    public Optional<PrescriptionResponse> getByAppointment(Long appointmentId) {
        return prescriptionRepository.findByAppointmentId(appointmentId)
                .map(ApiMapper::toPrescriptionResponse);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(ApiMapper::toPrescriptionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new NotFoundException("Receta no encontrada"));

        return ApiMapper.toPrescriptionResponse(prescription);
    }

    private String clean(String value) {
        if (value == null) return null;

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }
}