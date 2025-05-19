# API Gateway - Container Diagram

This diagram shows the internal structure of the API Gateway component in the Tyk FAPI Accelerator.

```mermaid
flowchart TB
    %% External Systems
    tppApp["TPP Application
    (NextJS)"]
    authServer["Authorization Server
    (Keycloak)"]
    kafka["Message Broker
    (Kafka)"]
    database[(Database)]
    
    %% API Gateway Components
    subgraph apiGateway ["API Gateway (Tyk Gateway)"]
        %% Core Gateway Components
        router["HTTP Router"]
        
        %% Security Components
        subgraph security ["Tyk FAPI 2.0 Security Middleware"]
            jwtValidation["JWT ES256 Validation"]
            dpopValidation["DPoP Validation"]
            replayProtection["Replay Protection"]
            dpopReplayProtection["DPoP Replay Protection"]
            jwsSigning["JWS Message Signing"]
        end
        
        %% Event Notification Components
        subgraph eventSystem ["Event Notification System"]
            eventDispatcher["Event Dispatcher API\n(Tyk Streams API)"]
            eventForwarder["Event Notification Forwarder API"]
        end
    end
    
    %% Tyk Bank Services
    subgraph tykBankServices ["Tyk Bank Services"]
        accountAPI["Account Information API"]
        paymentAPI["Payment Initiation API"]
        eventSubAPI["Event Subscriptions API"]
    end
    
    %% Relationships - API Request Flow
    tppApp -->|"(1) Makes API calls"| router
    router -->|"(2) Passes through"| security
    jwtValidation -->|"(3) Verifies tokens with"| authServer
    security -->|"(4) If validated"| router
    router -->|"(5) Forwards requests to"| tykBankServices
    
    %% Relationships - Event Notification Flow
    kafka -->|"(1) Serves events"| eventDispatcher
    eventDispatcher -->|"(2) Queries subscriptions"| database
    database -->|"(3) Returns matching subscriptions"| eventDispatcher
    eventDispatcher -->|"(4) Forwards payload"| eventForwarder
    eventForwarder -->|"(5) Uses"| jwsSigning
    eventForwarder -->|"(6) Sends signed notifications to"| tppApp
    
    %% Styling
    classDef component fill:#5900CB,color:#fff,stroke:#3D0087
    classDef apidef fill:#5900CB,color:#fff,stroke:#3D0087,stroke-dasharray: 5 5
    classDef eventcomp fill:#5900CB,color:#fff,stroke:#3D0087
    classDef database fill:#5900CB,color:#fff,stroke:#3D0087
    classDef tppStyle fill:#335FFD,color:#fff,stroke:#1A3FBD
    classDef authStyle fill:#00A3A0,color:#fff,stroke:#007370
    classDef kafkaStyle fill:#E09D00,color:#fff,stroke:#A87700
    classDef bankStyle fill:#C01F8B,color:#fff,stroke:#901568
    
    class tppApp tppStyle
    class authServer authStyle
    class kafka kafkaStyle
    class accountAPI,paymentAPI,eventSubAPI bankStyle
    class router component
    class jwtValidation,dpopValidation,replayProtection,dpopReplayProtection,jwsSigning component
    class accountAPI,paymentAPI,eventSubAPI component
    class eventDispatcher,eventForwarder eventcomp
    class database database
```

## Description

The API Gateway container diagram shows the internal components of the Tyk Gateway and their relationships:

### Core Components

1. **HTTP Router**: The central component of the API Gateway responsible for:
   - Receiving HTTP requests from TPP applications
   - Matching requests to the appropriate API definition
   - Applying security rules via the Tyk FAPI 2.0 Security Middleware
   - Forwarding validated requests to the appropriate Tyk Bank Service

### Tyk FAPI 2.0 Security Middleware

The API Gateway implements several security middleware components specifically for FAPI 2.0 compliance:

1. **JWT ES256 Validation**: Verifies JSON Web Tokens using the ES256 algorithm, including their signatures, claims, and scopes. Ensures that tokens are valid, not expired, and contain the appropriate permissions for the requested operation.

2. **DPoP Validation**: Implements Demonstrating Proof of Possession (DPoP) token validation, which binds access tokens to a specific client to prevent token theft and misuse. This is a critical security feature for financial-grade APIs.

3. **Replay Protection**: Prevents replay attacks by validating idempotency keys and nonces. Ensures that the same request cannot be maliciously replayed, which is essential for payment operations.

4. **DPoP Replay Protection**: Specific protection against replaying DPoP proofs, which could otherwise be used to impersonate legitimate clients.

5. **JWS Message Signing**: Signs event notifications using JSON Web Signature (JWS) to ensure authenticity and integrity of notifications sent to TPPs.

### Tyk Bank Services

The Tyk Bank provides several API services that handle different aspects of the system:

1. **Account Information API**: Endpoints for retrieving account information, balances, and transactions.

2. **Payment Initiation API**: Endpoints for creating payment consents and payments.

3. **Event Subscriptions API**: Endpoints for managing event subscriptions and notifications.

This is a mock bank, which was created by importing the UK Open Banking OpenAPI Specification Docs.

### Event Notification System

The Event Notification System handles the processing and delivery of event notifications:

1. **Event Dispatcher API**: A Tyk Streams API that consumes events from Kafka, queries the database for matching subscriptions, and constructs the webhook payload. It then forwards the payload to the Event Notification Forwarder API.

2. **Event Notification Forwarder API**: Responsible for signing the webhook payload using a pre-determined private key with JWS (JSON Web Signature) and delivering the signed notifications to the target TPP callback URLs.

### Key Flows

#### API Request Flow

1. TPP Application makes API calls to the HTTP Router
2. HTTP Router passes requests through Tyk FAPI 2.0 Security Middleware
3. JWT ES256 Validation verifies tokens with the Authorization Server
4. Tyk FAPI 2.0 Security Middleware returns validated requests to the HTTP Router
5. The HTTP Router forwards requests to the appropriate Tyk Bank Service

#### Event Notification Flow

1. Kafka publishes events to the Event Dispatcher API
2. Event Dispatcher API queries the Database for matching subscriptions
3. Database returns the matching subscriptions
4. Event Dispatcher API forwards the payload to the Event Notification Forwarder API
5. Event Notification Forwarder API uses JWS Message Signing with a pre-determined private key
6. Event Notification Forwarder API sends the signed notifications to the target TPP callback URLs
