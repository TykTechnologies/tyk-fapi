-- Create pushed_auth_requests table
CREATE TABLE pushed_auth_requests (
    id SERIAL PRIMARY KEY,
    request_uri VARCHAR(100) NOT NULL UNIQUE,
    client_id VARCHAR(100) NOT NULL,
    response_type VARCHAR(50) NOT NULL,
    scope VARCHAR(500),
    redirect_uri VARCHAR(500) NOT NULL,
    state VARCHAR(100),
    code_challenge VARCHAR(100),
    code_challenge_method VARCHAR(50),
    consent_id VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    parameters JSONB NOT NULL
);

-- Create index for efficient lookups
CREATE INDEX idx_pushed_auth_requests_request_uri ON pushed_auth_requests(request_uri);
CREATE INDEX idx_pushed_auth_requests_expires_at ON pushed_auth_requests(expires_at);