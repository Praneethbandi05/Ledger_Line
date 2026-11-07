-- V3__transactions_and_ledger_schema.sql: Transactions, Double-Entry Ledger, and System Clearing Accounts

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(64) NOT NULL UNIQUE,
    source_account_id BIGINT REFERENCES accounts(id),
    destination_account_id BIGINT REFERENCES accounts(id),
    amount NUMERIC(19, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    transaction_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description VARCHAR(255),
    initiated_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_source_account ON transactions(source_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_destination_account ON transactions(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    entry_type VARCHAR(10) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    balance_after NUMERIC(19, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON ledger_entries(created_at);

-- Seed System Clearing User and System Accounts
INSERT INTO users (username, email, password, full_name, role, enabled)
VALUES ('system_clearing', 'clearing@ledgerline.internal', '$2a$10$NWhH1d52oalqNYX.UUwcpeirQOQ4ndg5vHW/N./i8nsnG/iLas5X6', 'System Clearing House', 'ADMIN', TRUE);

-- System Clearing Account for External Deposits (Inflows)
INSERT INTO accounts (account_number, user_id, account_type, currency, balance, status)
VALUES ('ACC-SYS-CLEARING-DEPOSIT', (SELECT id FROM users WHERE username = 'system_clearing'), 'SYSTEM_CLEARING', 'USD', 0.00, 'ACTIVE');

-- System Clearing Account for External Withdrawals (Outflows)
INSERT INTO accounts (account_number, user_id, account_type, currency, balance, status)
VALUES ('ACC-SYS-CLEARING-WITHDRAWAL', (SELECT id FROM users WHERE username = 'system_clearing'), 'SYSTEM_CLEARING', 'USD', 0.00, 'ACTIVE');
