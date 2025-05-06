# Tyk FAPI 2.0 Python SDK

This SDK provides a Python client for FAPI 2.0 with DPoP support. It implements the OAuth2 client pattern with a TokenSource that automatically obtains new access tokens when needed and generates DPoP proofs for every request.

## Features

- **OAuth2 Client Integration**: Implements the standard OAuth2 client pattern with a TokenSource
- **DPoP Support**: Automatically generates DPoP proofs for token requests and API calls
- **JWKS Server**: Hosts a JSON Web Key Set endpoint for the client's public key
- **Client Assertion**: Creates signed JWT client assertions for authentication
- **Automatic Token Refresh**: Automatically refreshes access tokens when they expire

## Installation

```bash
pip install tyk-fapi
```

Or install from source:

```bash
git clone https://github.com/TykTechnologies/tyk-fapi.git
cd tyk-fapi/sdks/python
pip install -e .
```

## Usage

### Creating a Client

```python
from tyk_fapi import Client

# Create a new FAPI client
fapi_client = Client.create(
    client_id="my-client-id",
    auth_server_url="http://auth-server.com",
    api_server_url="http://api-server.com",
    jwks_server_port=8082,
    realm_name="my-realm"
)
```

### Getting an Access Token

```python
# Get an access token using the TokenSource
token = fapi_client.token_source.token()

# Use the token
print(f"Access Token: {token.access_token}")
```

### Making API Calls

```python
# Get the HTTP client that automatically adds DPoP proofs
http_client = fapi_client.client()

# Make a GET request
resp = http_client.get("http://api-server.com/resource")

# Read the response
print(f"API Response: {resp.text}")

# Make a POST request
import json
request_body = json.dumps({"key": "value"})
resp = http_client.post(
    "http://api-server.com/resource",
    data=request_body,
    headers={"Content-Type": "application/json"}
)
```

### Cleaning Up

```python
# Stop the JWKS server when done
fapi_client.stop_jwks_server()
```

## Configuration Options

The client can be configured with various options:

- **client_secret**: Sets the client secret (for clients that use a secret)
- **private_key**: Sets a custom private key
- **jwks_server_port**: Sets the JWKS server port
- **realm_name**: Sets the realm name

## Examples

See the [examples](./examples) directory for complete examples:

- [Basic Client](./examples/basic-client/): A simple example of using the SDK
- [Okta Integration](./examples/okta-integration/): Example of integrating with Okta

## Development

### Prerequisites

- Python 3.8 or higher

### Setup

1. Clone the repository:

```bash
git clone https://github.com/TykTechnologies/tyk-fapi.git
```

2. Install development dependencies:

```bash
cd tyk-fapi/sdks/python
pip install -e ".[dev]"
```

### Running Tests

```bash
pytest
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.