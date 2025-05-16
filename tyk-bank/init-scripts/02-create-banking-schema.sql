-- Create accounts table
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL UNIQUE,
    currency VARCHAR(3) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    account_sub_type VARCHAR(50),
    description VARCHAR(500),
    nickname VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    opening_date TIMESTAMP WITH TIME ZONE,
    scheme_name VARCHAR(100),
    identification VARCHAR(100),
    name VARCHAR(100),
    secondary_identification VARCHAR(100)
);

-- Create balances table
CREATE TABLE balances (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL REFERENCES accounts(account_id),
    balance_type VARCHAR(50) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    credit_debit_indicator VARCHAR(10) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    account_id VARCHAR(50) NOT NULL REFERENCES accounts(account_id),
    status VARCHAR(50) NOT NULL,
    booking_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    value_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_information TEXT,
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    credit_debit_indicator VARCHAR(10) NOT NULL,
    bank_transaction_code_code VARCHAR(50),
    bank_transaction_code_sub_code VARCHAR(50),
    merchant_name VARCHAR(100),
    merchant_category_code VARCHAR(10),
    creditor_agent_scheme_name VARCHAR(100),
    creditor_agent_identification VARCHAR(100),
    creditor_agent_name VARCHAR(100),
    creditor_account_scheme_name VARCHAR(100),
    creditor_account_identification VARCHAR(100),
    creditor_account_name VARCHAR(100),
    debtor_agent_scheme_name VARCHAR(100),
    debtor_agent_identification VARCHAR(100),
    debtor_agent_name VARCHAR(100),
    debtor_account_scheme_name VARCHAR(100),
    debtor_account_identification VARCHAR(100),
    debtor_account_name VARCHAR(100)
);

-- Create payment_consents table
CREATE TABLE payment_consents (
    id SERIAL PRIMARY KEY,
    consent_id VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    creation_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status_update_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date_time TIMESTAMP WITH TIME ZONE,
    debtor_account_scheme_name VARCHAR(100),
    debtor_account_identification VARCHAR(100),
    debtor_account_name VARCHAR(100),
    debtor_account_secondary_identification VARCHAR(100),
    instruction_identification VARCHAR(100),
    end_to_end_identification VARCHAR(100),
    instructed_amount_amount DECIMAL(19, 4) NOT NULL,
    instructed_amount_currency VARCHAR(3) NOT NULL,
    creditor_account_scheme_name VARCHAR(100) NOT NULL,
    creditor_account_identification VARCHAR(100) NOT NULL,
    creditor_account_name VARCHAR(100) NOT NULL,
    creditor_account_secondary_identification VARCHAR(100),
    remittance_information_reference VARCHAR(100),
    remittance_information_unstructured TEXT
);

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(50) NOT NULL UNIQUE,
    consent_id VARCHAR(50) NOT NULL REFERENCES payment_consents(consent_id),
    creation_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_update_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_execution_date_time TIMESTAMP WITH TIME ZONE,
    expected_settlement_date_time TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient lookups
CREATE INDEX idx_accounts_account_id ON accounts(account_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_booking_date_time ON transactions(booking_date_time);
CREATE INDEX idx_balances_account_id ON balances(account_id);
CREATE INDEX idx_payments_consent_id ON payments(consent_id);
CREATE INDEX idx_payment_consents_status ON payment_consents(status);