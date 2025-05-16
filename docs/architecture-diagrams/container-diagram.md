# Tyk FAPI Accelerator - Container Diagram

This diagram shows the major containers (applications, data stores) that make up the Tyk FAPI Accelerator system.

```mermaid
flowchart TB
    %% People/Actors
    endUser(["End User
    A customer of the bank who wants to access their accounts via a TPP"])
    tppDeveloper(["TPP Developer
    Developer building applications that integrate with the bank's API"])
    
    %% Tyk FAPI Accelerator System with Containers
    subgraph tykFAPI ["Tyk FAPI Accelerator"]
        tppApp["TPP Application
        (NextJS)
        Demonstrates how a TPP would interact with a bank's API"]
        apiGateway["API Gateway
        (Tyk Gateway)
        Routes requests to the appropriate backend services"]
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
    endUser -->|"Uses
    (HTTPS)"| tppApp
    tppDeveloper -->|"Develops
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
    kafka -->|"Sends notifications to
    (HTTPS Webhooks)"| tppApp
    
    %% Styling
    classDef person fill:#08427B,color:#fff,stroke:#052E56
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295
    classDef database fill:#438DD5,color:#fff,stroke:#2E6295
    classDef queue fill:#438DD5,color:#fff,stroke:#2E6295
    classDef label fill:none,stroke:none
    
    class endUser,tppDeveloper person
    class tppApp,apiGateway,authServer,tykBank container
    class database database
    class kafka queue
    class databaseLabel,kafkaLabel label
```

## Description

The container diagram shows the major components of the Tyk FAPI Accelerator:

1. **TPP Application**: A NextJS application that demonstrates how a third-party provider would interact with a bank's API. It provides a user interface for viewing account information, initiating payments, and testing authorization flows.

2. **API Gateway**: The Tyk Gateway that routes requests to the appropriate backend services. Based on the API analysis, it's configured to handle account information and payment initiation requests, with endpoints for accounts, balances, transactions, and more.

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
- The Message Broker sends notifications to the TPP Application