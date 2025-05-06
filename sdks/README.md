# Tyk FAPI 2.0 SDKs

This directory contains SDKs for different programming languages to help developers integrate with FAPI 2.0 compliant APIs using the Tyk API Gateway.

## Available SDKs

- [Golang SDK](./golang/): A Go client for FAPI 2.0 with DPoP support
- [Python SDK](./python/): A Python client for FAPI 2.0 with DPoP support
- [Node.js SDK](./nodejs/): A Node.js client for FAPI 2.0 with DPoP support
- [Java SDK](./java/): Coming soon

## Common Features

All SDKs provide the following features:

- **OAuth2 Client Integration**: Implements the standard OAuth2 client pattern with a TokenSource
- **DPoP Support**: Automatically generates DPoP proofs for token requests and API calls
- **JWKS Server**: Hosts a JSON Web Key Set endpoint for the client's public key
- **Client Assertion**: Creates signed JWT client assertions for authentication
- **Automatic Token Refresh**: Automatically refreshes access tokens when they expire

## SDK Design Philosophy

The SDKs follow a consistent design philosophy:

1. **Consistent Core Functionality**: All SDKs implement the same core features
2. **Language-Specific Patterns**: Each SDK follows established patterns in its ecosystem
3. **Comprehensive Documentation**: Each SDK includes detailed documentation with examples

## Getting Started

Each SDK directory contains its own README with installation instructions, usage examples, and API documentation. The examples directory in each SDK provides complete working examples that demonstrate how to use the SDK in real-world scenarios.

## SDK Comparison

| Feature | Golang | Python | Node.js | Java |
|---------|--------|--------|---------|------|
| Client Credentials Flow | ✅ | ✅ | ✅ | 🔜 |
| DPoP Support | ✅ | ✅ | ✅ | 🔜 |
| JWKS Server | ✅ | ✅ | ✅ | 🔜 |
| Client Assertion | ✅ | ✅ | ✅ | 🔜 |
| Automatic Token Refresh | ✅ | ✅ | ✅ | 🔜 |
| Async Support | ❌ | ✅ | ✅ | 🔜 |

## Contributing

Contributions to improve the SDKs or add support for additional languages are welcome. Please see the [CONTRIBUTING.md](../CONTRIBUTING.md) file for more information.

## License

All SDKs are licensed under the MIT License - see the LICENSE file for details.