BEGIN;

CREATE TABLE prescriptions (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    dentist_id BIGINT NOT NULL REFERENCES dentists(id),

    diagnosis VARCHAR(500),
    indications TEXT NOT NULL,
    notes TEXT,
    next_control_date DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_prescriptions_indications_not_blank CHECK (btrim(indications) <> '')
);

CREATE TABLE prescription_items (
    id BIGSERIAL PRIMARY KEY,
    prescription_id BIGINT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,

    medication_name VARCHAR(160) NOT NULL,
    dose VARCHAR(120),
    frequency VARCHAR(120),
    duration VARCHAR(120),
    instructions TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_prescription_items_medication_not_blank CHECK (btrim(medication_name) <> '')
);

CREATE INDEX idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_dentist ON prescriptions(dentist_id);
CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

CREATE TRIGGER trg_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prescription_items_updated_at
BEFORE UPDATE ON prescription_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;