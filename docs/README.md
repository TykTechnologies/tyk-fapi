# Tyk FAPI Accelerator Documentation

This directory contains comprehensive documentation for the Tyk FAPI Accelerator, focusing on the architecture, integration, and flows.

## Documentation Overview

- [System Architecture](./architecture.md) - Overview of the system architecture and how the different components interact with each other.
- [TPP Integration](./tpp-integration.md) - Detailed information about how the Third-Party Provider (TPP) integrates with the API Gateway and Authorization Server.
- [Payment Flow](./payment-flow.md) - Detailed explanation of the payment flow in the Tyk FAPI Accelerator, focusing on how the TPP initiates and completes a payment.
- [Authorization Options](./authorization-options.md) - Comparison of automatic vs manual authorization options available in the TPP application.

## System Components

The Tyk FAPI Accelerator consists of the following main components:

1. **TPP (Third-Party Provider)** - A NextJS application that acts as a client to the bank's API.
2. **API Gateway** - Routes requests to the appropriate backend services.
3. **Authorization Server** - Handles authentication and authorization.
4. **Tyk Bank** - A mock bank implementation that provides the backend services.

## Key Features

- Implementation of FAPI 2.0 security profile
- Pushed Authorization Requests (PAR)
- Account information retrieval
- Payment initiation
- Both automatic and manual authorization flows
- Mock bank implementation for testing

## Getting Started

To get started with the Tyk FAPI Accelerator, see the following README files:

- [TPP README](../tpp/README.md) - Instructions for running the TPP application
- [Tyk Bank README](../tyk-bank/README.md) - Instructions for running the mock bank
- [Authorization Server README](../authorization-servers/README.md) - Instructions for setting up the authorization server

## Diagrams

The documentation includes several diagrams to help visualize the architecture and flows:

- System architecture diagram
- Payment flow sequence diagram
- Authorization options comparison diagram

These diagrams are created using Mermaid and can be viewed directly in GitHub or any Markdown viewer that supports Mermaid.