# JWKS Server for FAPI 2.0

This is a standalone JWKS (JSON Web Key Set) server that can be used with the Tyk FAPI Golang SDK. It serves a JWKS endpoint that can be used by authorization servers like Keycloak to verify client assertions and DPoP proofs.

## What is a JWKS Server?

A JWKS (JSON Web Key Set) server is a server that exposes a JSON Web Key Set document at a well-known URL. This document contains the public keys that can be used to verify the signatures of JWTs (JSON Web Tokens) issued by the client.

In the context of FAPI 2.0 and DPoP, the JWKS server is used by the authorization server to:

1. Verify the signature of client assertion JWTs used for client authentication
2. Verify the signature of DPoP proof JWTs used to bind access tokens to a specific key pair

## Running the JWKS Server

```bash
go run main.go
```

This will start a JWKS server on port 8082 (by default) and serve the JWKS document at `http://localhost:8082/.well-known/jwks.json`.

## Configuration

You can configure the JWKS server using environment variables:

- `JWKS_SERVER_PORT`: The port to run the JWKS server on (default: 8082)

## Using with Keycloak

When configuring a client in Keycloak, you need to set the JWKS URL to point to this server. Since Keycloak is typically running in a Docker container, you need to use `host.docker.internal` instead of `localhost` to access the host machine:

```
http://host.docker.internal:8082/.well-known/jwks.json
```

## Key Management

The JWKS server generates or loads an ECDSA key pair from `private_key.pem` in the current directory. If the file doesn't exist, it will generate a new key pair and save it to the file.

The public key is exposed in the JWKS document, while the private key is kept secure on the server.

## JWKS Document Format

The JWKS document has the following format:

```json
{
  "keys": [
    {
      "kty": "EC",
      "crv": "P-256",
      "x": "base64url-encoded-x-coordinate",
      "y": "base64url-encoded-y-coordinate",
      "kid": "key-id",
      "alg": "ES256",
      "use": "sig"
    }
  ]
}
```

## Security Considerations

- The private key is stored locally in `private_key.pem`
- The JWKS server should be accessible to the authorization server
- In a production environment, you should use HTTPS for the JWKS server