-- Create account_access_consents table
CREATE TABLE account_access_consents (
    id SERIAL PRIMARY KEY,
    consent_id VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    creation_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status_update_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date_time TIMESTAMP WITH TIME ZONE,
    transaction_from_date_time TIMESTAMP WITH TIME ZONE,
    transaction_to_date_time TIMESTAMP WITH TIME ZONE,
    permissions JSONB NOT NULL
);

-- Create index for efficient lookups
CREATE INDEX idx_account_access_consents_consent_id ON account_access_consents(consent_id);
CREATE INDEX idx_account_access_consents_status ON account_access_consents(status);