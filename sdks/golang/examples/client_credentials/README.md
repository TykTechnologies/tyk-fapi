# FAPI 2.0 Client Credentials Flow Example

This example demonstrates how to use the Tyk FAPI Golang SDK to obtain a DPoP-bound access token using the client credentials flow and make an authenticated API call.

## Prerequisites

- A running FAPI 2.0 compliant authorization server (e.g., Keycloak)
- A registered client with client credentials flow enabled
- A Tyk Gateway configured to accept DPoP tokens

## Configuration

Edit the `.env` file to configure the client:

```
# FAPI Client Configuration
CLIENT_ID=my-tpp
KEYCLOAK_URL=http://localhost:8081
TYK_GATEWAY_URL=http://localhost:8080
JWKS_SERVER_PORT=8082
```

## Running the Example

```bash
go run main.go
```

## What This Example Does

1. Creates a FAPI 2.0 client with DPoP capabilities
2. Starts a local JWKS server to serve the public key
3. Generates a client assertion JWT for authentication
4. Generates a DPoP proof for the token request
5. Obtains a DPoP-bound access token from the authorization server
6. Makes an authenticated API call to the Tyk Gateway
7. Displays the API response

## Expected Output

```
JWKS URL: http://localhost:8082/.well-known/jwks.json
FAPI 2.0 Client created successfully
Client ID: my-tpp
Key ID (kid): abcdef1234567890
JWK Thumbprint (jkt): abcdef1234567890abcdef1234567890
Public key exported to public_key.pem

Getting access token...
Access token obtained successfully
Token claims:
  Subject: service-account-my-tpp
  Issuer: http://localhost:8081/realms/fapi-demo
  Expiration: 1746393456
  Confirmation: map[jkt:abcdef1234567890abcdef1234567890]

Making API call to /payments/get...
API Response: {"status":"success","data":{"payments":[{"id":"123","amount":100,"currency":"USD"},{"id":"456","amount":200,"currency":"EUR"}]}}
```

## Keycloak Configuration

In Keycloak, you need to:

1. Create a client with ID matching the `CLIENT_ID` in the `.env` file
2. Enable "Service Account Roles" (client credentials flow)
3. Enable "Client Authentication"
4. Set the client authenticator to "Signed JWT"
5. Configure the JWKS URL to point to the client's JWKS endpoint (e.g., `http://localhost:8082/.well-known/jwks.json`)
6. Enable DPoP bound access tokens

## Tyk Gateway Configuration

The Tyk Gateway needs to be configured to:

1. Accept DPoP tokens
2. Validate the DPoP proof
3. Forward the request to the upstream service