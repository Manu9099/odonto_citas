package com.clinica.dental.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dentist_schedules",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_dentist_schedule", columnNames = {"dentist_id", "day_of_week", "start_time"})
        })
public class DentistSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    @Column(name = "day_of_week", nullable = false)
    private Short dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "slot_minutes", nullable = false)
    private Short slotMinutes;

    @Column(nullable = false)
    private Boolean active;

    @PrePersist
    public void onCreate() {
        if (slotMinutes == null) slotMinutes = 30;
        if (active == null) active = true;
    }
}
