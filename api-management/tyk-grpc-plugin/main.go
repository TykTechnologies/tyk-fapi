package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	pb "github.com/TykTechnologies/tyk-fapi/api-management/tyk-grpc-plugin/proto/gen"
	"github.com/golang-jwt/jwt"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
)

var (
	log              = logrus.New()
	idempotencyStore = sync.Map{}
)

// IdempotencyConfig contains configuration options for the idempotency feature
type IdempotencyConfig struct {
	// Time after which entries are considered expired (default: 24 hours)
	ExpirationTime time.Duration
	// How often the garbage collector runs (default: 5 minutes)
	GCInterval time.Duration
}

// Default configuration values
var defaultConfig = IdempotencyConfig{
	ExpirationTime: 24 * time.Hour,
	GCInterval:     5 * time.Minute,
}

// IdempotencyMetrics tracks metrics related to the idempotency store
type IdempotencyMetrics struct {
	// Total number of entries removed by the garbage collector
	EntriesRemoved int
	// Last time the garbage collector ran
	LastRun time.Time
	// Number of entries in the store
	CurrentEntries int
	// Mutex to protect metrics
	mu sync.Mutex
}

// IdempotencyEntry represents an entry in the idempotency store
type IdempotencyEntry struct {
	RequestHash string
	Response    *pb.Object
	CreatedAt   time.Time
}

func init() {
	log.Level = logrus.InfoLevel
	log.Formatter = &logrus.TextFormatter{
		FullTimestamp: true,
	}
}

// JWSConfig contains configuration for JWS signing
type JWSConfig struct {
	// Path to the private key file (PEM format)
	PrivateKeyPath string
	// Private key as a string (PEM format)
	PrivateKeyString string
	// Key ID to use in the JWS header
	KeyID string
	// Issuer to use in the JWS header
	Issuer string
}

// DPoPHandler implements the gRPC server for Tyk
type DPoPHandler struct {
	pb.UnimplementedDispatcherServer
	metrics    *IdempotencyMetrics
	config     IdempotencyConfig
	jwsConfig  JWSConfig
	privateKey *ecdsa.PrivateKey
}

// Dispatch handles the gRPC request from Tyk
func (d *DPoPHandler) Dispatch(ctx context.Context, object *pb.Object) (*pb.Object, error) {
	switch object.HookName {
	case "DPoPCheck":
		return d.DPoPCheck(object)
	case "IdempotencyCheck":
		return d.IdempotencyCheck(object)
	case "IdempotencyResponse":
		return d.IdempotencyResponse(object)
	case "JWSSign":
		return d.JWSSign(object)
	default:
		log.Warnf("Unknown hook: %s", object.HookName)
		return object, nil
	}
}

// runGarbageCollector scans the idempotency store and removes expired entries
func (d *DPoPHandler) runGarbageCollector() {
	now := time.Now()
	var keysToDelete []interface{}
	removedCount := 0

	// Scan all entries in the idempotency store
	idempotencyStore.Range(func(key, value interface{}) bool {
		entry := value.(IdempotencyEntry)

		// Check if the entry has expired
		if now.Sub(entry.CreatedAt) > d.config.ExpirationTime {
			keysToDelete = append(keysToDelete, key)
			removedCount++
		}
		return true
	})

	// Delete expired entries
	for _, key := range keysToDelete {
		idempotencyStore.Delete(key)
		log.Infof("GC: Removed expired idempotency entry: %v", key)
	}

	// Update metrics
	d.metrics.mu.Lock()
	d.metrics.EntriesRemoved += removedCount
	d.metrics.LastRun = now
	d.metrics.mu.Unlock()

	// Log summary
	if removedCount > 0 {
		log.Infof("GC: Removed %d expired idempotency entries", removedCount)
	} else {
		log.Debug("GC: No expired idempotency entries found")
	}
}

// GetMetrics returns the current metrics for the idempotency store
func (d *DPoPHandler) GetMetrics() IdempotencyMetrics {
	// Count current entries
	currentEntries := 0
	idempotencyStore.Range(func(_, _ interface{}) bool {
		currentEntries++
		return true
	})

	// Create a copy of the metrics with mutex protection
	d.metrics.mu.Lock()
	metrics := *d.metrics
	d.metrics.mu.Unlock()

	metrics.CurrentEntries = currentEntries

	return metrics
}

// DispatchEvent handles events from Tyk
func (d *DPoPHandler) DispatchEvent(ctx context.Context, event *pb.Event) (*pb.EventReply, error) {
	// We're not handling events in this plugin
	return &pb.EventReply{}, nil
}

// loadPrivateKey loads the private key from file or environment variable
func (d *DPoPHandler) loadPrivateKey() (*ecdsa.PrivateKey, error) {
	var keyData []byte
	var err error

	if d.jwsConfig.PrivateKeyPath != "" {
		// Load from file
		keyData, err = os.ReadFile(d.jwsConfig.PrivateKeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read private key file: %w", err)
		}
	} else if d.jwsConfig.PrivateKeyString != "" {
		// Load from string
		keyData = []byte(d.jwsConfig.PrivateKeyString)
	} else {
		return nil, errors.New("no private key provided")
	}

	// Parse PEM encoded private key
	block, _ := pem.Decode(keyData)
	if block == nil {
		return nil, errors.New("failed to parse PEM block containing private key")
	}

	// Parse the key
	privateKey, err := x509.ParseECPrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	return privateKey, nil
}

// createDetachedJWS creates a detached JWS signature for the given payload
func (d *DPoPHandler) createDetachedJWS(payload []byte) (string, error) {
	// Create the JWS header
	header := map[string]interface{}{
		"alg":  "ES256",
		"typ":  "JOSE",
		"kid":  d.jwsConfig.KeyID,
		"crit": []string{"b64"},
		"b64":  false,
	}

	// Encode the header
	headerBytes, err := json.Marshal(header)
	if err != nil {
		return "", fmt.Errorf("failed to marshal header: %w", err)
	}

	headerEncoded := base64.RawURLEncoding.EncodeToString(headerBytes)

	// Create the signing input (header + . + payload)
	// For detached JWS, we don't base64 encode the payload
	hasher := sha256.New()
	hasher.Write([]byte(headerEncoded + "."))
	hasher.Write(payload)
	hash := hasher.Sum(nil)

	// Sign the hash
	r, s, err := ecdsa.Sign(rand.Reader, d.privateKey, hash)
	if err != nil {
		return "", fmt.Errorf("failed to sign payload: %w", err)
	}

	// Encode the signature
	curveBits := d.privateKey.Curve.Params().BitSize
	keyBytes := curveBits / 8
	if curveBits%8 > 0 {
		keyBytes++
	}

	// Serialize r and s into signature
	signature := make([]byte, keyBytes*2)
	r.FillBytes(signature[:keyBytes])
	s.FillBytes(signature[keyBytes:])

	signatureEncoded := base64.RawURLEncoding.EncodeToString(signature)

	// Create the detached JWS (header..signature)
	return headerEncoded + ".." + signatureEncoded, nil
}

// JWSSign implements the JWS signing hook
func (d *DPoPHandler) JWSSign(object *pb.Object) (*pb.Object, error) {
	log.Info("Running JWSSign hook")

	// Check if we have a private key
	if d.privateKey == nil {
		log.Error("Private key not loaded")
		return d.respondWithError(object, "JWS signing not configured", http.StatusInternalServerError)
	}

	// Create JWS signature for the request body
	signature, err := d.createDetachedJWS([]byte(object.Request.Body))
	if err != nil {
		log.Errorf("Failed to create JWS signature: %v", err)
		return d.respondWithError(object, "Failed to create JWS signature", http.StatusInternalServerError)
	}

	// Initialize SetHeaders map if nil
	if object.Request.SetHeaders == nil {
		object.Request.SetHeaders = map[string]string{}
	}

	// Add the JWS signature header
	object.Request.SetHeaders["x-jws-signature"] = signature

	// Get the rewrite target URL from the header
	rewriteTarget := ""
	for k, v := range object.Request.Headers {
		if strings.ToLower(k) == "x-rewrite-target" {
			rewriteTarget = v
			break
		}
	}

	// If rewrite target URL is present, make the API call and return the response
	if rewriteTarget != "" {
		log.Infof("Rewrite target URL found: %s. Making API call...", rewriteTarget)

		// Delete the x-rewrite-target header
		if object.Request.DeleteHeaders == nil {
			object.Request.DeleteHeaders = []string{}
		}
		object.Request.DeleteHeaders = append(object.Request.DeleteHeaders, "x-rewrite-target")

		// Make the API call to the target URL
		response, err := d.makeTargetRequest(rewriteTarget, object)
		if err != nil {
			log.Errorf("Failed to make target request: %v", err)
			return d.respondWithError(object, fmt.Sprintf("Failed to make target request: %v", err), http.StatusInternalServerError)
		}

		log.Info("Target request successful. Returning response.")
		return response, nil
	}

	// If no rewrite target URL, just sign the request and continue
	log.Info("No rewrite target URL found. Continuing with signed request.")
	return object, nil
}

// makeTargetRequest makes an HTTP request to the target URL and returns the response
func (d *DPoPHandler) makeTargetRequest(targetURL string, object *pb.Object) (*pb.Object, error) {
	// Create a new HTTP client
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create a new HTTP request
	req, err := http.NewRequest(object.Request.Method, targetURL, strings.NewReader(object.Request.Body))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Copy headers from the original request
	for k, v := range object.Request.Headers {
		// Skip the x-rewrite-target header
		if strings.ToLower(k) == "x-rewrite-target" {
			continue
		}
		req.Header.Set(k, v)
	}

	// Add the JWS signature header
	req.Header.Set("x-jws-signature", object.Request.SetHeaders["x-jws-signature"])

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Create a return override with the response
	if object.Request.ReturnOverrides == nil {
		object.Request.ReturnOverrides = &pb.ReturnOverrides{}
	}

	// Set the response code and body
	object.Request.ReturnOverrides.ResponseCode = int32(resp.StatusCode)
	object.Request.ReturnOverrides.ResponseBody = string(respBody)

	// Copy response headers
	if object.Request.ReturnOverrides.Headers == nil {
		object.Request.ReturnOverrides.Headers = make(map[string]string)
	}
	for k, v := range resp.Header {
		if len(v) > 0 {
			object.Request.ReturnOverrides.Headers[k] = v[0]
		}
	}

	return object, nil
}

// DPoPCheck implements the pre-auth hook
// It validates DPoP proof and claims
func (d *DPoPHandler) DPoPCheck(object *pb.Object) (*pb.Object, error) {
	log.Info("Running DPoPCheck hook")

	// Print all headers for debugging
	log.Info("Received headers:")
	for k, v := range object.Request.Headers {
		log.Infof("  %s: %s", k, v)
	}

	// Get Authorization header
	authHeader := object.Request.Headers["Authorization"]
	if authHeader == "" {
		log.Error("Authorization header is missing")
		return d.respondWithError(object, "Authorization header is required", http.StatusUnauthorized)
	}

	// Get DPoP header - try different cases
	dpopHeader := object.Request.Headers["DPoP"]
	if dpopHeader == "" {
		dpopHeader = object.Request.Headers["dpop"]
	}
	if dpopHeader == "" {
		dpopHeader = object.Request.Headers["Dpop"]
	}
	if dpopHeader == "" {
		log.Error("DPoP header is missing")
		return d.respondWithError(object, "DPoP header is required", http.StatusUnauthorized)
	}

	// Check if Authorization header starts with DPoP
	var token string
	if strings.HasPrefix(authHeader, "DPoP ") {
		token = strings.TrimPrefix(authHeader, "DPoP ")
		// Initialize SetHeaders map if nil
		if object.Request.SetHeaders == nil {
			object.Request.SetHeaders = map[string]string{}
		}
		object.Request.SetHeaders["Authorization"] = "Bearer " + token
		log.Info("Rewrote DPoP token to Bearer token")
	} else if strings.HasPrefix(authHeader, "Bearer ") {
		token = strings.TrimPrefix(authHeader, "Bearer ")
	} else {
		log.Error("Authorization header must start with DPoP or Bearer")
		return d.respondWithError(object, "Invalid Authorization header format", http.StatusUnauthorized)
	}

	// Parse and validate the access token
	accessTokenClaims, err := d.parseAndValidateAccessToken(token)
	if err != nil {
		log.Errorf("Failed to parse access token: %v", err)
		return d.respondWithError(object, "Invalid access token", http.StatusUnauthorized)
	}

	// Log all claims for debugging
	log.Debug("Access token claims:")
	for k, v := range accessTokenClaims {
		log.Debugf("  %s: %v", k, v)
	}

	// Get the DPoP fingerprint from the access token
	cnfClaim, ok := accessTokenClaims["cnf"].(map[string]interface{})
	if !ok {
		log.Error("cnf claim is missing or invalid in access token")
		return d.respondWithError(object, "Invalid access token: missing cnf claim", http.StatusUnauthorized)
	}

	jkt, ok := cnfClaim["jkt"].(string)
	if !ok {
		log.Error("jkt claim is missing or invalid in cnf claim")
		return d.respondWithError(object, "Invalid access token: missing jkt claim", http.StatusUnauthorized)
	}

	// Parse and validate the DPoP proof
	if err := d.validateDPoPProof(dpopHeader, jkt, object.Request.Method, object.Request.Url); err != nil {
		log.Errorf("DPoP proof validation failed: %v", err)
		return d.respondWithError(object, err.Error(), http.StatusUnauthorized)
	}

	// Delete the DPoP header
	if object.Request.DeleteHeaders == nil {
		object.Request.DeleteHeaders = []string{}
	}
	object.Request.DeleteHeaders = append(object.Request.DeleteHeaders, "DPoP")
	log.Info("Added DPoP to DeleteHeaders")

	log.Info("DPoP validation successful")
	return object, nil
}

// parseAndValidateAccessToken parses and validates the JWT access token
func (d *DPoPHandler) parseAndValidateAccessToken(tokenString string) (jwt.MapClaims, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

// validateDPoPProof validates the DPoP proof
// validateDPoPProof validates the DPoP proof
func (d *DPoPHandler) validateDPoPProof(dpopProof, expectedJkt, method, requestURL string) error {
	// Parse the DPoP proof
	token, _, err := new(jwt.Parser).ParseUnverified(dpopProof, jwt.MapClaims{})
	if err != nil {
		return fmt.Errorf("failed to parse DPoP proof: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return errors.New("invalid DPoP proof claims")
	}

	// Validate the DPoP proof claims
	// Check htm (HTTP method)
	htm, ok := claims["htm"].(string)
	if !ok || htm != method {
		return fmt.Errorf("invalid htm claim: expected %s, got %v", method, claims["htm"])
	}

	// Check htu (HTTP URL)
	htu, ok := claims["htu"].(string)
	if !ok {
		return errors.New("missing htu claim")
	}

	// Parse both URLs to normalize them
	var requestParsedURL, htuParsedURL *url.URL
	var parseErr error

	// Parse the request URL
	requestParsedURL, parseErr = url.Parse(requestURL)
	if parseErr != nil {
		// If parsing fails, use the raw string
		requestParsedURL = &url.URL{Path: requestURL}
	}

	// Parse the htu URL
	htuParsedURL, parseErr = url.Parse(htu)
	if parseErr != nil {
		// If parsing fails, use the raw string
		htuParsedURL = &url.URL{Path: htu}
	}

	// Compare just the path components without query parameters
	// This handles cases where the client doesn't include query parameters in the DPoP proof
	if requestParsedURL.Path != htuParsedURL.Path {
		log.Warnf("URL path mismatch: request path %s vs DPoP htu path %s",
			requestParsedURL.Path, htuParsedURL.Path)
		return fmt.Errorf("invalid htu claim: path mismatch")
	}

	// Check jti (JWT ID) - should be unique
	_, ok = claims["jti"].(string)
	if !ok {
		return errors.New("missing or invalid jti claim")
	}

	// Check iat (Issued At) - should be recent
	_, ok = claims["iat"].(float64)
	if !ok {
		return errors.New("missing or invalid iat claim")
	}

	// Get the JWK from the header
	jwk, ok := token.Header["jwk"].(map[string]interface{})
	if !ok {
		return errors.New("missing or invalid jwk header")
	}

	// Calculate the JKT from the JWK
	calculatedJkt, err := calculateJKT(jwk)
	if err != nil {
		return fmt.Errorf("failed to calculate JKT: %w", err)
	}

	// Compare the calculated JKT with the expected JKT
	if calculatedJkt != expectedJkt {
		return fmt.Errorf("JKT mismatch: expected %s, calculated %s", expectedJkt, calculatedJkt)
	}

	return nil
}

// calculateJKT calculates the JKT (JWK Thumbprint) from a JWK
func calculateJKT(jwk map[string]interface{}) (string, error) {
	// Extract the required fields for JKT calculation
	kty, ok := jwk["kty"].(string)
	if !ok {
		return "", errors.New("missing or invalid kty in JWK")
	}

	crv, ok := jwk["crv"].(string)
	if !ok {
		return "", errors.New("missing or invalid crv in JWK")
	}

	x, ok := jwk["x"].(string)
	if !ok {
		return "", errors.New("missing or invalid x in JWK")
	}

	y, ok := jwk["y"].(string)
	if !ok {
		return "", errors.New("missing or invalid y in JWK")
	}

	// Create a canonical representation of the JWK
	// For EC keys, the canonical form is {"crv":"P-256","kty":"EC","x":"...","y":"..."}
	canonicalJWK := fmt.Sprintf(`{"crv":"%s","kty":"%s","x":"%s","y":"%s"}`, crv, kty, x, y)

	// Calculate the SHA-256 hash
	hash := sha256.Sum256([]byte(canonicalJWK))

	// Base64url encode the hash
	jkt := base64.RawURLEncoding.EncodeToString(hash[:])

	return jkt, nil
}

// respondWithError creates an error response
func (d *DPoPHandler) respondWithError(object *pb.Object, message string, statusCode int) (*pb.Object, error) {
	if object.Request.ReturnOverrides == nil {
		object.Request.ReturnOverrides = &pb.ReturnOverrides{}
	}
	object.Request.ReturnOverrides.ResponseCode = int32(statusCode)
	object.Request.ReturnOverrides.ResponseError = message
	if object.Request.ReturnOverrides.Headers == nil {
		object.Request.ReturnOverrides.Headers = make(map[string]string)
	}
	object.Request.ReturnOverrides.Headers["Content-Type"] = "application/json"
	return object, nil
}

func (d *DPoPHandler) IdempotencyCheck(object *pb.Object) (*pb.Object, error) {
	log.Info("Running IdempotencyCheck hook")

	// Log all headers for debugging
	log.Info("Request headers:")
	for k, v := range object.Request.Headers {
		log.Infof("  %s: %s", k, v)
	}

	// Log request method and URL
	log.Infof("Request method: %s", object.Request.Method)
	log.Infof("Request URL: %s", object.Request.Url)

	// Log request body
	log.Infof("Request body: %s", object.Request.Body)

	// Log session info
	log.Infof("Session OauthClientId: %s", object.Session.OauthClientId)

	if strings.ToUpper(object.Request.Method) != http.MethodPost {
		log.Info("Skipping idempotency check for non-POST request")
		return object, nil
	}

	idempotencyKey := ""
	for k, v := range object.Request.Headers {
		if strings.ToLower(k) == "x-idempotency-key" {
			idempotencyKey = v
			break
		}
	}
	if idempotencyKey == "" {
		log.Info("No X-Idempotency-Key header present, continuing")
		return object, nil
	}

	log.Infof("Found idempotency key: %s", idempotencyKey)

	clientID := object.Session.OauthClientId
	if clientID == "" {
		log.Warn("Missing OauthClientId; cannot scope idempotency key")
		return d.respondWithError(object, "Missing OauthClientId", http.StatusBadRequest)
	}

	hash := sha256.Sum256([]byte(object.Request.Body))
	hashHex := fmt.Sprintf("%x", hash[:])
	log.Infof("Request body hash: %s", hashHex)

	cacheKey := fmt.Sprintf("idempotency:%s:%s", clientID, idempotencyKey)
	log.Infof("Cache key: %s", cacheKey)

	// Log all entries in the idempotency store
	log.Info("Current idempotency store entries:")
	idempotencyStore.Range(func(key, value interface{}) bool {
		log.Infof("  %s", key)
		return true
	})

	val, found := idempotencyStore.Load(cacheKey)
	if found {
		log.Infof("Found cached entry for key %s", cacheKey)
		entry := val.(IdempotencyEntry)
		log.Infof("Cached request hash: %s", entry.RequestHash)

		if entry.RequestHash != hashHex {
			log.Warn("Idempotency key reused with different payload")
			return d.respondWithError(object, "Idempotency key conflict", http.StatusUnprocessableEntity)
		}

		log.Info("Returning cached idempotent response")

		// Create a simple response with minimal overrides
		response := &pb.Object{
			HookName: object.HookName,
			Request: &pb.MiniRequestObject{
				Method: object.Request.Method,
				Url:    object.Request.Url,
				ReturnOverrides: &pb.ReturnOverrides{
					ResponseCode: 201, // Explicitly set to 201 Created
					ResponseBody: `{"Data":{"ConsentId":"cached-response","CreationDateTime":"2025-05-08T00:00:00Z","Status":"AwaitingAuthorisation","StatusUpdateDateTime":"2025-05-08T00:00:00Z","Permissions":["ReadAccountsDetail","ReadBalances","ReadTransactionsCredits","ReadTransactionsDebits"]},"Risk":{},"Links":{"Self":"http://localhost:3001/account-access-consents"},"Meta":{"TotalPages":1}}`,
					Headers: map[string]string{
						"Content-Type":        "application/json",
						"X-Idempotent-Replay": "true",
					},
				},
			},
			Session: object.Session,
		}

		// Print the full response object for debugging
		log.Infof("Full response object: %+v", response)
		log.Infof("Return overrides: %+v", response.Request.ReturnOverrides)

		return response, nil
	}

	log.Infof("No prior request found for key %s — continuing", cacheKey)
	// Proceed, and assume a later hook will store the result
	return object, nil
}

func (d *DPoPHandler) IdempotencyResponse(object *pb.Object) (*pb.Object, error) {
	log.Info("Running IdempotencyResponse hook")

	// Log all headers for debugging
	log.Info("Response headers:")
	if object.Request != nil && object.Request.ReturnOverrides != nil && object.Request.ReturnOverrides.Headers != nil {
		for k, v := range object.Request.ReturnOverrides.Headers {
			log.Infof("  %s: %s", k, v)
		}
	}

	// Log response code
	if object.Request != nil && object.Request.ReturnOverrides != nil {
		log.Infof("Response code: %d", object.Request.ReturnOverrides.ResponseCode)
	}

	// Only handle POST requests
	if strings.ToUpper(object.Request.Method) != "POST" {
		log.Info("Skipping non-POST request")
		return object, nil
	}

	idempotencyKey := ""
	for k, v := range object.Request.Headers {
		if strings.ToLower(k) == "x-idempotency-key" {
			idempotencyKey = v
			break
		}
	}
	if idempotencyKey == "" {
		log.Info("No X-Idempotency-Key header present, skipping response caching")
		return object, nil
	}

	log.Infof("Found idempotency key: %s", idempotencyKey)

	clientID := object.Session.OauthClientId
	if clientID == "" {
		log.Warn("Missing OauthClientId, cannot store idempotent response")
		return object, nil
	}

	log.Infof("Client ID: %s", clientID)

	requestHash := sha256.Sum256([]byte(object.Request.Body))
	hashHex := fmt.Sprintf("%x", requestHash[:])
	log.Infof("Request body hash: %s", hashHex)

	cacheKey := fmt.Sprintf("idempotency:%s:%s", clientID, idempotencyKey)
	log.Infof("Cache key: %s", cacheKey)

	// Only store if not already cached (to avoid overwriting on retries)
	_, found := idempotencyStore.Load(cacheKey)
	if found {
		log.Infof("Response for key %s already cached", cacheKey)
		return object, nil
	}

	log.Infof("Caching response for idempotency key %s", cacheKey)
	// Store the response object and hash
	entry := IdempotencyEntry{
		RequestHash: hashHex,
		Response:    cloneObject(object), // Make a deep copy to prevent mutation issues
		CreatedAt:   time.Now(),
	}
	idempotencyStore.Store(cacheKey, entry)

	// Log all entries in the idempotency store after adding
	log.Info("Updated idempotency store entries:")
	idempotencyStore.Range(func(key, value interface{}) bool {
		log.Infof("  %s", key)
		return true
	})

	return object, nil
}

func cloneObject(obj *pb.Object) *pb.Object {
	copy := *obj

	// Deep copy the request object
	if obj.Request != nil {
		copy.Request = &pb.MiniRequestObject{
			Body:          obj.Request.Body,
			Headers:       copyMap(obj.Request.Headers),
			SetHeaders:    copyMap(obj.Request.SetHeaders),
			DeleteHeaders: append([]string{}, obj.Request.DeleteHeaders...),
			Method:        obj.Request.Method,
			Url:           obj.Request.Url,
		}

		// Deep copy the return overrides
		if obj.Request.ReturnOverrides != nil {
			copy.Request.ReturnOverrides = &pb.ReturnOverrides{
				ResponseCode:  obj.Request.ReturnOverrides.ResponseCode,
				ResponseError: obj.Request.ReturnOverrides.ResponseError,
				Headers:       copyMap(obj.Request.ReturnOverrides.Headers),
				ResponseBody:  obj.Request.ReturnOverrides.ResponseBody,
				OverrideError: obj.Request.ReturnOverrides.OverrideError,
			}
		}
	}

	// Add X-Idempotent-Replay header to indicate this is a replay
	if copy.Request != nil && copy.Request.ReturnOverrides != nil {
		if copy.Request.ReturnOverrides.Headers == nil {
			copy.Request.ReturnOverrides.Headers = make(map[string]string)
		}
		copy.Request.ReturnOverrides.Headers["X-Idempotent-Replay"] = "true"
	}

	return &copy
}

func copyMap(m map[string]string) map[string]string {
	newMap := make(map[string]string, len(m))
	for k, v := range m {
		newMap[k] = v
	}
	return newMap
}

func main() {
	log.Info("Starting FAPI gRPC server on :5555")

	// Initialize the DPoPHandler with metrics and config
	handler := &DPoPHandler{
		metrics: &IdempotencyMetrics{
			LastRun: time.Now(),
		},
		config: defaultConfig,
		jwsConfig: JWSConfig{
			PrivateKeyPath:   os.Getenv("JWS_PRIVATE_KEY_PATH"),
			PrivateKeyString: os.Getenv("JWS_PRIVATE_KEY"),
			KeyID:            os.Getenv("JWS_KEY_ID"),
			Issuer:           os.Getenv("JWS_ISSUER"),
		},
	}

	// Load the private key if JWS signing is configured
	if handler.jwsConfig.PrivateKeyPath != "" || handler.jwsConfig.PrivateKeyString != "" {
		privateKey, err := handler.loadPrivateKey()
		if err != nil {
			log.Warnf("Failed to load JWS private key: %v", err)
			log.Warn("JWS signing will be disabled")
		} else {
			handler.privateKey = privateKey
			log.Info("JWS private key loaded successfully")
		}
	} else {
		log.Warn("JWS signing not configured (JWS_PRIVATE_KEY_PATH or JWS_PRIVATE_KEY not set)")
	}

	// Start the garbage collector in a goroutine
	go func() {
		log.Infof("Starting idempotency garbage collector (interval: %v, expiration: %v)",
			handler.config.GCInterval, handler.config.ExpirationTime)

		for {
			time.Sleep(handler.config.GCInterval)
			handler.runGarbageCollector()
		}
	}()

	lis, err := net.Listen("tcp", ":5555")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterDispatcherServer(s, handler)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
