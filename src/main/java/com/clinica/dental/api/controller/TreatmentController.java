package com.clinica.dental.api.controller;

import com.clinica.dental.api.dto.treatment.TreatmentResponse;
import com.clinica.dental.application.service.TreatmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/treatments")
@RequiredArgsConstructor
public class TreatmentController {

    private final TreatmentService treatmentService;

    @GetMapping("/active")
    public List<TreatmentResponse> getActive() {
        return treatmentService.findActive();
    }

    @GetMapping
    public List<TreatmentResponse> getAll() {
        return treatmentService.findAll();
    }
}