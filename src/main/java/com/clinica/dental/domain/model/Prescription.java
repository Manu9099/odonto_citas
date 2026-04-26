package com.clinica.dental.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.time.OffsetDateTime;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prescriptions")
public class Prescription extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id", nullable = false)
    private Dentist dentist;

    @Column(length = 500)
    private String diagnosis;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String indications;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "next_control_date")
    private LocalDate nextControlDate;

    @PrePersist
    public void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        setCreatedAt(now);
        setUpdatedAt(now);
    }

    @PreUpdate
    public void onUpdate() {
        setUpdatedAt(OffsetDateTime.now());
    }
    @Builder.Default
    @OneToMany(
            mappedBy = "prescription",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PrescriptionItem> items = new ArrayList<>();

    public void addItem(PrescriptionItem item) {
        items.add(item);
        item.setPrescription(this);
    }
}