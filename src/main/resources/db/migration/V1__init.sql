BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TYPE user_role AS ENUM ('ADMIN', 'DENTIST', 'PATIENT');

CREATE TYPE appointment_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REFUNDED'
);

CREATE TYPE payment_provider AS ENUM (
    'MERCADOPAGO',
    'STRIPE',
    'CASH'
);

CREATE TYPE notification_channel AS ENUM (
    'EMAIL',
    'WHATSAPP',
    'PUSH'
);

CREATE TYPE notification_status AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    phone           VARCHAR(20),
    role            user_role    NOT NULL DEFAULT 'PATIENT',
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_email_format CHECK (position('@' in email) > 1),
    CONSTRAINT chk_users_full_name_not_blank CHECK (btrim(full_name) <> '')
);

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_refresh_token_not_blank CHECK (btrim(token) <> '')
);

CREATE TABLE dentists (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialty       VARCHAR(100),
    license_number  VARCHAR(50)  NOT NULL UNIQUE,
    bio             TEXT,
    avatar_url      VARCHAR(500),
    CONSTRAINT chk_dentists_license_not_blank CHECK (btrim(license_number) <> '')
);

CREATE TABLE patients (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth       DATE,
    dni                 VARCHAR(20) UNIQUE,
    emergency_contact   VARCHAR(150),
    emergency_phone     VARCHAR(20),
    medical_notes       TEXT
);

CREATE TABLE dentist_schedules (
    id            BIGSERIAL PRIMARY KEY,
    dentist_id    BIGINT      NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
    day_of_week   SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time    TIME        NOT NULL,
    end_time      TIME        NOT NULL,
    slot_minutes  SMALLINT    NOT NULL DEFAULT 30,
    active        BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_schedule_time_range CHECK (start_time < end_time),
    CONSTRAINT chk_schedule_slot_minutes CHECK (slot_minutes > 0 AND slot_minutes <= 480),
    UNIQUE (dentist_id, day_of_week, start_time)
);

CREATE TABLE appointments (
    id               BIGSERIAL           PRIMARY KEY,
    dentist_id       BIGINT              NOT NULL REFERENCES dentists(id) ON DELETE RESTRICT,
    patient_id       BIGINT              NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    scheduled_at     TIMESTAMPTZ         NOT NULL,
    scheduled_until  TIMESTAMPTZ         NOT NULL,
    schedule_range   TSTZRANGE           NOT NULL,
    duration_minutes INTEGER             NOT NULL DEFAULT 30,
    status           appointment_status  NOT NULL DEFAULT 'PENDING',
    treatment_type   VARCHAR(100),
    notes            TEXT,
    cancelled_reason TEXT,
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_appointments_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    CONSTRAINT chk_appointments_time_range CHECK (scheduled_until > scheduled_at),
    CONSTRAINT chk_cancelled_reason_when_cancelled
        CHECK (
            status <> 'CANCELLED'
            OR (cancelled_reason IS NOT NULL AND btrim(cancelled_reason) <> '')
        )
);

CREATE OR REPLACE FUNCTION set_appointment_time_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.scheduled_until := NEW.scheduled_at + (NEW.duration_minutes * INTERVAL '1 minute');
    NEW.schedule_range := tstzrange(NEW.scheduled_at, NEW.scheduled_until, '[)');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointments_set_time_fields
BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes
ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_appointment_time_fields();

ALTER TABLE appointments
    ADD CONSTRAINT no_overlap_active_appointments
    EXCLUDE USING gist (
        dentist_id WITH =,
        schedule_range WITH &&
    )
    WHERE (status IN ('PENDING', 'CONFIRMED'));

CREATE TABLE payments (
    id                  BIGSERIAL        PRIMARY KEY,
    appointment_id      BIGINT           NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    amount              NUMERIC(10,2)    NOT NULL,
    currency            VARCHAR(3)       NOT NULL DEFAULT 'PEN',
    status              payment_status   NOT NULL DEFAULT 'PENDING',
    provider            payment_provider NOT NULL,
    provider_payment_id VARCHAR(200)     UNIQUE,
    provider_ref        VARCHAR(500),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_payments_amount_nonnegative CHECK (amount >= 0),
    CONSTRAINT chk_payments_currency_len CHECK (char_length(currency) = 3),
    CONSTRAINT chk_paid_at_when_approved CHECK (status <> 'APPROVED' OR paid_at IS NOT NULL)
);

CREATE TABLE notifications (
    id               BIGSERIAL             PRIMARY KEY,
    appointment_id   BIGINT                NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    type             VARCHAR(50)           NOT NULL,
    channel          notification_channel  NOT NULL,
    status           notification_status   NOT NULL DEFAULT 'PENDING',
    scheduled_for    TIMESTAMPTZ           NOT NULL,
    sent_at          TIMESTAMPTZ,
    error_message    TEXT,
    created_at       TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notifications_type_not_blank CHECK (btrim(type) <> ''),
    CONSTRAINT chk_notifications_sent_at_when_sent CHECK (status <> 'SENT' OR sent_at IS NOT NULL)
);

CREATE UNIQUE INDEX uq_notifications_unique_delivery
    ON notifications (appointment_id, type, channel, scheduled_for);

CREATE INDEX idx_users_role_active
    ON users(role, active);

CREATE INDEX idx_refresh_tokens_user_active
    ON refresh_tokens(user_id)
    WHERE revoked = FALSE;

CREATE INDEX idx_dentist_schedules_lookup
    ON dentist_schedules(dentist_id, day_of_week, active);

CREATE INDEX idx_appointments_dentist_date
    ON appointments(dentist_id, scheduled_at);

CREATE INDEX idx_appointments_patient_date
    ON appointments(patient_id, scheduled_at);

CREATE INDEX idx_appointments_status
    ON appointments(status);

CREATE INDEX idx_appointments_active_calendar
    ON appointments(dentist_id, scheduled_at)
    WHERE status IN ('PENDING', 'CONFIRMED');

CREATE INDEX idx_payments_status_provider
    ON payments(status, provider);

CREATE INDEX idx_notifications_pending_schedule
    ON notifications(scheduled_for)
    WHERE status = 'PENDING';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;