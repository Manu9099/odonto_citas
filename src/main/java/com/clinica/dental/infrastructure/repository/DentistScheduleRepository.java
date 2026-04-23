package com.clinica.dental.infrastructure.repository;

import com.clinica.dental.domain.model.DentistSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DentistScheduleRepository extends JpaRepository<DentistSchedule, Long> {
    List<DentistSchedule> findByDentistIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long dentistId);
    List<DentistSchedule> findByDentistIdAndDayOfWeekAndActiveTrueOrderByStartTimeAsc(Long dentistId, Short dayOfWeek);
}
