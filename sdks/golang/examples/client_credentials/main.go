package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/TykTechnologies/tyk-fapi/sdks/golang/pkg/client"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// Get configuration from environment variables
	clientID := getEnv("CLIENT_ID", "my-tpp")
	keycloakURL := getEnv("KEYCLOAK_URL", "http://localhost:8081")
	tykGatewayURL := getEnv("TYK_GATEWAY_URL", "http://localhost:8080")
	jwksServerPort := 8082

	// Create a new FAPI client
	fapiClient, err := client.NewClient(
		clientID,
		keycloakURL,
		tykGatewayURL,
		client.WithJwksServerPort(jwksServerPort),
		client.WithRealmName("fapi-demo"),
	)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	fmt.Printf("JWKS URL: %s\n", fapiClient.JwksURL)
	fmt.Println("FAPI 2.0 Client created successfully")
	fmt.Printf("Client ID: %s\n", fapiClient.ClientID)
	fmt.Printf("Key ID (kid): %s\n", fapiClient.Kid)
	fmt.Printf("JWK Thumbprint (jkt): %s\n", fapiClient.Jkt)

	// Export the public key to PEM file
	if err := fapiClient.ExportPublicKeyToPEM("public_key.pem"); err != nil {
		log.Fatalf("Failed to export public key: %v", err)
	}
	fmt.Println("Public key exported to public_key.pem")
	fmt.Println()

	// Get an access token
	fmt.Println("Getting access token...")
	token, err := fapiClient.TokenSource.Token()
	if err != nil {
		log.Fatalf("Failed to get access token: %v", err)
	}
	fmt.Println("Access token obtained successfully")

	// Parse the token to display some information
	claims, err := client.ParseToken(token.AccessToken)
	if err != nil {
		log.Fatalf("Failed to parse token: %v", err)
	}

	fmt.Println("Token claims:")
	// Log all claims in the token
	fmt.Println("All token claims:")
	for key, value := range claims {
		fmt.Printf("  %s: %v\n", key, value)
	}

	// Check specifically for audience claim
	if aud, ok := claims["aud"]; ok {
		fmt.Printf("  Audience claim found: %v (type: %T)\n", aud, aud)
	} else {
		fmt.Println("  WARNING: No audience (aud) claim found in the token!")
	}

	// Check for azp claim as an alternative
	if azp, ok := claims["azp"]; ok {
		fmt.Printf("  Authorized party (azp) claim found: %v (type: %T)\n", azp, azp)
	}

	// Make an API call to the payments endpoint
	fmt.Println("\nMaking API call to /payments/get...")

	// Get the HTTP client that automatically adds DPoP proofs
	httpClient := fapiClient.Client()

	// Make a GET request
	resp, err := httpClient.Get(tykGatewayURL + "/payments/anything")
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

	// Example of a POST request
	fmt.Println("\nMaking POST API call to /payments/create...")

	// Create a request body
	requestBody := strings.NewReader(`{"amount": 100, "currency": "USD"}`)

	// Make a POST request
	resp, err = httpClient.Post(tykGatewayURL+"/payments/anything", "application/json", requestBody)
	if err != nil {
		log.Fatalf("API call failed: %v", err)
	}
	defer resp.Body.Close()

	// Read the response
	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read API response: %v", err)
	}

	fmt.Printf("API Response: %s\n", string(body))

	// Clean up
	if err := fapiClient.StopJWKSServer(); err != nil {
		log.Printf("Warning: Failed to stop JWKS server: %v", err)
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
