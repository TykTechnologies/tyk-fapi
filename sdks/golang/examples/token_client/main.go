package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/TykTechnologies/tyk-fapi/sdks/golang/pkg/client"
)

func main() {
	// Configuration
	clientID := "my-tpp"
	authServerURL := "http://localhost:8081"
	apiServerURL := "http://localhost:8080"
	jwksServerPort := 8082
	realmName := "fapi-demo"

	// Override configuration from environment variables if provided
	if envClientID := os.Getenv("CLIENT_ID"); envClientID != "" {
		clientID = envClientID
	}
	if envAuthServerURL := os.Getenv("AUTH_SERVER_URL"); envAuthServerURL != "" {
		authServerURL = envAuthServerURL
	}
	if envAPIServerURL := os.Getenv("API_SERVER_URL"); envAPIServerURL != "" {
		apiServerURL = envAPIServerURL
	}
	if envJWKSPort := os.Getenv("JWKS_SERVER_PORT"); envJWKSPort != "" {
		fmt.Sscanf(envJWKSPort, "%d", &jwksServerPort)
	}
	if envRealmName := os.Getenv("REALM_NAME"); envRealmName != "" {
		realmName = envRealmName
	}

	fmt.Println("FAPI 2.0 Token Client")
	fmt.Println("====================")
	fmt.Printf("Client ID: %s\n", clientID)
	fmt.Printf("Auth Server URL: %s\n", authServerURL)
	fmt.Printf("Realm: %s\n", realmName)
	fmt.Printf("JWKS Server Port: %d\n", jwksServerPort)
	fmt.Println()

	// Create a new FAPI client
	fmt.Println("Creating FAPI client...")
	fapiClient, err := client.NewClient(
		clientID,
		authServerURL,
		apiServerURL,
		client.WithJwksServerPort(jwksServerPort),
		client.WithRealmName(realmName),
	)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// The JWKS URL for Keycloak in Docker
	keycloakJwksURL := fmt.Sprintf("http://host.docker.internal:%d/.well-known/jwks.json", jwksServerPort)
	fmt.Printf("JWKS URL for Keycloak: %s\n", keycloakJwksURL)
	fmt.Printf("Key ID (kid): %s\n", fapiClient.Kid)
	fmt.Println()

	// Keep the JWKS server running
	fmt.Println("The JWKS server is running on port", jwksServerPort)
	fmt.Println("Press Ctrl+C to stop the server")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Try to get an access token periodically
	go func() {
		for {
			// Get an access token
			fmt.Println("\nRequesting access token...")
			token, err := fapiClient.TokenSource.Token()
			if err != nil {
				log.Printf("Failed to get access token: %v", err)
				log.Printf("Make sure the client is configured correctly in Keycloak")
				log.Printf("JWKS URL: %s", keycloakJwksURL)
				log.Printf("Waiting 10 seconds before trying again...")

				// Wait 10 seconds before trying again
				select {
				case <-sigChan:
					return
				case <-time.After(10 * time.Second):
					continue
				}
			}

			fmt.Println("Access token obtained successfully!")
			fmt.Println()

			// Parse the token to display some information
			claims, err := client.ParseToken(token.AccessToken)
			if err != nil {
				log.Printf("Failed to parse token: %v", err)
			} else {
				fmt.Println("Token Information:")
				fmt.Printf("  Subject: %v\n", claims["sub"])
				fmt.Printf("  Issuer: %v\n", claims["iss"])
				fmt.Printf("  Expiration: %v\n", claims["exp"])
				if cnf, ok := claims["cnf"].(map[string]interface{}); ok {
					fmt.Printf("  DPoP Confirmation (jkt): %v\n", cnf["jkt"])
				}
				fmt.Printf("  Scopes: %v\n", claims["scope"])
				fmt.Println()

				// Print the first part of the token
				fmt.Println("Access Token (first 50 characters):")
				if len(token.AccessToken) > 50 {
					fmt.Printf("  %s...\n", token.AccessToken[:50])
				} else {
					fmt.Printf("  %s\n", token.AccessToken)
				}
			}

			// Exit after successfully obtaining a token
			return
		}
	}()

	// Wait for interrupt signal
	<-sigChan

	// Clean up
	fmt.Println("Stopping JWKS server...")
	if err := fapiClient.StopJWKSServer(); err != nil {
		log.Printf("Warning: Failed to stop JWKS server: %v", err)
	}
	fmt.Println("JWKS server stopped")
}
