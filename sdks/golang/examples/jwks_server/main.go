package main

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/TykTechnologies/tyk-fapi/sdks/golang/pkg/client"
)

// JWK represents a JSON Web Key
type JWK struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
	Use string `json:"use"`
}

// JWKS represents a JSON Web Key Set
type JWKS struct {
	Keys []JWK `json:"keys"`
}

// generateKid creates a deterministic key ID from X and Y coordinates
func generateKid(x, y *big.Int) string {
	combined := append(x.Bytes(), y.Bytes()...)
	return base64.RawURLEncoding.EncodeToString(combined)[:16]
}

// createJWK creates a JWK from a public key
func createJWK(publicKey *ecdsa.PublicKey, kid string) JWK {
	x := base64.RawURLEncoding.EncodeToString(publicKey.X.Bytes())
	y := base64.RawURLEncoding.EncodeToString(publicKey.Y.Bytes())

	return JWK{
		Kty: "EC",
		Crv: "P-256",
		X:   x,
		Y:   y,
		Kid: kid,
		Alg: "ES256",
		Use: "sig",
	}
}

func main() {
	fmt.Println("Starting standalone JWKS server...")

	// Load or generate key
	privateKey, err := client.LoadOrGenerateKey("private_key.pem")
	if err != nil {
		log.Fatalf("Failed to load or generate key: %v", err)
	}

	// Generate a key ID
	kid := generateKid(privateKey.PublicKey.X, privateKey.PublicKey.Y)

	// Create a JWK from the public key
	jwk := createJWK(&privateKey.PublicKey, kid)

	// Create a JWKS
	jwks := JWKS{
		Keys: []JWK{jwk},
	}

	// Start the server
	port := 8082
	if envPort := os.Getenv("JWKS_SERVER_PORT"); envPort != "" {
		fmt.Sscanf(envPort, "%d", &port)
	}

	// Create a new server
	mux := http.NewServeMux()
	mux.HandleFunc("/.well-known/jwks.json", func(w http.ResponseWriter, r *http.Request) {
		// Set the content type
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Log the request
		log.Printf("JWKS request from %s", r.RemoteAddr)

		// Write the response
		if err := json.NewEncoder(w).Encode(jwks); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}

	// Start the server in a goroutine
	go func() {
		log.Printf("Starting JWKS server on port %d", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("JWKS server error: %v", err)
		}
	}()

	fmt.Printf("JWKS URL: http://localhost:%d/.well-known/jwks.json\n", port)
	fmt.Printf("For Keycloak, use: http://host.docker.internal:%d/.well-known/jwks.json\n", port)
	fmt.Println("Press Ctrl+C to stop the server")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down JWKS server...")
	if err := server.Close(); err != nil {
		log.Printf("Error shutting down JWKS server: %v", err)
	}
}
