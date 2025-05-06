# Tyk FAPI Node.js SDK - Basic Client Example

This example demonstrates how to use the Tyk FAPI Node.js SDK to create a client that can authenticate with a FAPI-compliant authorization server and make API calls with DPoP proof.

## Prerequisites

- Node.js 16 or higher
- A running Keycloak instance with FAPI realm configured
- A running Tyk Gateway instance with FAPI-compliant APIs

## Setup

1. Install the required dependencies:

```bash
npm install
```

2. Create a `.env` file based on the `.env.example` file:

```bash
cp .env.example .env
```

3. Edit the `.env` file to match your environment:

```
CLIENT_ID=your-client-id
KEYCLOAK_URL=http://your-keycloak-url
TYK_GATEWAY_URL=http://your-tyk-gateway-url
JWKS_SERVER_PORT=8082
```

## Running the Example

Run the example with:

```bash
node index.js
```

## What the Example Does

1. Creates a FAPI client with DPoP support
2. Starts a JWKS server to host the client's public key
3. Obtains an access token using the client credentials flow
4. Displays the token claims
5. Makes API calls to the Tyk Gateway with DPoP proof
6. Cleans up by stopping the JWKS server

## Key Components

- **Client Creation**: Shows how to create a FAPI client with the required parameters
- **Token Acquisition**: Demonstrates how to obtain an access token
- **API Calls**: Shows how to make GET and POST requests with DPoP proof
- **Token Parsing**: Demonstrates how to parse and inspect token claims
- **Cleanup**: Shows how to properly clean up resources

## Notes

- The JWKS server runs on port 8082 by default. Make sure this port is available.
- The example generates a new key pair if one doesn't exist. The private key is saved to `private_key.pem`.
- The public key is exported to `public_key.pem` for reference.