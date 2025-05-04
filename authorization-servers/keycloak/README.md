# Keycloak as FAPI 2.0 Authorization Server

This directory contains configuration for setting up Keycloak as a FAPI 2.0 compliant Authorization Server with DPoP support for testing the Tyk FAPI implementation.

## Prerequisites

- Docker and Docker Compose installed
- Tyk Gateway running with the gRPC plugin
- `jq` command-line tool installed (used by the scripts)

## Getting Started

There are three ways to set up the Keycloak server:

### Option 1: Using the Setup Script

1. Start Keycloak:

```bash
docker-compose up -d
```

2. Access the Keycloak Admin Console:
   - URL: http://localhost:8081/admin/
   - Username: admin
   - Password: admin

3. Run the setup script to configure a FAPI 2.0 compliant realm and clients:

```bash
chmod +x setup-fapi-realm.sh
./setup-fapi-realm.sh
```

The setup script automatically:
- Creates a FAPI 2.0 compliant realm with ES256 as the default signature algorithm
- Creates two client applications (confidential and public)
- Creates a test user

4. Manually apply the FAPI-2 security profile in the Keycloak Admin Console:
   - Go to Realm Settings > Client Policies
   - Click on "Create policy"
   - Set:
     - Name: fapi-2-security-policy
     - Description: FAPI 2.0 Security Policy
     - Enabled: On
   - Under "Conditions", click "Create" and select "Any client"
   - Under "Profiles", select "fapi-2-security-profile"
   - Click "Save"

### Option 2: Importing the Realm Configuration

1. Start Keycloak:

```bash
docker-compose up -d
```

2. Run the import script:

```bash
chmod +x import-realm.sh
./import-realm.sh
```

This will automatically:
- Delete the realm if it already exists
- Import the pre-configured realm from the `fapi-demo-realm.json` file

The imported realm includes:
- FAPI 2.0 compliant settings
- ES256 as the default signature algorithm
- The FAPI-2 security profile applied to all clients
- Two client applications (confidential and public)
- A test user

### Option 3: Manual Import via Admin Console

1. Start Keycloak:

```bash
docker-compose up -d
```

2. Access the Keycloak Admin Console:
   - URL: http://localhost:8081/admin/
   - Username: admin
   - Password: admin

3. Import the realm configuration:
   - Hover over the realm dropdown in the top-left corner
   - Click "Create Realm"
   - Click "Browse" and select the `fapi-demo-realm.json` file from this directory
   - Click "Create"

## Exporting the Realm Configuration

If you've made changes to the realm configuration and want to export it for future use, you can use the export script:

```bash
chmod +x export-realm.sh
./export-realm.sh
```

This will export the realm configuration to `fapi-demo-realm.json`, including all clients, users, and client policies.

## Configuration Details

The setup creates:

1. A FAPI 2.0 compliant realm named `fapi-demo` with:
   - ES256 as the default signature algorithm
   - PKCE required
   - Proper security headers

2. Two client applications:
   - `my-tpp`: A confidential client using client credentials flow
   - `my-tpp-public`: A public client using authorization code flow with PKCE

3. A test user:
   - Username: test-user
   - Password: password

Both clients are configured with:
- ES256 signature algorithm for tokens (compatible with Tyk)
- DPoP bound access tokens
- PKCE (Proof Key for Code Exchange) for the public client

## Testing with Different Flows

### Client Credentials Flow (Server-to-Server)

Use the confidential client (`my-tpp`) for server-to-server authentication scenarios. This client uses JWT authentication and DPoP bound tokens.

### Authorization Code Flow with PKCE (Browser-Based)

Use the public client (`my-tpp-public`) for browser-based authentication scenarios. This client requires PKCE and uses DPoP bound tokens.

## Manual Configuration

If you prefer to configure Keycloak manually, follow these steps:

### Create a new realm

1. Log in to the Keycloak Admin Console
2. Hover over the realm dropdown in the top-left corner and click "Create Realm"
3. Name it "fapi-demo" and click "Create"

### Configure FAPI 2.0 Compliance Settings

1. Go to the "Realm Settings" > "Tokens" tab
2. Set "Default Signature Algorithm" to ES256
3. Go to the "Realm Settings" > "Security Defenses" tab
4. Under "Content-Security-Policy", add appropriate CSP headers
5. Enable "Require Proof Key for Code Exchange"

### Create a Confidential Client (Server-Side)

1. Go to "Clients" and click "Create client"
2. Set:
   - Client ID: my-tpp
   - Client Type: OpenID Connect
   - Click "Next"
3. Enable:
   - Client authentication: On
   - Authorization: On
   - Click "Next" and then "Save"
4. In the client settings:
   - Access Type: confidential
   - Standard Flow Enabled: Off
   - Direct Access Grants Enabled: Off
   - Service Accounts Enabled: On
5. Under "Advanced" tab:
   - Access Token Signature Algorithm: ES256
   - ID Token Signature Algorithm: ES256
   - DPoP Bound Access Tokens: Required

### Create a Public Client (Browser-Based)

1. Go to "Clients" and click "Create client"
2. Set:
   - Client ID: my-tpp-public
   - Client Type: OpenID Connect
   - Click "Next"
3. Enable:
   - Client authentication: Off
   - Authorization: Off
   - Click "Next" and then "Save"
4. In the client settings:
   - Access Type: public
   - Valid Redirect URIs: http://localhost:3000/callback
   - Web Origins: http://localhost:3000
5. Under "Advanced" tab:
   - Access Token Signature Algorithm: ES256
   - ID Token Signature Algorithm: ES256
   - Require Proof Key for Code Exchange: On
   - DPoP Bound Access Tokens: Required

### Create a Test User

1. Go to "Users" and click "Add user"
2. Set:
   - Username: test-user
   - Email: test@example.com
   - First Name: Test
   - Last Name: User
   - Click "Create"
3. Go to the "Credentials" tab
4. Set a password and disable "Temporary"

### Apply FAPI 2.0 Client Policy

1. Go to "Realm Settings" > "Client Policies"
2. Click on "Create policy"
3. Set:
   - Name: fapi-2-security-policy
   - Description: FAPI 2.0 Security Policy
   - Enabled: On
4. Under "Conditions", click "Create" and select "Any client"
5. Under "Profiles", select "fapi-2-security-profile"
6. Click "Save"

## Testing with Tyk FAPI

After setting up Keycloak, you can test the integration with Tyk FAPI:

1. Configure the Tyk API definition to use Keycloak as the JWT source:
   - Update the `jwt_source` in the API definition to point to: `http://localhost:8081/realms/fapi-demo/protocol/openid-connect/certs`

2. Use a FAPI-compliant client to obtain a DPoP-bound token from Keycloak and make requests to your Tyk API.

## Important Endpoints

- JWKS URL: http://localhost:8081/realms/fapi-demo/protocol/openid-connect/certs
- Token URL: http://localhost:8081/realms/fapi-demo/protocol/openid-connect/token
- Authorization URL: http://localhost:8081/realms/fapi-demo/protocol/openid-connect/auth

## Troubleshooting

- If you encounter CORS issues, make sure the Web Origins in the client settings include your client application's origin.
- For token validation issues, check that the JWT source URL in the Tyk API definition is correct.
- Ensure the DPoP feature is enabled in Keycloak by checking the KC_FEATURES environment variable.
- If the setup script fails, check that jq is installed and that Keycloak is running.
- To verify the FAPI 2.0 client policy is applied, go to Realm Settings > Client Policies in the Keycloak Admin Console.