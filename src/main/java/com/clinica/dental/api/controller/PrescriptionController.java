package com.clinica.dental.api.controller;

import com.clinica.dental.api.dto.prescription.PrescriptionCreateRequest;
import com.clinica.dental.api.dto.prescription.PrescriptionResponse;
import com.clinica.dental.application.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.clinica.dental.application.service.PrescriptionPdfService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final PrescriptionPdfService prescriptionPdfService;
    @PostMapping
    public PrescriptionResponse create(
            @Valid @RequestBody PrescriptionCreateRequest request
    ) {
        return prescriptionService.create(request);
    }

    @GetMapping("/{prescriptionId}")
    public PrescriptionResponse getById(@PathVariable Long prescriptionId) {
        return prescriptionService.getById(prescriptionId);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<PrescriptionResponse> getByAppointment(
            @PathVariable Long appointmentId
    ) {
        return prescriptionService.getByAppointment(appointmentId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
    @GetMapping("/{prescriptionId}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long prescriptionId) {
        byte[] pdf = prescriptionPdfService.generatePdf(prescriptionId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename("receta-" + prescriptionId + ".pdf")
                        .build()
        );

        return ResponseEntity
                .ok()
                .headers(headers)
                .body(pdf);
    }

    @GetMapping("/patient/{patientId}")
    public List<PrescriptionResponse> getByPatient(
            @PathVariable Long patientId
    ) {
        return prescriptionService.getByPatient(patientId);
    }
}