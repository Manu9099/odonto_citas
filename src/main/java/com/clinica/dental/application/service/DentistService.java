package com.clinica.dental.application.service;

import com.clinica.dental.api.dto.dentist.*;
import com.clinica.dental.application.mapper.ApiMapper;
import com.clinica.dental.common.exception.*;
import com.clinica.dental.domain.enums.UserRole;
import com.clinica.dental.domain.model.*;
import com.clinica.dental.infrastructure.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DentistService {

    private final DentistRepository dentistRepository;
    private final DentistScheduleRepository scheduleRepository;
    private final AppointmentRepository appointmentRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<DentistResponse> findAll() {
        return dentistRepository.findAll().stream()
                .map(ApiMapper::toDentistResponse)
                .toList();
    }

    @Transactional
    public DentistScheduleResponse addOwnSchedule(DentistScheduleRequest request) {
        User user = currentUserService.getCurrentUser();
        if (user.getRole() != UserRole.DENTIST) {
            throw new org.springframework.security.access.AccessDeniedException("Solo un odontólogo puede registrar horarios");
        }

        Dentist dentist = dentistRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("Perfil de odontólogo no encontrado"));

        if (!request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("La hora fin debe ser mayor a la hora inicio");
        }

        DentistSchedule schedule = scheduleRepository.save(DentistSchedule.builder()
                .dentist(dentist)
                .dayOfWeek(request.dayOfWeek())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .slotMinutes(request.slotMinutes())
                .active(true)
                .build());

        return ApiMapper.toScheduleResponse(schedule);
    }

    @Transactional(readOnly = true)
    public List<DentistScheduleResponse> getDentistSchedules(Long dentistId) {
        return scheduleRepository.findByDentistIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(dentistId)
                .stream()
                .map(ApiMapper::toScheduleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailability(Long dentistId, LocalDate date) {
        short isoDay = (short) date.getDayOfWeek().getValue();
        List<DentistSchedule> schedules = scheduleRepository
                .findByDentistIdAndDayOfWeekAndActiveTrueOrderByStartTimeAsc(dentistId, isoDay);

        ZoneId zoneId = ZoneId.of("America/Lima");
        OffsetDateTime dayStart = date.atStartOfDay(zoneId).toOffsetDateTime();
        OffsetDateTime dayEnd = date.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

        List<Appointment> appointments = appointmentRepository
                .findByDentistIdAndScheduledAtBetweenOrderByScheduledAtAsc(dentistId, dayStart, dayEnd);

        List<AvailabilitySlotResponse> slots = new ArrayList<>();
        for (DentistSchedule schedule : schedules) {
            LocalDateTime cursor = LocalDateTime.of(date, schedule.getStartTime());
            LocalDateTime limit = LocalDateTime.of(date, schedule.getEndTime());

            while (!cursor.plusMinutes(schedule.getSlotMinutes()).isAfter(limit)) {
                OffsetDateTime slotStart = cursor.atZone(zoneId).toOffsetDateTime();
                OffsetDateTime slotEnd = slotStart.plusMinutes(schedule.getSlotMinutes());
                boolean occupied = appointments.stream().anyMatch(app ->
                        app.getScheduledAt().isBefore(slotEnd) && app.getEndsAt().isAfter(slotStart)
                );
                slots.add(new AvailabilitySlotResponse(slotStart, slotEnd, !occupied));
                cursor = cursor.plusMinutes(schedule.getSlotMinutes());
            }
        }
        return slots;
    }
}
