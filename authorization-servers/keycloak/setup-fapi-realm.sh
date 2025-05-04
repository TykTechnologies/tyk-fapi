#!/bin/bash
set -e

# Configuration
KEYCLOAK_URL="http://localhost:8081"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="fapi-demo"
CONFIDENTIAL_CLIENT_ID="my-tpp"
PUBLIC_CLIENT_ID="my-tpp-public"
TEST_USER="test-user"
TEST_USER_PASSWORD="password"
TEST_USER_EMAIL="test@example.com"
TEST_USER_FIRSTNAME="Test"
TEST_USER_LASTNAME="User"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up FAPI 2.0 compliant realm and client in Keycloak...${NC}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}jq is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Keycloak is running
echo -e "${YELLOW}Checking if Keycloak is running...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" $KEYCLOAK_URL > /dev/null; then
    echo -e "${RED}Keycloak is not running. Please start it with 'docker-compose up -d'${NC}"
    exit 1
fi
echo -e "${GREEN}Keycloak is running.${NC}"

# Wait for Keycloak to be fully ready
echo -e "${YELLOW}Waiting for Keycloak to be fully ready...${NC}"
sleep 10

# Get admin token
echo -e "${YELLOW}Getting admin token...${NC}"
ADMIN_TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USERNAME" \
    -d "password=$ADMIN_PASSWORD" \
    -d "grant_type=password" \
    -d "client_id=admin-cli")

ADMIN_TOKEN=$(echo $ADMIN_TOKEN_RESPONSE | jq -r '.access_token')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Failed to get admin token. Check your credentials.${NC}"
    exit 1
fi
echo -e "${GREEN}Got admin token.${NC}"

# Check if realm exists
echo -e "${YELLOW}Checking if realm $REALM_NAME exists...${NC}"
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$KEYCLOAK_URL/admin/realms/$REALM_NAME")

if [ "$REALM_EXISTS" == "200" ]; then
    echo -e "${YELLOW}Realm $REALM_NAME already exists. Skipping creation.${NC}"
else
    echo -e "${YELLOW}Creating realm $REALM_NAME...${NC}"
    
    # Create a minimal realm first
    curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"realm\":\"$REALM_NAME\",\"enabled\":true}"
    
    echo -e "${GREEN}Created realm $REALM_NAME.${NC}"
    
    # Wait for realm to be fully created
    sleep 5
    
    # Now update the realm with full configuration
    echo -e "${YELLOW}Configuring realm for FAPI 2.0 compliance...${NC}"
    curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM_NAME" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "realm": "'$REALM_NAME'",
            "enabled": true,
            "displayName": "FAPI 2.0 Demo Realm",
            "sslRequired": "external",
            "registrationAllowed": false,
            "bruteForceProtected": true,
            "accessTokenLifespan": 300,
            "accessTokenLifespanForImplicitFlow": 300,
            "defaultSignatureAlgorithm": "ES256",
            "attributes": {
                "pkce.code.challenge.method": "S256",
                "require.pushed.authorization.requests": "false",
                "client-policies.profiles.global.enabled": "true"
            },
            "browserSecurityHeaders": {
                "contentSecurityPolicy": "frame-src self; frame-ancestors self; object-src none;",
                "xContentTypeOptions": "nosniff",
                "xRobotsTag": "none",
                "xFrameOptions": "SAMEORIGIN",
                "xXSSProtection": "1; mode=block",
                "strictTransportSecurity": "max-age=31536000; includeSubDomains"
            }
        }'
    
    echo -e "${GREEN}Configured realm for FAPI 2.0 compliance.${NC}"
fi

# Create confidential client (client credentials flow)
echo -e "${YELLOW}Creating confidential client $CONFIDENTIAL_CLIENT_ID...${NC}"
CLIENT_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CONFIDENTIAL_CLIENT_ID")
CLIENT_EXISTS=$(echo $CLIENT_RESPONSE | jq -r 'length')

if [ "$CLIENT_EXISTS" != "0" ]; then
    echo -e "${YELLOW}Client $CONFIDENTIAL_CLIENT_ID already exists. Updating configuration...${NC}"
    CLIENT_UUID=$(echo $CLIENT_RESPONSE | jq -r '.[0].id')
    
    curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$CLIENT_UUID" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "'$CONFIDENTIAL_CLIENT_ID'",
            "name": "FAPI 2.0 Confidential Client",
            "description": "Client for testing FAPI 2.0 compliance with client credentials flow",
            "enabled": true,
            "clientAuthenticatorType": "client-jwt",
            "redirectUris": ["http://localhost:3000/callback"],
            "webOrigins": ["http://localhost:3000"],
            "standardFlowEnabled": false,
            "implicitFlowEnabled": false,
            "directAccessGrantsEnabled": false,
            "serviceAccountsEnabled": true,
            "authorizationServicesEnabled": true,
            "publicClient": false,
            "frontchannelLogout": false,
            "protocol": "openid-connect",
            "attributes": {
                "access.token.signed.response.alg": "ES256",
                "id.token.signed.response.alg": "ES256",
                "access.token.lifespan": "300",
                "dpop.bound.access.tokens": "required"
            }
        }'
else
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "'$CONFIDENTIAL_CLIENT_ID'",
            "name": "FAPI 2.0 Confidential Client",
            "description": "Client for testing FAPI 2.0 compliance with client credentials flow",
            "enabled": true,
            "clientAuthenticatorType": "client-jwt",
            "redirectUris": ["http://localhost:3000/callback"],
            "webOrigins": ["http://localhost:3000"],
            "standardFlowEnabled": false,
            "implicitFlowEnabled": false,
            "directAccessGrantsEnabled": false,
            "serviceAccountsEnabled": true,
            "authorizationServicesEnabled": true,
            "publicClient": false,
            "frontchannelLogout": false,
            "protocol": "openid-connect",
            "attributes": {
                "access.token.signed.response.alg": "ES256",
                "id.token.signed.response.alg": "ES256",
                "access.token.lifespan": "300",
                "dpop.bound.access.tokens": "required"
            }
        }'
    echo -e "${GREEN}Created confidential client $CONFIDENTIAL_CLIENT_ID.${NC}"
fi

# Create public client (authorization code + PKCE flow)
echo -e "${YELLOW}Creating public client $PUBLIC_CLIENT_ID...${NC}"
CLIENT_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$PUBLIC_CLIENT_ID")
CLIENT_EXISTS=$(echo $CLIENT_RESPONSE | jq -r 'length')

if [ "$CLIENT_EXISTS" != "0" ]; then
    echo -e "${YELLOW}Client $PUBLIC_CLIENT_ID already exists. Updating configuration...${NC}"
    CLIENT_UUID=$(echo $CLIENT_RESPONSE | jq -r '.[0].id')
    
    curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$CLIENT_UUID" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "'$PUBLIC_CLIENT_ID'",
            "name": "FAPI 2.0 Public Client",
            "description": "Client for testing FAPI 2.0 compliance with authorization code + PKCE flow",
            "enabled": true,
            "redirectUris": ["http://localhost:3000/callback"],
            "webOrigins": ["http://localhost:3000"],
            "standardFlowEnabled": true,
            "implicitFlowEnabled": false,
            "directAccessGrantsEnabled": false,
            "serviceAccountsEnabled": false,
            "authorizationServicesEnabled": false,
            "publicClient": true,
            "frontchannelLogout": false,
            "protocol": "openid-connect",
            "attributes": {
                "access.token.signed.response.alg": "ES256",
                "id.token.signed.response.alg": "ES256",
                "access.token.lifespan": "300",
                "pkce.code.challenge.method": "S256",
                "dpop.bound.access.tokens": "required"
            }
        }'
else
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "'$PUBLIC_CLIENT_ID'",
            "name": "FAPI 2.0 Public Client",
            "description": "Client for testing FAPI 2.0 compliance with authorization code + PKCE flow",
            "enabled": true,
            "redirectUris": ["http://localhost:3000/callback"],
            "webOrigins": ["http://localhost:3000"],
            "standardFlowEnabled": true,
            "implicitFlowEnabled": false,
            "directAccessGrantsEnabled": false,
            "serviceAccountsEnabled": false,
            "authorizationServicesEnabled": false,
            "publicClient": true,
            "frontchannelLogout": false,
            "protocol": "openid-connect",
            "attributes": {
                "access.token.signed.response.alg": "ES256",
                "id.token.signed.response.alg": "ES256",
                "access.token.lifespan": "300",
                "pkce.code.challenge.method": "S256",
                "dpop.bound.access.tokens": "required"
            }
        }'
    echo -e "${GREEN}Created public client $PUBLIC_CLIENT_ID.${NC}"
fi

# Create test user
echo -e "${YELLOW}Creating test user $TEST_USER...${NC}"
USER_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=$TEST_USER")
USER_EXISTS=$(echo $USER_RESPONSE | jq -r 'length')

if [ "$USER_EXISTS" != "0" ]; then
    echo -e "${YELLOW}User $TEST_USER already exists. Skipping creation.${NC}"
    USER_ID=$(echo $USER_RESPONSE | jq -r '.[0].id')
else
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "'$TEST_USER'",
            "email": "'$TEST_USER_EMAIL'",
            "firstName": "'$TEST_USER_FIRSTNAME'",
            "lastName": "'$TEST_USER_LASTNAME'",
            "enabled": true,
            "emailVerified": true,
            "credentials": [
                {
                    "type": "password",
                    "value": "'$TEST_USER_PASSWORD'",
                    "temporary": false
                }
            ]
        }'
    echo -e "${GREEN}Created test user $TEST_USER.${NC}"
    
    # Get the user ID
    USER_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=$TEST_USER")
    USER_ID=$(echo $USER_RESPONSE | jq -r '.[0].id')
fi

# Set password for test user
if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    echo -e "${YELLOW}Setting password for test user $TEST_USER...${NC}"
    curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$USER_ID/reset-password" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "type": "password",
            "value": "'$TEST_USER_PASSWORD'",
            "temporary": false
        }'
    echo -e "${GREEN}Set password for test user $TEST_USER.${NC}"
else
    echo -e "${RED}Could not find user ID for $TEST_USER${NC}"
fi

echo -e "${YELLOW}Note: You need to manually apply the FAPI-2 security profile in the Keycloak Admin Console:${NC}"
echo -e "${YELLOW}1. Go to Realm Settings > Client Policies${NC}"
echo -e "${YELLOW}2. Click on 'Create policy'${NC}"
echo -e "${YELLOW}3. Set name to 'fapi-2-security-policy', enable it, and add the 'any-client' condition${NC}"
echo -e "${YELLOW}4. Select the 'fapi-2-security-profile' profile${NC}"
echo -e "${YELLOW}5. Click 'Save'${NC}"

echo -e "${GREEN}FAPI 2.0 compliant realm and clients setup complete!${NC}"
echo -e "${YELLOW}Realm: $REALM_NAME${NC}"
echo -e "${YELLOW}Confidential Client ID (client credentials): $CONFIDENTIAL_CLIENT_ID${NC}"
echo -e "${YELLOW}Public Client ID (authorization code + PKCE): $PUBLIC_CLIENT_ID${NC}"
echo -e "${YELLOW}Test User: $TEST_USER${NC}"
echo -e "${YELLOW}Test User Password: $TEST_USER_PASSWORD${NC}"
echo -e "${YELLOW}JWKS URL: $KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/certs${NC}"
echo -e "${YELLOW}Token URL: $KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/token${NC}"
echo -e "${YELLOW}Authorization URL: $KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/auth${NC}"