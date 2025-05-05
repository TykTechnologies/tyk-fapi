# Tyk FAPI 2.0 Golang SDK

This SDK provides a Golang client for FAPI 2.0 with DPoP support. It implements the OAuth2 client pattern with a TokenSource that automatically obtains new access tokens when needed and generates DPoP proofs for every request.

## Features

- **OAuth2 Client Integration**: Implements the standard OAuth2 client pattern with a TokenSource
- **DPoP Support**: Automatically generates DPoP proofs for token requests and API calls
- **JWKS Server**: Hosts a JSON Web Key Set endpoint for the client's public key
- **Client Assertion**: Creates signed JWT client assertions for authentication
- **Automatic Token Refresh**: Automatically refreshes access tokens when they expire

## Installation

```bash
go get github.com/TykTechnologies/tyk-fapi/sdks/golang
```

## Usage

### Creating a Client

```go
import "github.com/TykTechnologies/tyk-fapi/sdks/golang/pkg/client"

// Create a new FAPI client
fapiClient, err := client.NewClient(
    "my-client-id",
    "http://auth-server.com",
    "http://api-server.com",
    client.WithJwksServerPort(8082),
    client.WithRealmName("my-realm"),
)
if err != nil {
    log.Fatalf("Failed to create client: %v", err)
}
```

### Getting an Access Token

```go
// Get an access token using the TokenSource
token, err := fapiClient.TokenSource.Token()
if err != nil {
    log.Fatalf("Failed to get access token: %v", err)
}

// Use the token
fmt.Printf("Access Token: %s\n", token.AccessToken)
```

### Making API Calls

```go
// Get the HTTP client that automatically adds DPoP proofs
httpClient := fapiClient.Client()

// Make a GET request
resp, err := httpClient.Get("http://api-server.com/resource")
if err != nil {
    log.Fatalf("API call failed: %v", err)
}
defer resp.Body.Close()

// Read the response
body, err := io.ReadAll(resp.Body)
if err != nil {
    log.Fatalf("Failed to read API response: %v", err)
}

fmt.Printf("API Response: %s\n", string(body))

// Make a POST request
requestBody := strings.NewReader(`{"key": "value"}`)
resp, err = httpClient.Post("http://api-server.com/resource", "application/json", requestBody)
if err != nil {
    log.Fatalf("API call failed: %v", err)
}
defer resp.Body.Close()
```

### Cleaning Up

```go
// Stop the JWKS server when done
if err := fapiClient.StopJWKSServer(); err != nil {
    log.Printf("Warning: Failed to stop JWKS server: %v", err)
}
```

## Configuration Options

The client can be configured with various options:

- **WithClientSecret**: Sets the client secret (for clients that use a secret)
- **WithPrivateKeyFile**: Sets the private key from a file
- **WithJwksServerPort**: Sets the JWKS server port
- **WithRealmName**: Sets the realm name
- **WithHttpClient**: Sets a custom HTTP client

## Examples

See the [examples](./examples) directory for complete examples:

- [Client Credentials](./examples/client_credentials): Example of using the client credentials flow
