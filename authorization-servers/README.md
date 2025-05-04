# Authorization Servers for FAPI Testing

This directory contains configurations for various authorization servers that can be used to test the Tyk FAPI implementation. Each subdirectory contains a specific authorization server setup with instructions on how to use it.

## Available Authorization Servers

### Keycloak

[Keycloak](./keycloak) is an open-source Identity and Access Management solution that supports FAPI 2.0 and DPoP. It's configured with:

- FAPI 2.0 compliant settings
- DPoP support enabled
- ES256 signature algorithm for tokens
- Both confidential (client credentials) and public (authorization code + PKCE) clients

## Planned Authorization Servers

In the future, we plan to add support for other popular identity providers:

- Curity
- Gluu
- Auth0
- Okta
- ForgeRock
- Ping Identity

## Using with Tyk FAPI

Each authorization server is configured to work with the Tyk FAPI implementation. The general steps to use them are:

1. Start the authorization server using the provided configuration
2. Configure the Tyk API definition to use the authorization server as the JWT source
3. Use a FAPI-compliant client to obtain tokens and make requests to the API via Tyk Gateway

For specific instructions, refer to the README.md file in each authorization server's directory.
