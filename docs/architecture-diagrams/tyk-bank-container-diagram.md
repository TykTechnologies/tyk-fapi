# Tyk Bank - Container Diagram

This diagram shows the internal structure of the Tyk Bank component, which is the mock bank implementation in the Tyk FAPI Accelerator.

```mermaid
flowchart TB
    %% External Systems
    apiGateway["API Gateway
    (Tyk Gateway)"]
    authServer["Authorization Server
    (Keycloak)"]
    tppApp["TPP Application
    (NextJS)"]
    
    %% Tyk Bank Components
    subgraph tykBank ["Tyk Bank (Node.js)"]
        accountInfo["Account Information API
        Provides account, balance, and transaction data"]
        paymentInit["Payment Initiation API
        Handles payment consents and payments"]
        eventSubs["Event Subscriptions API
        Manages callback URL registrations"]
        streamProcessor["Stream Processor
        Routes events to registered TPPs"]
        database[(Database)]
        databaseLabel["PostgreSQL
        Stores account, payment, and subscription data"]
        kafka[(Message Broker)]
        kafkaLabel["Kafka
        Handles event messages"]
    end
    
    %% Connect labels to database and kafka
    database --- databaseLabel
    kafka --- kafkaLabel
    
    %% Relationships
    apiGateway -->|"Routes account requests to
    (HTTPS)"| accountInfo
    apiGateway -->|"Routes payment requests to
    (HTTPS)"| paymentInit
    apiGateway -->|"Routes subscription requests to
    (HTTPS)"| eventSubs
    authServer -->|"Verifies consents with
    (HTTPS)"| paymentInit
    
    accountInfo -->|"Reads/writes
    (SQL)"| database
    paymentInit -->|"Reads/writes
    (SQL)"| database
    eventSubs -->|"Reads/writes
    (SQL)"| database
    
    paymentInit -->|"Publishes payment events
    (Kafka Protocol)"| kafka
    eventSubs -->|"Publishes subscription events
    (Kafka Protocol)"| kafka
    
    kafka -->|"Consumes events
    (Kafka Protocol)"| streamProcessor
    database -->|"Queries subscriptions
    (SQL)"| streamProcessor
    streamProcessor -->|"Sends notifications
    (HTTPS Webhooks)"| tppApp
    
    %% Styling
    classDef external fill:#999999,color:#fff,stroke:#6B6B6B
    classDef component fill:#85BBF0,color:#000,stroke:#5D82A8
    classDef database fill:#438DD5,color:#fff,stroke:#2E6295
    classDef queue fill:#438DD5,color:#fff,stroke:#2E6295
    classDef label fill:none,stroke:none
    
    class apiGateway,authServer,tppApp external
    class accountInfo,paymentInit,eventSubs,streamProcessor component
    class database database
    class kafka queue
    class databaseLabel,kafkaLabel label
```

## Description

The Tyk Bank container diagram shows the internal components of the mock bank implementation:

1. **Account Information API**: Provides endpoints for retrieving account information, balances, and transactions. Based on the API analysis, this includes endpoints for accounts, balances, transactions, and more.

2. **Payment Initiation API**: Handles payment consents and payments. It manages the lifecycle of a payment from consent creation to completion.

3. **Event Subscriptions API**: Manages callback URL registrations from TPPs. It allows TPPs to register for notifications when certain events occur.

4. **Stream Processor**: Routes events to registered TPPs. It consumes events from Kafka, queries the database for active subscriptions, and sends notifications to the registered TPPs.

5. **Database**: A PostgreSQL database that stores account information, payment data, and event subscriptions.

6. **Message Broker**: A Kafka instance that handles event messages, allowing different components to communicate asynchronously.

The diagram also shows the key relationships between these components:

- The API Gateway routes requests to the appropriate API components
- The Authorization Server verifies consents with the Payment Initiation API
- All API components read from and write to the Database
- The Payment Initiation API and Event Subscriptions API publish events to Kafka
- The Stream Processor consumes events from Kafka
- The Stream Processor queries the Database for active subscriptions
- The Stream Processor sends notifications to the TPP Application

This architecture provides several benefits:

- Separation of concerns between different API domains
- Asynchronous event processing with Kafka
- Persistent storage of subscriptions in PostgreSQL
- Scalable webhook delivery through the Stream Processor