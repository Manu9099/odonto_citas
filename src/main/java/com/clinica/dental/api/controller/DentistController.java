package com.clinica.dental.api.controller;

import com.clinica.dental.api.dto.dentist.*;
import com.clinica.dental.application.service.DentistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dentists")
@RequiredArgsConstructor
public class DentistController {

    private final DentistService dentistService;

    @GetMapping
    public List<DentistResponse> getAll() {
        return dentistService.findAll();
    }

    @GetMapping("/{dentistId}/schedules")
    public List<DentistScheduleResponse> getSchedules(@PathVariable Long dentistId) {
        return dentistService.getDentistSchedules(dentistId);
    }

    @GetMapping("/{dentistId}/availability")
    public List<AvailabilitySlotResponse> getAvailability(
            @PathVariable Long dentistId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return dentistService.getAvailability(dentistId, date);
    }

    @PostMapping("/me/schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public DentistScheduleResponse createOwnSchedule(@Valid @RequestBody DentistScheduleRequest request) {
        return dentistService.addOwnSchedule(request);
    }
}
