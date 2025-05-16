# Tyk Bank - Open Banking Mock Implementation

A mock implementation of Open Banking APIs for testing and development purposes.

## Overview

This project provides a mock implementation of Open Banking APIs from multiple countries. It's designed to help developers test their applications against realistic but simplified versions of Open Banking APIs without needing to connect to real banks.

**Currently Implemented:**
- UK Open Banking Account Information API
- UK Open Banking Payment Initiation API (Domestic Payments only) with FAPI 2.0 Security Profile
- UK Open Banking Event Subscriptions API
- UK Open Banking Event Notifications API

**Planned for Future:**
- Additional country implementations

The mock bank provides endpoints for:
- Account Information
- Account Balances
- Account Transactions
- Account Access Consents
- Domestic Payment Consents
- Domestic Payments
- Pushed Authorization Requests (PAR)
- Payment Authorization
- Event Subscriptions
- Event Notifications

## Project Structure

The project follows a country-first organization structure to accommodate multiple countries and API types:

```
tyk-bank/
├── src/
│   ├── common/                      # Shared utilities and types
│   ├── uk/                          # UK Open Banking
│   │   ├── account-information/     # Account Information API
│   │   ├── payment-initiation/      # Payment Initiation API
│   │   └── event-subscriptions/     # Event Subscriptions API
│   └── brazil/                      # Brazil Open Banking (future)
└── tests/                           # Test files
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/TykTechnologies/tyk-fapi.git
   cd tyk-fapi/tyk-bank
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

### Running the Mock Bank

#### Using Node.js

Start the Account Information API server:
```
npm run start:account
```

Start the Payment Initiation API server:
```
npm run start:payment
```

Start the Event Subscriptions API server:
```
npm run start:events
```

Start all servers concurrently:
```
npm run dev:all
```

The Account Information API will start on port 3001, the Payment Initiation API on port 3002, and the Event Subscriptions API on port 3003 by default. You can change this by setting the `PORT` environment variable.

For development with auto-reload:
```
# Account Information API
npm run dev:account

# Payment Initiation API
npm run dev:payment

# Event Subscriptions API
npm run dev:events

# All APIs concurrently
npm run dev:all
```

#### Using Docker

Build and run a specific service using Docker:
```
# Run UK Account Information API (default)
docker build -t tyk-bank-uk-account-information --build-arg SERVICE=uk-account-information .
docker run -p 3001:3001 tyk-bank-uk-account-information
```

#### Using Docker Compose

Build and run services using Docker Compose:
```
# Run all available services
docker-compose up

# Run a specific service
docker-compose up uk-account-information

# Run in detached mode
docker-compose up -d
```

To stop the containers:
```
docker-compose down
```

## Microservices

The project is structured as a collection of microservices, each representing a different country's Open Banking API implementation:

### UK Open Banking

#### Account Information API (Port 3001)
- Provides account information, balances, and transactions
- Manages account access consents

#### Payment Initiation API (Port 3002)
- Handles domestic payment initiation requests
- Manages domestic payment consents
- Provides funds confirmation

#### Event Subscriptions API (Port 3003)
- Manages event subscriptions for TPPs
- Delivers event notifications to registered callbacks
- Supports various event types related to payments and consents

### Brazil Open Banking (future)

#### Account Information API (Port 3003, future)
- Will provide Brazil-specific account information

## API Endpoints

### UK Open Banking - Account Access Consents

- `POST /account-access-consents` - Create a new consent
- `GET /account-access-consents/{ConsentId}` - Get consent details
- `DELETE /account-access-consents/{ConsentId}` - Delete a consent

### UK Open Banking - Account Information

- `GET /accounts` - List all accounts
- `GET /accounts/{AccountId}` - Get account details
- `GET /accounts/{AccountId}/balances` - Get account balances
- `GET /accounts/{AccountId}/transactions` - Get account transactions
- `GET /balances` - Get all balances
- `GET /transactions` - Get all transactions

### UK Open Banking - Payment Initiation

- `POST /domestic-payment-consents` - Create a new domestic payment consent
- `GET /domestic-payment-consents/{ConsentId}` - Get domestic payment consent details
- `PUT /domestic-payment-consents/{ConsentId}/authorize` - Authorize a payment consent
- `GET /domestic-payment-consents/{ConsentId}/funds-confirmation` - Check funds availability
- `POST /domestic-payments` - Create a new domestic payment
- `GET /domestic-payments/{DomesticPaymentId}` - Get domestic payment details
- `GET /domestic-payments/{DomesticPaymentId}/payment-details` - Get additional payment details

### UK Open Banking - Authorization Server

- `POST /as/par` - Create a pushed authorization request (PAR)
- `GET /as/authorize` - Authorization endpoint for handling authorization requests

### UK Open Banking - Event Subscriptions

- `POST /event-subscriptions` - Register a callback URL for event notifications
- `GET /event-subscriptions` - List all event subscriptions
- `GET /event-subscriptions/{EventSubscriptionId}` - Get subscription details
- `PUT /event-subscriptions/{EventSubscriptionId}` - Update a subscription
- `DELETE /event-subscriptions/{EventSubscriptionId}` - Delete a subscription

## Event Notifications

The mock bank supports event notifications for various payment and consent-related events. TPPs can register callback URLs to receive notifications when these events occur.

For detailed information about the event notification system, see [Event Notifications Documentation](EVENT_NOTIFICATIONS.md).

### Event Types

- `payment-consent-created` - When a new payment consent is created
- `payment-consent-authorised` - When a payment consent is authorized
- `payment-consent-rejected` - When a payment consent is rejected
- `payment-created` - When a new payment is created
- `payment-completed` - When a payment is successfully completed
- `payment-failed` - When a payment fails
- `funds-confirmation-completed` - When a funds confirmation check is performed

### Enabling Event Notifications

Event notifications are disabled by default. To enable them, set the `ENABLE_EVENTS` environment variable to `true` in the Docker Compose file or when running the services directly:

```bash
# Enable events when running directly
ENABLE_EVENTS=true npm run dev:events
```

When events are enabled, the mock bank will use Kafka to publish events and deliver notifications to registered TPPs.

## Testing with Postman

A Postman collection is available to test the complete domestic payment flow in the Payment Initiation API. The collection includes requests for creating payment consents, checking funds availability, creating payments, and retrieving payment details.

For detailed instructions on setting up and using the Postman collection, see the [Postman Collection Documentation](src/uk/payment-initiation/postman-collection.md).

## Mock Data

The mock bank comes pre-populated with sample data:
- 5 accounts (current, savings, credit card, business, and euro accounts)
- Balances for each account
- Transactions for each account
- Sample account access consents
- Sample domestic payment consents
- Sample domestic payments

## Security

This mock implementation includes basic FAPI 2.0 security profile features:

- **Pushed Authorization Requests (PAR)**: Enhances security by moving authorization request parameters to a back-channel.
- **Authorization Flow**: Simulates the authorization flow for payment consents.

However, it does not include full authentication or authorization mechanisms. It's designed to be used behind a Tyk Gateway that will handle additional security aspects.

## FAPI 2.0 Security Profile

The Payment Initiation API implements key aspects of the FAPI 2.0 Security Profile:

- **PAR (Pushed Authorization Requests)**: Authorization requests are pushed to the authorization server before redirecting the user.
- **Authorization Flow**: The API supports both automated and manual authorization flows.
- **Consent Management**: Payment consents must be explicitly authorized before payments can be created.

These features enhance security by reducing the exposure of sensitive parameters and providing a more robust authorization flow.
