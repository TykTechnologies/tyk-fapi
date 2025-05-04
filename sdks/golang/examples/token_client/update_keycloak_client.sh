#!/bin/bash

# This script updates the client configuration in Keycloak to use the JWKS URL

# Configuration
CLIENT_ID="my-tpp"
REALM_NAME="fapi-demo"
KEYCLOAK_URL="http://localhost:8081"
JWKS_URL="http://host.docker.internal:8082/.well-known/jwks.json"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

# Get admin token
echo "Getting admin token..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Got admin token"

# Get client ID
echo "Getting client ID..."
CLIENT_UUID=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CLIENT_ID" | jq -r '.[0].id')

if [ -z "$CLIENT_UUID" ] || [ "$CLIENT_UUID" == "null" ]; then
  echo "Failed to get client ID"
  exit 1
fi

echo "Got client ID: $CLIENT_UUID"

# Get current client configuration
echo "Getting current client configuration..."
CLIENT_CONFIG=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$CLIENT_UUID")

# Update client configuration
echo "Updating client configuration..."
# Add jwksUrl to the client configuration
CLIENT_CONFIG=$(echo "$CLIENT_CONFIG" | jq --arg jwksUrl "$JWKS_URL" '.attributes.jwksUrl = $jwksUrl')
# Set token endpoint auth signing algorithm to ES256
CLIENT_CONFIG=$(echo "$CLIENT_CONFIG" | jq '.attributes."token.endpoint.auth.signing.alg" = "ES256"')

# Update client
curl -s -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$CLIENT_UUID" \
  -d "$CLIENT_CONFIG"

echo "Client configuration updated"
echo "JWKS URL: $JWKS_URL"
echo "Token endpoint auth signing algorithm: ES256"