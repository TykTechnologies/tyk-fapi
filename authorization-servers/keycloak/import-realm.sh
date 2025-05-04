#!/bin/bash
set -e

# Configuration
KEYCLOAK_URL="http://localhost:8081"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
REALM_FILE="fapi-demo-realm.json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Importing FAPI 2.0 compliant realm into Keycloak...${NC}"

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
echo -e "${YELLOW}Checking if realm already exists...${NC}"
REALM_NAME=$(jq -r '.realm' $REALM_FILE)
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$KEYCLOAK_URL/admin/realms/$REALM_NAME")

if [ "$REALM_EXISTS" == "200" ]; then
    echo -e "${YELLOW}Realm $REALM_NAME already exists. Deleting it first...${NC}"
    curl -s -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" "$KEYCLOAK_URL/admin/realms/$REALM_NAME"
    echo -e "${GREEN}Deleted existing realm $REALM_NAME.${NC}"
    sleep 5
fi

# Import realm
echo -e "${YELLOW}Importing realm from $REALM_FILE...${NC}"
IMPORT_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d @$REALM_FILE)

if [ ! -z "$IMPORT_RESPONSE" ]; then
    echo -e "${RED}Failed to import realm: $IMPORT_RESPONSE${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully imported realm $REALM_NAME!${NC}"
echo -e "${YELLOW}You can now access the Keycloak Admin Console at $KEYCLOAK_URL/admin/${NC}"
echo -e "${YELLOW}Username: $ADMIN_USERNAME${NC}"
echo -e "${YELLOW}Password: $ADMIN_PASSWORD${NC}"
echo -e "${YELLOW}JWKS URL: $KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/certs${NC}"
echo -e "${YELLOW}Token URL: $KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/token${NC}"
echo -e "${YELLOW}Authorization URL: $KEYCLOAK_URL/realms/$REALM_NAME/protocol/openid-connect/auth${NC}"