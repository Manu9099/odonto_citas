package com.clinica.dental.api.controller;

import com.clinica.dental.api.dto.common.ApiResponse;
import com.clinica.dental.api.dto.payment.*;
import com.clinica.dental.application.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@Valid @RequestBody PaymentCreateRequest request) {
        return paymentService.create(request);
    }

    @GetMapping("/appointment/{appointmentId}")
    public PaymentResponse getByAppointment(@PathVariable Long appointmentId) {
        return paymentService.getByAppointment(appointmentId);
    }

    @PostMapping("/webhooks/{provider}")
    public ApiResponse webhookApproved(@PathVariable String provider, @RequestParam String paymentId) {
        paymentService.markApproved(paymentId);
        return new ApiResponse("Webhook procesado para " + provider);
    }
}
