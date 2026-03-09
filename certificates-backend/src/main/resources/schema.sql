-- schema.sql
-- Runs automatically on startup when spring.sql.init.mode=always

CREATE TABLE IF NOT EXISTS certificates (
    id                    BIGSERIAL     PRIMARY KEY,
    patient_first_name    VARCHAR(100)  NOT NULL,
    patient_last_name     VARCHAR(100)  NOT NULL,
    doctor_first_name     VARCHAR(100)  NOT NULL,
    doctor_last_name      VARCHAR(100)  NOT NULL,
    doctor_specialization VARCHAR(150),
    certificate_data      TEXT          -- base64-encoded image string
);
