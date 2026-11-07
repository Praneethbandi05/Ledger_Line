-- V2__auth_and_accounts_schema.sql: Authentication, Users, Accounts and Token Blacklist

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(30) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    account_type VARCHAR(20) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_account_balance_non_negative CHECK (balance >= 0.00)
);

CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

CREATE TABLE IF NOT EXISTS token_blacklist (
    token_hash VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invalidated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Seed Initial Baseline Users
-- admin / Admin@12345
INSERT INTO users (username, email, password, full_name, role, enabled)
VALUES ('admin', 'admin@ledgerline.internal', '$2a$10$NWhH1d52oalqNYX.UUwcpeirQOQ4ndg5vHW/N./i8nsnG/iLas5X6', 'System Administrator', 'ADMIN', TRUE);

-- auditor / Auditor@12345
INSERT INTO users (username, email, password, full_name, role, enabled)
VALUES ('auditor', 'auditor@ledgerline.internal', '$2a$10$CUnw9xiS4yz8xRKVRhAyYeRkaDH4PM5Cd11sEgogF2Wk3L7UxuMQC', 'Senior Compliance Auditor', 'AUDITOR', TRUE);

-- alice / Customer@123
INSERT INTO users (username, email, password, full_name, role, enabled)
VALUES ('alice', 'alice@customer.com', '$2a$10$6b2K1PZwaAjSpNR67tFhW.E6wy982oWhbZUC69uCALyxLdkZqaRdu', 'Alice Smith', 'CUSTOMER', TRUE);

-- bob / Customer@123
INSERT INTO users (username, email, password, full_name, role, enabled)
VALUES ('bob', 'bob@customer.com', '$2a$10$6b2K1PZwaAjSpNR67tFhW.E6wy982oWhbZUC69uCALyxLdkZqaRdu', 'Bob Jones', 'CUSTOMER', TRUE);

-- Seed Baseline Customer Accounts
INSERT INTO accounts (account_number, user_id, account_type, currency, balance, status)
VALUES ('ACC-ALICE-01', (SELECT id FROM users WHERE username = 'alice'), 'SAVINGS', 'USD', 1000.00, 'ACTIVE');

INSERT INTO accounts (account_number, user_id, account_type, currency, balance, status)
VALUES ('ACC-BOB-01', (SELECT id FROM users WHERE username = 'bob'), 'CHECKING', 'USD', 500.00, 'ACTIVE');
