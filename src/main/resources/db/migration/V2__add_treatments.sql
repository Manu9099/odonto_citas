BEGIN;

CREATE TABLE treatments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL,
    default_duration_minutes INTEGER NOT NULL,
    min_duration_minutes INTEGER NOT NULL,
    max_duration_minutes INTEGER NOT NULL,
    base_price NUMERIC(10,2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_treatments_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT chk_treatments_category_not_blank CHECK (btrim(category) <> ''),
    CONSTRAINT chk_treatments_default_duration CHECK (default_duration_minutes BETWEEN 15 AND 480),
    CONSTRAINT chk_treatments_min_duration CHECK (min_duration_minutes BETWEEN 15 AND 480),
    CONSTRAINT chk_treatments_max_duration CHECK (max_duration_minutes BETWEEN 15 AND 480),
    CONSTRAINT chk_treatments_duration_range CHECK (
        min_duration_minutes <= default_duration_minutes
        AND default_duration_minutes <= max_duration_minutes
    ),
    CONSTRAINT chk_treatments_base_price CHECK (base_price IS NULL OR base_price >= 0)
);

INSERT INTO treatments
(name, category, default_duration_minutes, min_duration_minutes, max_duration_minutes, base_price, active)
VALUES
('Consulta odontológica', 'Evaluación', 30, 30, 60, 50.00, TRUE),
('Limpieza dental', 'Prevención', 45, 30, 60, 80.00, TRUE),
('Limpieza profunda periodontal', 'Periodoncia', 90, 60, 120, 180.00, TRUE),
('Curación simple con resina', 'Restauración', 45, 30, 60, 120.00, TRUE),
('Curación múltiple', 'Restauración', 60, 45, 90, 180.00, TRUE),
('Extracción simple', 'Cirugía', 40, 30, 60, 120.00, TRUE),
('Extracción quirúrgica', 'Cirugía', 75, 60, 90, 250.00, TRUE),
('Endodoncia', 'Endodoncia', 90, 60, 120, 350.00, TRUE),
('Ajuste de ortodoncia', 'Ortodoncia', 30, 20, 45, 100.00, TRUE),
('Blanqueamiento dental', 'Estética', 75, 60, 90, 300.00, TRUE),
('Preparación de corona', 'Prótesis', 90, 60, 120, 400.00, TRUE),
('Colocación de implante', 'Implantes', 120, 90, 180, 1200.00, TRUE);

ALTER TABLE appointments
ADD COLUMN treatment_id BIGINT REFERENCES treatments(id) ON DELETE SET NULL;

UPDATE appointments a
SET treatment_id = t.id
FROM treatments t
WHERE lower(a.treatment_type) = lower(t.name);

CREATE INDEX idx_treatments_active ON treatments(active);
CREATE INDEX idx_treatments_category ON treatments(category);
CREATE INDEX idx_appointments_treatment ON appointments(treatment_id);

CREATE TRIGGER trg_treatments_updated_at
BEFORE UPDATE ON treatments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;