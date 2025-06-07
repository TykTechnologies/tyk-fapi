package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	pb "github.com/TykTechnologies/tyk-fapi/plugins/tyk-grpc-plugin/proto/gen"
)

// generateTestKey generates a test ECDSA key for testing
func generateTestKey(t *testing.T) (*ecdsa.PrivateKey, string) {
	// Generate a new ECDSA key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("Failed to generate ECDSA key: %v", err)
	}

	// Encode the private key to PEM
	keyBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		t.Fatalf("Failed to marshal private key: %v", err)
	}

	keyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: keyBytes,
	})

	return privateKey, string(keyPEM)
}

// TestCreateDetachedJWS tests the createDetachedJWS function
func TestCreateDetachedJWS(t *testing.T) {
	// Generate a test key
	_, keyPEM := generateTestKey(t)

	// Create a temporary file with the key
	tmpfile, err := os.CreateTemp("", "test-key-*.pem")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	defer os.Remove(tmpfile.Name())

	if _, err := tmpfile.Write([]byte(keyPEM)); err != nil {
		t.Fatalf("Failed to write to temp file: %v", err)
	}
	if err := tmpfile.Close(); err != nil {
		t.Fatalf("Failed to close temp file: %v", err)
	}

	// Set up the handler with the test key
	handler := &DPoPHandler{
		jwsConfig: JWSConfig{
			PrivateKeyPath: tmpfile.Name(),
			KeyID:          "test-key-id",
			Issuer:         "test-issuer",
		},
	}

	// Load the private key
	privateKey, err := handler.loadPrivateKey()
	if err != nil {
		t.Fatalf("Failed to load private key: %v", err)
	}
	handler.privateKey = privateKey

	// Test payload
	payload := []byte(`{"test":"payload"}`)

	// Create a detached JWS signature
	signature, err := handler.createDetachedJWS(payload)
	if err != nil {
		t.Fatalf("createDetachedJWS returned an error: %v", err)
	}

	// Check that the signature is not empty
	if signature == "" {
		t.Fatal("createDetachedJWS returned an empty signature")
	}

	// Check that the signature has the correct format (header..signature)
	parts := strings.Split(signature, ".")
	if len(parts) != 3 || parts[1] != "" {
		t.Fatalf("createDetachedJWS returned an invalid signature format: %s", signature)
	}

	// Decode the header
	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		t.Fatalf("Failed to decode header: %v", err)
	}

	// Parse the header
	var header map[string]interface{}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		t.Fatalf("Failed to parse header: %v", err)
	}

	// Check header fields
	if header["alg"] != "ES256" {
		t.Errorf("Expected alg to be ES256, got %v", header["alg"])
	}
	if header["typ"] != "JOSE" {
		t.Errorf("Expected typ to be JOSE, got %v", header["typ"])
	}
	if header["kid"] != "test-key-id" {
		t.Errorf("Expected kid to be test-key-id, got %v", header["kid"])
	}
	if header["b64"] != false {
		t.Errorf("Expected b64 to be false, got %v", header["b64"])
	}
}

// TestJWSSignWithRewriteTarget tests the JWSSign function with x-rewrite-target header
func TestJWSSignWithRewriteTarget(t *testing.T) {
	// Create a test server to simulate the target endpoint
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check that the JWS signature header is present
		if r.Header.Get("x-jws-signature") == "" {
			t.Error("x-jws-signature header is missing in the forwarded request")
		}

		// Return a test response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"success"}`))
	}))
	defer testServer.Close()

	// Generate a test key
	_, keyPEM := generateTestKey(t)

	// Set up the handler with the test key
	handler := &DPoPHandler{
		jwsConfig: JWSConfig{
			PrivateKeyString: keyPEM,
			KeyID:            "test-key-id",
			Issuer:           "test-issuer",
		},
	}

	// Load the private key
	privateKey, err := handler.loadPrivateKey()
	if err != nil {
		t.Fatalf("Failed to load private key: %v", err)
	}
	handler.privateKey = privateKey

	// Create a test request object with x-rewrite-target header
	object := &pb.Object{
		HookName: "JWSSign",
		Request: &pb.MiniRequestObject{
			Headers: map[string]string{
				"x-rewrite-target": testServer.URL,
				"Content-Type":     "application/json",
			},
			Body:   `{"test":"payload"}`,
			Method: "POST",
			Url:    "https://original-url.com",
		},
	}

	// Call the JWSSign function
	result, err := handler.JWSSign(object)
	if err != nil {
		t.Fatalf("JWSSign returned an error: %v", err)
	}

	// Check that the result is not nil
	if result == nil {
		t.Fatal("JWSSign returned nil")
	}

	// Check that the x-jws-signature header was added
	if result.Request.SetHeaders["x-jws-signature"] == "" {
		t.Error("JWSSign did not add the x-jws-signature header")
	}

	// Check that the x-rewrite-target header was deleted
	found := false
	for _, header := range result.Request.DeleteHeaders {
		if header == "x-rewrite-target" {
			found = true
			break
		}
	}
	if !found {
		t.Error("JWSSign did not delete the x-rewrite-target header")
	}

	// Check that the return overrides were set
	if result.Request.ReturnOverrides == nil {
		t.Error("JWSSign did not set return overrides")
	} else {
		// Check the response code
		if result.Request.ReturnOverrides.ResponseCode != http.StatusOK {
			t.Errorf("Expected response code %d, got %d", http.StatusOK, result.Request.ReturnOverrides.ResponseCode)
		}

		// Check the response body
		if result.Request.ReturnOverrides.ResponseBody != `{"status":"success"}` {
			t.Errorf("Expected response body %s, got %s", `{"status":"success"}`, result.Request.ReturnOverrides.ResponseBody)
		}
	}
}

// TestJWSSignWithoutRewriteTarget tests the JWSSign function without x-rewrite-target header
func TestJWSSignWithoutRewriteTarget(t *testing.T) {
	// Generate a test key
	_, keyPEM := generateTestKey(t)

	// Set up the handler with the test key
	handler := &DPoPHandler{
		jwsConfig: JWSConfig{
			PrivateKeyString: keyPEM,
			KeyID:            "test-key-id",
			Issuer:           "test-issuer",
		},
	}

	// Load the private key
	privateKey, err := handler.loadPrivateKey()
	if err != nil {
		t.Fatalf("Failed to load private key: %v", err)
	}
	handler.privateKey = privateKey

	// Create a test request object without x-rewrite-target header
	object := &pb.Object{
		HookName: "JWSSign",
		Request: &pb.MiniRequestObject{
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body:   `{"test":"payload"}`,
			Method: "POST",
			Url:    "https://original-url.com",
		},
	}

	// Call the JWSSign function
	result, err := handler.JWSSign(object)
	if err != nil {
		t.Fatalf("JWSSign returned an error: %v", err)
	}

	// Check that the result is not nil
	if result == nil {
		t.Fatal("JWSSign returned nil")
	}

	// Check that the x-jws-signature header was added
	if result.Request.SetHeaders["x-jws-signature"] == "" {
		t.Error("JWSSign did not add the x-jws-signature header")
	}

	// Check that the URL was not changed
	if result.Request.Url != "https://original-url.com" {
		t.Errorf("JWSSign changed the URL when it shouldn't have: %s", result.Request.Url)
	}

	// Check that no return overrides were set
	if result.Request.ReturnOverrides != nil && result.Request.ReturnOverrides.ResponseCode != 0 {
		t.Error("JWSSign set return overrides when it shouldn't have")
	}
}
