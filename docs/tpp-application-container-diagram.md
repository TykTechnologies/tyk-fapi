# TPP Application - Container Diagram

This diagram shows the internal structure of the TPP Application, which is one of the key components of the Tyk FAPI Accelerator.

```mermaid
flowchart TB
    %% External Actors/Systems
    endUser(["End User
    A customer of the bank who wants to access their accounts via a TPP"])
    apiGateway["API Gateway
    (Tyk Gateway)"]
    authServer["Authorization Server
    (Keycloak)"]
    
    %% TPP Application Components
    subgraph tppApp ["TPP Application (NextJS)"]
        clientApp["Client-side Application
        (React Components)
        Provides user interface for account information and payments"]
        serverRoutes["Server-side API Routes
        (Next.js API Routes)
        Proxy between client and external APIs"]
        apiClients["API Clients
        (TypeScript)
        Handle communication with external APIs"]
        stateManagement["State Management
        (React Query)
        Manages client-side state and data fetching"]
    end
    
    %% Relationships
    endUser -->|"Interacts with
    (Browser)"| clientApp
    clientApp -->|"Uses
    (React Hooks)"| stateManagement
    stateManagement -->|"Calls
    (Function calls)"| apiClients
    apiClients -->|"Makes requests to
    (HTTP)"| serverRoutes
    serverRoutes -->|"Proxies requests to
    (HTTPS)"| apiGateway
    serverRoutes -->|"Authenticates with
    (OAuth 2.0/OIDC)"| authServer
    
    %% Styling
    classDef person fill:#08427B,color:#fff,stroke:#052E56
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295
    classDef component fill:#85BBF0,color:#000,stroke:#5D82A8
    classDef external fill:#999999,color:#fff,stroke:#6B6B6B
    
    class endUser person
    class clientApp,serverRoutes,apiClients,stateManagement component
    class apiGateway,authServer external
```

## Description

The TPP Application container diagram shows the internal components of the TPP Application:

1. **Client-side Application**: React components that provide the user interface for viewing account information and initiating payments. This is what the end user interacts with directly in their browser.

2. **Server-side API Routes**: Next.js API routes that act as a proxy between the client-side application and external APIs. These routes handle authentication, error handling, and request/response transformation.

3. **API Clients**: TypeScript modules that handle communication with external APIs. They provide a clean interface for the client-side application to interact with the backend services.

4. **State Management**: React Query hooks that manage client-side state and data fetching. They provide caching, refetching, and error handling capabilities.

The diagram also shows the key relationships between these components:

- The End User interacts with the Client-side Application through their browser
- The Client-side Application uses State Management through React hooks
- State Management calls API Clients to fetch data
- API Clients make requests to Server-side API Routes
- Server-side API Routes proxy requests to the API Gateway
- Server-side API Routes authenticate with the Authorization Server

This architecture provides several benefits:

- Separation of concerns between UI, state management, and API communication
- Server-side proxying for security and error handling
- Type safety with TypeScript
- Efficient state management with React Query