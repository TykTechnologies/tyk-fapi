# Tyk FAPI Accelerator - Architecture Diagrams

This directory contains architecture diagrams for the Tyk FAPI Accelerator project. The diagrams follow C4 model principles but are implemented using standard Mermaid syntax for better compatibility with GitHub and other Markdown renderers.

## Context Diagram

- [Context Diagram](context-diagram.md) - Shows the Tyk FAPI Accelerator system in its environment, including users, external systems, and key actors.

## Container Diagrams

- [Overall Container Diagram](container-diagram.md) - Shows all major components of the Tyk FAPI Accelerator and their interactions.
- [TPP Application Container Diagram](tpp-application-container-diagram.md) - Shows the internal structure of the TPP Application.
- [Tyk Bank Container Diagram](tyk-bank-container-diagram.md) - Shows the internal structure of the Tyk Bank component, including the event notification system.
- [API Gateway Container Diagram](api-gateway-container-diagram.md) - Shows the internal structure of the API Gateway component.
- [Authorization Server Container Diagram](authorization-server-container-diagram.md) - Shows the internal structure of the Authorization Server component.

## Sequence Diagrams

- [Payment Flow Sequence Diagram](payment-flow-sequence-diagram.md) - Shows the sequence of interactions during a payment flow.
- [Event Notification Sequence Diagram](event-notification-sequence-diagram.md) - Shows the sequence of interactions during the event notification process.

## How to View These Diagrams

These diagrams use Mermaid syntax and can be viewed in several ways:

1. **GitHub Rendering**: GitHub natively supports Mermaid diagrams in markdown files. Simply view the files in GitHub to see the rendered diagrams.

2. **VS Code Extensions**: Install a Mermaid preview extension in VS Code to view the diagrams locally. Recommended extensions include:
   - "Markdown Preview Mermaid Support"
   - "Mermaid Markdown Syntax Highlighting"
   - "Mermaid Preview"

3. **Mermaid Live Editor**: Copy the Mermaid code and paste it into the [Mermaid Live Editor](https://mermaid.live/) to view and export the diagrams.

## Updating the Diagrams

To update these diagrams:

1. Edit the Mermaid code in the respective markdown files
2. Commit the changes to GitHub
3. The diagrams will be automatically rendered when viewing the files in GitHub

## API Analysis

The diagrams are based on an analysis of the API structure in the Tyk API Gateway. The analysis was performed using the following command:

```bash
curl -s -X GET http://localhost:3000/api/apis -H 'Authorization: Bearer 6fc8251e34b5436547f8d4f79bca6b1e'
```

This command retrieves information about the APIs loaded into the gateway, which was used to understand how the TPP communicates with the Tyk Bank via the gateway.