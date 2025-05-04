# FAPI 2.0 Token Client Example

This is a simple example that demonstrates how to use the Tyk FAPI Golang SDK to obtain a DPoP-bound access token from a FAPI 2.0 compliant authorization server.

## Prerequisites

- A running FAPI 2.0 compliant authorization server (e.g., Keycloak)
- A registered client with client credentials flow enabled

## Running the Example

```bash
go build && ./token_client
```

You can also set environment variables to override the default configuration:

```bash
CLIENT_ID=my-custom-client AUTH_SERVER_URL=http://custom-server:8081 go run main.go
```

## Configuring Keycloak

Before running the token client, you need to configure the client in Keycloak to use the JWKS URL. You can do this using the provided script:

```bash
chmod +x update_keycloak_client.sh
./update_keycloak_client.sh
```

This script will:

1. Get an admin token from Keycloak
2. Get the client ID for the "my-tpp" client
3. Update the client configuration to use the JWKS URL
4. Set the token endpoint auth signing algorithm to ES256

## What This Example Does

1. Creates a FAPI 2.0 client with DPoP capabilities
2. Starts a JWKS server to serve the public key
3. Configures the JWKS URL to be accessible from Keycloak
4. Generates a client assertion JWT for authentication
5. Generates a DPoP proof for the token request
6. Obtains a DPoP-bound access token from the authorization server
7. Parses and displays information about the token

## Expected Output

```
FAPI 2.0 Token Client
====================
Client ID: my-tpp
Auth Server URL: http://localhost:8081
Realm: fapi-demo
JWKS Server Port: 8082

Creating FAPI client...
JWKS URL for Keycloak: http://host.docker.internal:8082/.well-known/jwks.json
Key ID (kid): abcdef1234567890

Requesting access token...
Access token obtained successfully!

Token Information:
  Subject: service-account-my-tpp
  Issuer: http://localhost:8081/realms/fapi-demo
  Expiration: 1746393456
  DPoP Confirmation (jkt): abcdef1234567890abcdef1234567890
  Scopes: openid

Access Token (first 50 characters):
  eyJhbGciOiJFUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrI...

The JWKS server is running on port 8082
Press Ctrl+C to stop the server
```

## Troubleshooting

If you're having trouble getting an access token, make sure:

1. The JWKS server is running and accessible from Keycloak
2. The client in Keycloak is configured to use the JWKS URL
3. The client in Keycloak has the token endpoint auth signing algorithm set to ES256
4. The client in Keycloak has DPoP bound access tokens enabled

For Keycloak running in Docker, use `http://host.docker.internal:8082/.well-known/jwks.json` as the JWKS URL.

## How It Works

The example uses the Tyk FAPI Golang SDK to:

1. Generate or load an ECDSA key pair
2. Start a JWKS server to serve the public key
3. Configure the JWKS URL to be accessible from Keycloak
4. Create a client assertion JWT for authentication
5. Generate a DPoP proof for the token request
6. Make a token request to the authorization server
7. Parse and display the token information

The token is bound to the client's key using DPoP, which means it can only be used with a valid DPoP proof generated with the same key.