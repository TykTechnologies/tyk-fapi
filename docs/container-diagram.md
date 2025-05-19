# Tyk FAPI Accelerator - Container Diagram

This diagram shows the major containers (applications, data stores) that make up the Tyk FAPI Accelerator system.

```mermaid
flowchart TB
    %% People/Actors
    psu(["PSU (Payment Services User)
    A customer of the bank who accesses their accounts and initiates payments through third-party providers"])
    tpp(["TPP (Third Party Provider)
    Companies providing financial services like account aggregators, credit checkers, and savings apps that integrate with banks"])
    
    %% Tyk FAPI Accelerator System with Containers
    subgraph tykFAPI ["Tyk FAPI Accelerator"]
        tppApp["TPP Application
        (NextJS)
        Demonstrates how a TPP would interact with a bank's API"]
        apiGateway["API Gateway
        (Tyk Gateway)
        Secures and routes API requests, enforces FAPI compliance, and handles event notifications"]
        authServer["Authorization Server
        (Keycloak)
        Handles authentication and authorization"]
        tykBank["Tyk Bank
        (Node.js)
        Mock bank implementation providing backend services"]
        database[(Database)]
        databaseLabel["PostgreSQL
        Stores account information, payment data, and event subscriptions"]
        kafka[(Message Broker)]
        kafkaLabel["Kafka
        Handles event notifications"]
    end
    
    %% Connect labels to database and kafka
    database --- databaseLabel
    kafka --- kafkaLabel
    
    %% Relationships
    psu -->|"Uses
    (HTTPS)"| tppApp
    tpp -->|"Develops
    (IDE)"| tppApp
    tppApp -->|"Makes API calls to
    (HTTPS)"| apiGateway
    tppApp -->|"Authenticates with
    (OAuth 2.0/OIDC)"| authServer
    apiGateway -->|"Routes requests to
    (HTTPS)"| tykBank
    authServer -->|"Verifies consents with
    (HTTPS)"| tykBank
    tykBank -->|"Reads from and writes to
    (SQL)"| database
    tykBank -->|"Publishes events to
    (Kafka Protocol)"| kafka
    
    %% Event notification flow
    kafka -->|"Subscribes to events"| apiGateway
    apiGateway -->|"Sends signed notifications
    (JWS/HTTPS Webhooks)"| tppApp
    
    %% Styling
    classDef person fill:#335FFD,color:#fff,stroke:#1A3FBD
    classDef tppStyle fill:#335FFD,color:#fff,stroke:#1A3FBD
    classDef component fill:#5900CB,color:#fff,stroke:#3D0087
    classDef authStyle fill:#00A3A0,color:#fff,stroke:#007370
    classDef bankStyle fill:#C01F8B,color:#fff,stroke:#901568
    classDef kafkaStyle fill:#E09D00,color:#fff,stroke:#A87700
    classDef database fill:#5900CB,color:#fff,stroke:#3D0087
    classDef label fill:none,stroke:none
    
    class psu,tpp person
    class tppApp tppStyle
    class apiGateway component
    class authServer authStyle
    class tykBank bankStyle
    class database database
    class kafka kafkaStyle
    class databaseLabel,kafkaLabel label
```

## Description

The container diagram shows the major components of the Tyk FAPI Accelerator:

1. **TPP Application**: A NextJS application that demonstrates how a Third Party Provider (TPP) would interact with a bank's API. It provides a user interface for Payment Service Users (PSUs) to view account information, initiate payments, and test authorization flows.

2. **API Gateway**: The Tyk Gateway that secures and routes requests to the appropriate backend services while enforcing FAPI compliance. It validates DPoP tokens, protects against replay attacks, validates JWTs, ensures routing only to endpoints defined in the specs, and handles event notifications. It subscribes to Kafka events and dispatches those events to subscribed TPPs, signing the webhook requests using JWS (JSON Web Signature) to ensure authenticity.

3. **Authorization Server**: A Keycloak instance that handles authentication and authorization. It supports OAuth 2.0 and OpenID Connect protocols, and is responsible for issuing tokens and managing consent.

4. **Tyk Bank**: A Node.js mock bank implementation that provides the backend services. It includes modules for account information, payment initiation, and event subscriptions.

5. **Database**: A PostgreSQL database that stores account information, payment data, and event subscriptions.

6. **Message Broker**: A Kafka instance that handles event notifications, allowing the bank to notify TPPs of events like payment status changes.

The diagram also shows the key relationships between these components, including:

- The TPP Application makes API calls to the API Gateway
- The TPP Application authenticates with the Authorization Server
- The API Gateway routes requests to the Tyk Bank
- The Authorization Server verifies consents with the Tyk Bank
- The Tyk Bank reads from and writes to the Database
- The Tyk Bank publishes events to the Message Broker

### Event Notification Flow

The event notification flow is handled as follows:

1. The Tyk Bank publishes events to Kafka when significant events occur (e.g., payment status changes)
2. The Event Dispatcher API in the API Gateway consumes these Kafka events
3. The Event Dispatcher identifies which TPPs should receive the notifications based on their subscriptions via DB lookup
4. The Event Dispatcher constructs the webhook payload and forwards it to the Event Notification Forwarder API
5. The Event Notification Forwarder API signs the webhook payload using JSON Web Signature (JWS)
6. The signed notifications are sent to the appropriate TPPs' callback URLs
7. TPPs can verify the authenticity of the webhooks using the JWS signature, ensuring they haven't been tampered with