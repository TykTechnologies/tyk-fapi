# Tyk FAPI Accelerator - Context Diagram

This diagram shows the Tyk FAPI Accelerator system in its environment, including users, external systems, and key actors.

```mermaid
flowchart TB
    %% People/Actors
    endUser(["End User
    A customer of the bank who wants to access their accounts via a TPP"])
    tppDeveloper(["TPP Developer
    Developer building applications that integrate with the bank's API"])
    bankAdmin(["Bank Administrator
    Administrator managing the bank's API and services"])
    
    %% Systems
    subgraph tykFAPI ["Tyk FAPI Accelerator"]
        tykFAPISystem["Provides FAPI-compliant APIs for account information and payment initiation"]
    end
    
    %% External Systems
    subgraph external ["External Systems"]
        otherBanks["Other Banks
        Other financial institutions"]
        regulatorySystems["Regulatory Systems
        Financial regulatory systems"]
    end
    
    %% Relationships
    endUser -->|"Views accounts,
    initiates payments"| tykFAPI
    tppDeveloper -->|"Develops against,
    integrates with"| tykFAPI
    bankAdmin -->|"Configures, monitors"| tykFAPI
    tykFAPI -->|"Interacts with"| otherBanks
    tykFAPI -->|"Reports to,
    complies with"| regulatorySystems
    
    %% Styling
    classDef person fill:#08427B,color:#fff,stroke:#052E56
    classDef system fill:#1168BD,color:#fff,stroke:#0B4884
    classDef external fill:#999999,color:#fff,stroke:#6B6B6B
    
    class endUser,tppDeveloper,bankAdmin person
    class tykFAPISystem system
    class otherBanks,regulatorySystems external
```

## Description

The context diagram shows the Tyk FAPI Accelerator system and its interactions with:

1. **End Users**: Customers of the bank who access their accounts and initiate payments through third-party providers
2. **TPP Developers**: Developers who build applications that integrate with the bank's API
3. **Bank Administrators**: Staff who configure and monitor the bank's API and services
4. **Other Banks**: External financial institutions that may interact with the system
5. **Regulatory Systems**: Financial regulatory systems that the accelerator must comply with

This high-level view establishes the boundaries of the system and its external dependencies.