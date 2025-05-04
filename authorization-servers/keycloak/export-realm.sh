#!/bin/bash
set -e

# Configuration
KEYCLOAK_URL="http://localhost:8081"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="fapi-demo"
OUTPUT_FILE="fapi-demo-realm.json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Exporting FAPI 2.0 compliant realm from Keycloak...${NC}"

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

# Export realm
echo -e "${YELLOW}Exporting realm $REALM_NAME...${NC}"
EXPORT_RESPONSE=$(curl -s "$KEYCLOAK_URL/admin/realms/$REALM_NAME/partial-export?exportClients=true&exportGroupsAndRoles=true" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}')

# Check if export was successful
if [[ $EXPORT_RESPONSE == *"error"* ]]; then
    echo -e "${RED}Failed to export realm: $EXPORT_RESPONSE${NC}"
    exit 1
fi

# Save the exported realm to a file
echo $EXPORT_RESPONSE | jq > $OUTPUT_FILE

echo -e "${GREEN}Successfully exported realm $REALM_NAME to $OUTPUT_FILE!${NC}"
echo -e "${YELLOW}You can now use this file to import the realm into another Keycloak instance.${NC}"