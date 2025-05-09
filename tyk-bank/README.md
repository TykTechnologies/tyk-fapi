# Tyk Bank - Open Banking Mock Implementation

A mock implementation of Open Banking APIs for testing and development purposes.

## Overview

This project provides a mock implementation of Open Banking APIs from multiple countries. It's designed to help developers test their applications against realistic but simplified versions of Open Banking APIs without needing to connect to real banks.

**Currently Implemented:**
- UK Open Banking Account Information API
- UK Open Banking Payment Initiation API (Domestic Payments only)

**Planned for Future:**
- UK Open Banking Payment Initiation API (Additional payment types)
- Brazil Open Banking APIs
- Additional country implementations

The mock bank provides endpoints for:
- Account Information
- Account Balances
- Account Transactions
- Account Access Consents
- Domestic Payment Consents
- Domestic Payments

## Project Structure

The project follows a country-first organization structure to accommodate multiple countries and API types:

```
tyk-bank/
├── src/
│   ├── common/                      # Shared utilities and types
│   ├── uk/                          # UK Open Banking
│   │   ├── account-information/     # Account Information API
│   │   └── payment-initiation/      # Payment Initiation API
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

Start both servers concurrently:
```
npm run dev:all
```

The Account Information API will start on port 3001 and the Payment Initiation API on port 3002 by default. You can change this by setting the `PORT` environment variable.

For development with auto-reload:
```
# Account Information API
npm run dev:account

# Payment Initiation API
npm run dev:payment

# Both APIs concurrently
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
- `GET /domestic-payment-consents/{ConsentId}/funds-confirmation` - Check funds availability
- `POST /domestic-payments` - Create a new domestic payment
- `GET /domestic-payments/{DomesticPaymentId}` - Get domestic payment details
- `GET /domestic-payments/{DomesticPaymentId}/payment-details` - Get additional payment details

## Mock Data

The mock bank comes pre-populated with sample data:
- 5 accounts (current, savings, credit card, business, and euro accounts)
- Balances for each account
- Transactions for each account
- Sample account access consents
- Sample domestic payment consents
- Sample domestic payments

## Security

This mock implementation does not include authentication or authorization. It's designed to be used behind a Tyk Gateway that will handle security aspects.
