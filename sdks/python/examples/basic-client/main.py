#!/usr/bin/env python3
"""
Basic example of using the Tyk FAPI Python SDK.
"""

import os
import json
from dotenv import load_dotenv
from tyk_fapi import Client

# Load .env file if it exists
load_dotenv()

def get_env(key, default):
    """Get an environment variable or return a default value."""
    return os.environ.get(key, default)

def main():
    # Get configuration from environment variables
    client_id = get_env("CLIENT_ID", "my-tpp")
    keycloak_url = get_env("KEYCLOAK_URL", "http://localhost:8081")
    tyk_gateway_url = get_env("TYK_GATEWAY_URL", "http://localhost:8080")
    jwks_server_port = int(get_env("JWKS_SERVER_PORT", "8082"))

    # Create a new FAPI client
    fapi_client = Client.create(
        client_id=client_id,
        auth_server_url=keycloak_url,
        api_server_url=tyk_gateway_url,
        jwks_server_port=jwks_server_port,
        realm_name="fapi-demo"
    )

    print(f"JWKS URL: {fapi_client.jwks_url}")
    print("FAPI 2.0 Client created successfully")
    print(f"Client ID: {fapi_client.client_id}")
    print(f"Key ID (kid): {fapi_client.kid}")
    print(f"JWK Thumbprint (jkt): {fapi_client.jkt}")

    # Export the public key to PEM file
    fapi_client.export_public_key_to_pem("public_key.pem")
    print("Public key exported to public_key.pem")
    print()

    # Get an access token
    print("Getting access token...")
    token = fapi_client.token_source.token()
    print("Access token obtained successfully")

    # Parse the token to display some information
    from tyk_fapi.utils import parse_token
    claims = parse_token(token.access_token)

    print("Token claims:")
    # Log all claims in the token
    print("All token claims:")
    for key, value in claims.items():
        print(f"  {key}: {value}")

    # Check specifically for audience claim
    if "aud" in claims:
        print(f"  Audience claim found: {claims['aud']} (type: {type(claims['aud']).__name__})")
    else:
        print("  WARNING: No audience (aud) claim found in the token!")

    # Check for azp claim as an alternative
    if "azp" in claims:
        print(f"  Authorized party (azp) claim found: {claims['azp']} (type: {type(claims['azp']).__name__})")

    # Make an API call to the payments endpoint
    print("\nMaking API call to /payments/get...")

    # Get the HTTP client that automatically adds DPoP proofs
    http_client = fapi_client.client()

    # Make a GET request
    resp = http_client.get(f"{tyk_gateway_url}/payments/anything")
    
    # Read the response
    print(f"API Response: {resp.text}")

    # Example of a POST request
    print("\nMaking POST API call to /payments/create...")

    # Create a request body
    request_body = json.dumps({"amount": 100, "currency": "USD"})

    # Make a POST request
    resp = http_client.post(
        f"{tyk_gateway_url}/payments/anything",
        data=request_body,
        headers={"Content-Type": "application/json"}
    )

    # Read the response
    print(f"API Response: {resp.text}")

    # Clean up
    fapi_client.stop_jwks_server()

if __name__ == "__main__":
    main()