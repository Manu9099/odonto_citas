package com.clinica.dental.api.controller;

import com.clinica.dental.api.dto.appointment.*;
import com.clinica.dental.application.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse create(@Valid @RequestBody AppointmentCreateRequest request) {
        return appointmentService.create(request);
    }

    @GetMapping("/me")
    public List<AppointmentResponse> getMyAppointments() {
        return appointmentService.getMyAppointments();
    }

    @GetMapping("/calendar/day")
    public CalendarDayResponse getCalendarDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.getOwnCalendarDay(date);
    }

    @PatchMapping("/{appointmentId}/status")
    public AppointmentResponse updateStatus(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentUpdateStatusRequest request) {
        return appointmentService.updateStatus(appointmentId, request);
    }
}
