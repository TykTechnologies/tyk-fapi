# Tyk FAPI 2.0 Node.js SDK

This SDK provides a Node.js client for FAPI 2.0 with DPoP support. It implements the OAuth2 client pattern with a TokenSource that automatically obtains new access tokens when needed and generates DPoP proofs for every request.

## Features

- **OAuth2 Client Integration**: Implements the standard OAuth2 client pattern with a TokenSource
- **DPoP Support**: Automatically generates DPoP proofs for token requests and API calls
- **JWKS Server**: Hosts a JSON Web Key Set endpoint for the client's public key
- **Client Assertion**: Creates signed JWT client assertions for authentication
- **Automatic Token Refresh**: Automatically refreshes access tokens when they expire

## Installation

```bash
npm install tyk-fapi
```

Or install from source:

```bash
git clone https://github.com/TykTechnologies/tyk-fapi.git
cd tyk-fapi/sdks/nodejs
npm install
```

## Usage

### Creating a Client

```javascript
const { Client } = require('tyk-fapi');

// Create a new FAPI client
const fapiClient = await Client.create(
  'my-client-id',
  'http://auth-server.com',
  'http://api-server.com',
  {
    jwksServerPort: 8082,
    realmName: 'my-realm'
  }
);
```

### Getting an Access Token

```javascript
// Get an access token using the TokenSource
const token = await fapiClient.tokenSource.getToken();

// Use the token
console.log(`Access Token: ${token.accessToken}`);
```

### Making API Calls

```javascript
// Get the HTTP client that automatically adds DPoP proofs
const httpClient = fapiClient.client();

// Make a GET request
const resp = await httpClient.get('http://api-server.com/resource');

// Read the response
console.log(`API Response: ${JSON.stringify(resp.data)}`);

// Make a POST request
const requestBody = { key: 'value' };
const postResp = await httpClient.post(
  'http://api-server.com/resource',
  requestBody,
  {
    headers: { 'Content-Type': 'application/json' }
  }
);
```

### Cleaning Up

```javascript
// Stop the JWKS server when done
await fapiClient.stopJWKSServer();
```

## Configuration Options

The client can be configured with various options:

- **clientSecret**: Sets the client secret (for clients that use a secret)
- **privateKey**: Sets a custom private key
- **jwksServerPort**: Sets the JWKS server port
- **realmName**: Sets the realm name

## Examples

See the [examples](./examples) directory for complete examples:

- [Basic Client](./examples/basic-client/): A simple example of using the SDK
- [Keycloak Integration](./examples/keycloak-integration/): Example of integrating with Keycloak

## Development

### Prerequisites

- Node.js 16 or higher

### Setup

1. Clone the repository:

```bash
git clone https://github.com/TykTechnologies/tyk-fapi.git
```

2. Install dependencies:

```bash
cd tyk-fapi/sdks/nodejs
npm install
```

3. Build the SDK:

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.