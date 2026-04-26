package com.clinica.dental.application.mapper;

import com.clinica.dental.api.dto.appointment.AppointmentResponse;
import com.clinica.dental.api.dto.dentist.*;
import com.clinica.dental.api.dto.payment.PaymentResponse;
import com.clinica.dental.domain.model.*;
import com.clinica.dental.api.dto.treatment.TreatmentResponse;
import com.clinica.dental.api.dto.prescription.PrescriptionItemResponse;
import com.clinica.dental.api.dto.prescription.PrescriptionResponse;
import com.clinica.dental.domain.model.Prescription;
import com.clinica.dental.domain.model.PrescriptionItem;
public final class ApiMapper {

    private ApiMapper() {}

    public static DentistResponse toDentistResponse(Dentist dentist) {
        return new DentistResponse(
                dentist.getId(),
                dentist.getUser().getId(),
                dentist.getUser().getFullName(),
                dentist.getUser().getEmail(),
                dentist.getUser().getPhone(),
                dentist.getSpecialty(),
                dentist.getLicenseNumber(),
                dentist.getBio(),
                dentist.getAvatarUrl()
        );
    }

    public static DentistScheduleResponse toScheduleResponse(DentistSchedule schedule) {
        return new DentistScheduleResponse(
                schedule.getId(),
                schedule.getDayOfWeek(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getSlotMinutes(),
                schedule.getActive()
        );
    }

    public static AppointmentResponse toAppointmentResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getDentist().getId(),
                appointment.getDentist().getUser().getFullName(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUser().getFullName(),
                appointment.getScheduledAt(),
                appointment.getEndsAt(),
                appointment.getDurationMinutes(),
                appointment.getStatus(),
                appointment.getTreatment() != null ? appointment.getTreatment().getId() : null,
                appointment.getTreatmentType(),
                appointment.getNotes(),
                appointment.getCancelledReason()
        );
    }

    public static PaymentResponse toPaymentResponse(Payment payment, String checkoutUrl) {
        return new PaymentResponse(
                payment.getId(),
                payment.getAppointment().getId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                payment.getProvider(),
                payment.getProviderPaymentId(),
                payment.getProviderRef(),
                payment.getPaidAt(),
                checkoutUrl
        );
    }
    public static TreatmentResponse toTreatmentResponse(Treatment treatment) {
        return new TreatmentResponse(
                treatment.getId(),
                treatment.getName(),
                treatment.getCategory(),
                treatment.getDefaultDurationMinutes(),
                treatment.getMinDurationMinutes(),
                treatment.getMaxDurationMinutes(),
                treatment.getBasePrice(),
                treatment.getActive()
        );
    }

    public static PrescriptionResponse toPrescriptionResponse(Prescription prescription) {
        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getAppointment().getId(),

                prescription.getPatient().getId(),
                prescription.getPatient().getUser().getFullName(),

                prescription.getDentist().getId(),
                prescription.getDentist().getUser().getFullName(),

                prescription.getDiagnosis(),
                prescription.getIndications(),
                prescription.getNotes(),
                prescription.getNextControlDate(),

                prescription.getItems()
                        .stream()
                        .map(ApiMapper::toPrescriptionItemResponse)
                        .toList(),

                prescription.getCreatedAt(),
                prescription.getUpdatedAt()
        );
    }

    public static PrescriptionItemResponse toPrescriptionItemResponse(
            PrescriptionItem item
    ) {
        return new PrescriptionItemResponse(
                item.getId(),
                item.getMedicationName(),
                item.getDose(),
                item.getFrequency(),
                item.getDuration(),
                item.getInstructions()
        );
    }

}
