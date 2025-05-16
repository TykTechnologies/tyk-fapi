-- Create event_subscriptions table
CREATE TABLE event_subscriptions (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(50) NOT NULL UNIQUE,
    callback_url TEXT NOT NULL,
    version VARCHAR(10) NOT NULL,
    event_types TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL,
    creation_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status_update_date_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for efficient lookups
CREATE INDEX idx_event_subscriptions_event_types ON event_subscriptions USING GIN (event_types);
CREATE INDEX idx_event_subscriptions_subscription_id ON event_subscriptions (subscription_id);
CREATE INDEX idx_event_subscriptions_status ON event_subscriptions (status);

-- No sample data