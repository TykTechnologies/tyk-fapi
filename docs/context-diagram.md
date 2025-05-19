# Tyk FAPI Accelerator - Context Diagram

This diagram shows the Tyk FAPI Accelerator system in its environment, including users and key actors.

```mermaid
flowchart TB
    %% People/Actors
    psu(["PSU (Payment Services User)
    A customer of the bank who accesses their accounts and initiates payments through third-party providers"])
    tpp(["TPP (Third Party Provider)
    Companies providing financial services like account aggregators, credit checkers, and savings apps that integrate with banks"])
    aspsp(["ASPSP (Account Servicing Payment Service Provider)
    Banks and financial institutions that provide account and payment APIs to authorized third parties"])
    
    %% Systems
    subgraph tykFAPI ["Tyk FAPI Accelerator"]
        tykFAPISystem["Provides FAPI-compliant APIs for account information and payment initiation"]
    end
    
    %% Relationships
    psu -->|"Views accounts,
    initiates payments"| tykFAPI
    tpp -->|"Integrates with,
    consumes APIs from"| tykFAPI
    aspsp -->|"Configures, monitors,
    provides services through"| tykFAPI
    
    %% Styling
    classDef person fill:#335FFD,color:#fff,stroke:#1A3FBD
    classDef system fill:#5900CB,color:#fff,stroke:#3D0087
    class psu,tpp,aspsp person
    class tykFAPISystem system
```

## Description

The context diagram shows the Tyk FAPI Accelerator system and its interactions with:

1. **PSU (Payment Services User)**: Customers of banks who access their accounts and initiate payments through third-party providers
2. **TPP (Third Party Provider)**: Companies that provide financial services such as account aggregation, credit checking, and savings applications by integrating with banks' APIs
3. **ASPSP (Account Servicing Payment Service Provider)**: Banks and financial institutions that expose their account and payment services through APIs to authorized third parties

This high-level view establishes the boundaries of the system and its key interactions.