-- V1__init_foundation.sql: LedgerLine System Foundation Baseline
CREATE TABLE IF NOT EXISTS system_health_probe (
    id BIGSERIAL PRIMARY KEY,
    probe_name VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_health_probe (probe_name, status)
VALUES ('DATABASE_CONNECTIVITY', 'HEALTHY');
