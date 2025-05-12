# Tyk FAPI Accelerator

This repository serves as an industry accelerator for implementing Financial-grade API (FAPI) and Demonstrating Proof of Possession (DPoP) with Tyk API Gateway.

## Repository Structure

This is a monorepo containing multiple sub-applications and components:

- **plugins/**: Gateway plugins for Tyk
  - **tyk-grpc-plugin/**: gRPC plugin implementing DPoP authentication for FAPI compliance
  
- **authorization-servers/**: Configurations for FAPI-compliant authorization servers
  - **keycloak/**: Keycloak setup with FAPI 2.0 and DPoP support
  
- **sdks/**: Client SDKs for different languages with examples
  - **java/**: Java SDK and examples
  - **python/**: Python SDK and examples
  - **nodejs/**: Node.js SDK and examples

- **specs/**: Open Banking specifications and reference implementations
  - **uk-open-banking/**: UK Open Banking Read/Write API specifications

- **tyk-bank/**: Mock bank implementation for testing FAPI compliance
  - Implements UK Open Banking Account Information API
  - Implements UK Open Banking Payment Initiation API (Domestic Payments)
  - Supports Docker containerization with microservices architecture
  - Extensible for multiple countries' Open Banking standards

- **tpp/**: Third-Party Provider implementation
  - NextJS application that connects to the mock bank API
  - Implements FAPI 2.0 security profile with Pushed Authorization Requests (PAR)
  - Demonstrates account information retrieval and payment initiation
  - Supports both automatic and manual authorization flows

- **docs/**: Documentation
  - **tutorials/**: Tutorials (COMING SOON)
  - **specs/**: Specifications (COMING SOON)

## Getting Started

### Prerequisites

- Go 1.24 or higher
- Tyk API Gateway
- Docker (for building and running the plugins and mock bank)
- Node.js 14+ (for running the mock bank)

### Building and Running the gRPC Plugin

See the [plugins/tyk-grpc-plugin/README.md](plugins/tyk-grpc-plugin/README.md) for instructions on building and running the gRPC plugin.

### Setting Up an Authorization Server

See the [authorization-servers/README.md](authorization-servers/README.md) for instructions on setting up a FAPI-compliant authorization server for testing.

### Running the Mock Bank

See the [tyk-bank/README.md](tyk-bank/README.md) for instructions on running the mock bank implementation. The mock bank provides endpoints for:

**Account Information API:**
- Account Information
- Account Balances
- Account Transactions
- Account Access Consents

**Payment Initiation API:**
- Domestic Payment Consents
- Domestic Payments
- Funds Confirmation
- Payment Details

It can be run directly with Node.js or using Docker containers.

### Running the TPP Application

See the [tpp/README.md](tpp/README.md) for instructions on running the Third-Party Provider application. The TPP provides a user interface for:

- Viewing account information and balances
- Viewing transaction history
- Initiating domestic payments
- Testing both automatic and manual authorization flows

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
