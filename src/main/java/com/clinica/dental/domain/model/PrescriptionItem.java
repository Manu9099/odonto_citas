package com.clinica.dental.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prescription_items")
public class PrescriptionItem extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medication_name", nullable = false, length = 160)
    private String medicationName;

    @Column(length = 120)
    private String dose;

    @Column(length = 120)
    private String frequency;

    @Column(length = 120)
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String instructions;

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
}