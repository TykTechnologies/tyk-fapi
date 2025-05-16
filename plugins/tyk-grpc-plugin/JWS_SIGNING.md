# JWS Signing Capability for Tyk FAPI Plugin

This document describes the JWS (JSON Web Signature) signing capability added to the Tyk FAPI plugin. This feature enables the plugin to sign event notification requests with detached JWS signatures and optionally forward them to target URLs.

## Overview

The JWS signing capability allows the Tyk API Gateway to:

1. Receive event notification requests from the mock bank
2. Sign the request body with a detached JWS signature using ES256 algorithm
3. Add the signature in the `x-jws-signature` header
4. Optionally extract a target URL from the `x-rewrite-target` header
5. Either forward the signed request to the target URL or continue proxying the request

This is particularly useful for event notifications in the Open Banking context, where the bank needs to sign the event notifications it sends to TPPs (Third Party Providers).

## Modes of Operation

The JWS signing middleware supports two modes of operation:

1. **Target Rewriting Mode**: When the `x-rewrite-target` header is present, the middleware will:
   - Sign the request with a detached JWS signature
   - Make an API call to the target URL specified in the header
   - Return the response from the target URL as the response to the original request

2. **Pass-through Mode**: When the `x-rewrite-target` header is not present, the middleware will:
   - Sign the request with a detached JWS signature
   - Continue proxying the request to the upstream service

## Configuration

### Environment Variables

The JWS signing capability is configured using the following environment variables:

- `JWS_PRIVATE_KEY_PATH`: Path to the private key file (PEM format)
- `JWS_PRIVATE_KEY`: Private key as a string (PEM format)
- `JWS_KEY_ID`: Key ID to use in the JWS header
- `JWS_ISSUER`: Issuer to use in the JWS header

You must set either `JWS_PRIVATE_KEY_PATH` or `JWS_PRIVATE_KEY` for the JWS signing to work. If both are set, `JWS_PRIVATE_KEY_PATH` takes precedence.

### API Definition

To use the JWS signing capability, you need to create an API definition that uses the `JWSSign` function. Here's an example:

```yaml
info:
  title: Event Notification Forwarder
  version: 1.0.0
openapi: 3.0.3
paths: {}
servers:
  - url: http://gateway.ahmet:8080/event-notifications/
x-tyk-api-gateway:
  info:
    name: Event Notification Forwarder
    state:
      active: true
  middleware:
    global:
      contextVariables:
        enabled: true
      pluginConfig:
        driver: grpc
      prePlugins:
        - enabled: true
          functionName: JWSSign
          path: ''
      trafficLogs:
        enabled: true
  server:
    listenPath:
      strip: true
      value: /event-notifications-forwarder/
  upstream:
    url: https://httpbin.org/anything
```

## Headers

### x-rewrite-target

The `x-rewrite-target` header is used to specify a target URL where the signed request should be forwarded. When this header is present, the middleware will:

1. Sign the request with a detached JWS signature
2. Make an API call to the target URL specified in the header
3. Return the response from the target URL as the response to the original request

If the header is not present, the middleware will simply sign the request and continue proxying it to the upstream service.

### x-jws-signature

The `x-jws-signature` header contains the detached JWS signature for the request body. This header is added by the middleware and is used by the receiving system to verify the authenticity and integrity of the request.

## Usage

### Target Rewriting Mode

To send a request that will be signed and forwarded to a specific target URL:

1. Send a POST request to the API Gateway at the endpoint defined in the API definition (e.g., `/event-notifications-forwarder/`)
2. Include the `x-rewrite-target` header with the URL where the request should be forwarded
3. Include the request payload in the request body

Example:

```bash
curl -X POST \
  http://localhost:8080/event-notifications-forwarder/ \
  -H 'Content-Type: application/json' \
  -H 'x-rewrite-target: https://tpp.example.com/event-notifications' \
  -d '{
    "iss": "https://tyk-bank.example.com",
    "iat": 1619712000,
    "jti": "evt-12345678",
    "aud": "https://tpp.example.com",
    "sub": "urn:uk:org:openbanking:payment:p-12345678",
    "txn": "txn-12345678",
    "toe": 1619712000,
    "events": {
      "urn:uk:org:openbanking:events:resource-update": {
        "subject": {
          "subject_type": "payment",
          "http://openbanking.org.uk/rid": "p-12345678",
          "http://openbanking.org.uk/rty": "payment",
          "http://openbanking.org.uk/rlk": [
            {
              "version": "1.0",
              "link": "https://tyk-bank.example.com/domestic-payments/p-12345678"
            }
          ]
        }
      }
    }
  }'
```

### Pass-through Mode

To send a request that will be signed and proxied to the upstream service:

1. Send a POST request to the API Gateway at the endpoint defined in the API definition (e.g., `/event-notifications-forwarder/`)
2. Do not include the `x-rewrite-target` header
3. Include the request payload in the request body

Example:

```bash
curl -X POST \
  http://localhost:8080/event-notifications-forwarder/ \
  -H 'Content-Type: application/json' \
  -d '{
    "iss": "https://tyk-bank.example.com",
    "iat": 1619712000,
    "jti": "evt-12345678",
    "aud": "https://tpp.example.com",
    "sub": "urn:uk:org:openbanking:payment:p-12345678",
    "txn": "txn-12345678",
    "toe": 1619712000,
    "events": {
      "urn:uk:org:openbanking:events:resource-update": {
        "subject": {
          "subject_type": "payment",
          "http://openbanking.org.uk/rid": "p-12345678",
          "http://openbanking.org.uk/rty": "payment",
          "http://openbanking.org.uk/rlk": [
            {
              "version": "1.0",
              "link": "https://tyk-bank.example.com/domestic-payments/p-12345678"
            }
          ]
        }
      }
    }
  }'
```

### Receiving Signed Event Notifications

When receiving signed event notifications, the TPP should:

1. Extract the detached JWS signature from the `x-jws-signature` header
2. Verify the signature against the request body using the bank's public key

## JWS Signature Format

The JWS signature follows the detached JWS format as specified in RFC 7515, with the following characteristics:

- Algorithm: ES256 (ECDSA with P-256 curve and SHA-256)
- Header: Contains `alg`, `typ`, `kid`, `crit`, and `b64` fields
- Payload: Not base64-encoded (detached)
- Signature: Base64url-encoded

The signature is sent in the `x-jws-signature` header in the format `header..signature` (note the double dot indicating a detached payload).

## Key Generation

To generate an ECDSA key pair for JWS signing:

```bash
# Generate a private key
openssl ecparam -name prime256v1 -genkey -noout -out private.pem

# Generate the corresponding public key
openssl ec -in private.pem -pubout -out public.pem
```

## Testing

You can test the JWS signing capability using the provided test script:

```bash
cd plugins/tyk-grpc-plugin
go test -v
```

## Troubleshooting

If you encounter issues with the JWS signing:

1. Check that the private key is correctly configured
2. Verify that the `x-callback-url` header is included in the request
3. Check the logs for any error messages
4. Ensure that the API definition is correctly configured to use the `JWSSign` function