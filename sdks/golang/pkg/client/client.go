package client

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

// JWKS represents a JSON Web Key Set
type JWKS struct {
	Keys []JWK `json:"keys"`
}

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

// Client represents a FAPI 2.0 client with DPoP capabilities
type Client struct {
	ClientID       string
	ClientSecret   string
	AuthServerURL  string
	APIServerURL   string
	PrivateKey     *ecdsa.PrivateKey
	PublicKey      *ecdsa.PublicKey
	Kid            string
	Jkt            string
	HttpClient     *http.Client
	JwksServer     *http.Server
	JwksServerPort int
	JwksURL        string
	RealmName      string
	TokenSource    oauth2.TokenSource
	mu             sync.Mutex
}

// ClientOption is a function that configures a Client
type ClientOption func(*Client)

// WithClientSecret sets the client secret
func WithClientSecret(secret string) ClientOption {
	return func(c *Client) {
		c.ClientSecret = secret
	}
}

// WithPrivateKeyFile sets the private key from a file
func WithPrivateKeyFile(keyFile string) ClientOption {
	return func(c *Client) {
		privateKey, err := LoadPrivateKeyFromFile(keyFile)
		if err != nil {
			log.Printf("Warning: Failed to load private key from file: %v", err)
			return
		}
		c.PrivateKey = privateKey
		c.PublicKey = &privateKey.PublicKey
		c.Kid = generateKid(privateKey.PublicKey.X, privateKey.PublicKey.Y)
		jkt, err := computeJKT(&privateKey.PublicKey)
		if err != nil {
			log.Printf("Warning: Failed to compute JKT: %v", err)
			return
		}
		c.Jkt = jkt
	}
}

// WithJwksServerPort sets the JWKS server port
func WithJwksServerPort(port int) ClientOption {
	return func(c *Client) {
		c.JwksServerPort = port
	}
}

// WithRealmName sets the realm name
func WithRealmName(realmName string) ClientOption {
	return func(c *Client) {
		c.RealmName = realmName
	}
}

// WithHttpClient sets the HTTP client
func WithHttpClient(httpClient *http.Client) ClientOption {
	return func(c *Client) {
		c.HttpClient = httpClient
	}
}

// LoadPrivateKeyFromFile loads a private key from a file
func LoadPrivateKeyFromFile(keyFile string) (*ecdsa.PrivateKey, error) {
	keyData, err := os.ReadFile(keyFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read key file: %w", err)
	}

	// Parse the PEM block
	block, _ := pem.Decode(keyData)
	if block == nil || block.Type != "EC PRIVATE KEY" {
		return nil, fmt.Errorf("failed to decode PEM block containing EC private key")
	}

	// Parse the EC private key
	privateKey, err := x509.ParseECPrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse EC private key: %w", err)
	}

	return privateKey, nil
}

// LoadOrGenerateKey loads a key from a file or generates a new one if the file doesn't exist
func LoadOrGenerateKey(keyFile string) (*ecdsa.PrivateKey, error) {
	// Check if the key file exists
	_, err := os.Stat(keyFile)
	if err == nil {
		fmt.Println("Loading existing key from", keyFile)
		// Key file exists, load it
		return LoadPrivateKeyFromFile(keyFile)
	}

	fmt.Println("Generating new key and saving to", keyFile)
	// Key file doesn't exist, generate a new key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	// Save the key to file
	keyBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal private key: %w", err)
	}

	// Create PEM block
	pemBlock := &pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: keyBytes,
	}

	// Write to file
	keyPEM := pem.EncodeToMemory(pemBlock)
	if err := os.WriteFile(keyFile, keyPEM, 0600); err != nil {
		return nil, fmt.Errorf("failed to write key to file: %w", err)
	}

	return privateKey, nil
}

// StartJWKSServer starts a server to serve the JWKS endpoint
func (c *Client) StartJWKSServer(port int) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.JwksServer != nil {
		return fmt.Errorf("JWKS server already running")
	}

	// Create a new server
	mux := http.NewServeMux()
	mux.HandleFunc("/.well-known/jwks.json", c.handleJWKS)

	c.JwksServer = &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}

	// Set the JWKS URL for local access
	c.JwksURL = fmt.Sprintf("http://localhost:%d/.well-known/jwks.json", port)

	// Start the server in a goroutine
	go func() {
		log.Printf("Starting JWKS server on port %d", port)
		if err := c.JwksServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("JWKS server error: %v", err)
		}
	}()

	// Wait a moment for the server to start
	time.Sleep(100 * time.Millisecond)

	// Log the JWKS URLs
	log.Printf("JWKS server started. Local URL: %s", c.JwksURL)
	log.Printf("For Keycloak in Docker, use: http://host.docker.internal:%d/.well-known/jwks.json", port)

	return nil
}

// StopJWKSServer stops the JWKS server
func (c *Client) StopJWKSServer() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.JwksServer == nil {
		return nil
	}

	// Stop the server
	if err := c.JwksServer.Close(); err != nil {
		return fmt.Errorf("failed to stop JWKS server: %w", err)
	}

	c.JwksServer = nil
	return nil
}

// handleJWKS handles requests to the JWKS endpoint
func (c *Client) handleJWKS(w http.ResponseWriter, r *http.Request) {
	// Set the content type and CORS headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Log the request
	log.Printf("JWKS request from %s", r.RemoteAddr)

	// Create a JWK from the public key
	x := base64.RawURLEncoding.EncodeToString(c.PublicKey.X.Bytes())
	y := base64.RawURLEncoding.EncodeToString(c.PublicKey.Y.Bytes())

	jwk := JWK{
		Kty: "EC",
		Crv: "P-256",
		X:   x,
		Y:   y,
		Kid: c.Kid,
		Alg: "ES256",
		Use: "sig",
	}

	// Create a JWKS
	jwks := JWKS{
		Keys: []JWK{jwk},
	}

	// Write the response
	if err := json.NewEncoder(w).Encode(jwks); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// NewClient creates a new FAPI client
func NewClient(clientID, authServerURL, apiServerURL string, options ...ClientOption) (*Client, error) {
	// Create a client with default values
	client := &Client{
		ClientID:       clientID,
		AuthServerURL:  authServerURL,
		APIServerURL:   apiServerURL,
		HttpClient:     &http.Client{Timeout: 10 * time.Second},
		JwksServerPort: 8082,
		RealmName:      "fapi-demo",
	}

	// Apply options
	for _, option := range options {
		option(client)
	}

	// If no private key is set, generate one
	if client.PrivateKey == nil {
		privateKey, err := LoadOrGenerateKey("private_key.pem")
		if err != nil {
			return nil, fmt.Errorf("failed to load or generate key: %w", err)
		}

		client.PrivateKey = privateKey
		client.PublicKey = &privateKey.PublicKey
		client.Kid = generateKid(privateKey.PublicKey.X, privateKey.PublicKey.Y)

		// Compute JKT (JWK Thumbprint)
		jkt, err := computeJKT(&privateKey.PublicKey)
		if err != nil {
			return nil, fmt.Errorf("failed to compute JKT: %w", err)
		}
		client.Jkt = jkt
	}

	// Start the JWKS server
	if err := client.StartJWKSServer(client.JwksServerPort); err != nil {
		return nil, fmt.Errorf("failed to start JWKS server: %w", err)
	}

	// Create a token source
	tokenSource := &DPoPTokenSource{
		client: client,
	}
	client.TokenSource = tokenSource

	// Create an HTTP client with the token source
	client.HttpClient = NewDPoPHTTPClient(context.Background(), client)

	return client, nil
}

// generateKid creates a deterministic key ID from X and Y coordinates
func generateKid(x, y *big.Int) string {
	combined := append(x.Bytes(), y.Bytes()...)
	return base64.RawURLEncoding.EncodeToString(combined)[:16]
}

// computeJKT computes the JWK Thumbprint as per RFC 7638
func computeJKT(publicKey *ecdsa.PublicKey) (string, error) {
	// Create a JWK representation
	jwk := map[string]string{
		"kty": "EC",
		"crv": "P-256",
		"x":   base64.RawURLEncoding.EncodeToString(publicKey.X.Bytes()),
		"y":   base64.RawURLEncoding.EncodeToString(publicKey.Y.Bytes()),
	}

	// Marshal to JSON with keys in lexicographic order
	jwkJSON, err := json.Marshal(jwk)
	if err != nil {
		return "", err
	}

	// Compute SHA-256 hash
	thumb := sha256.Sum256(jwkJSON)
	return base64.RawURLEncoding.EncodeToString(thumb[:]), nil
}

// GenerateDPoPProof creates a DPoP proof JWT for the given URL and method
func (c *Client) GenerateDPoPProof(targetURL, method string) (string, error) {
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
		"htu": targetURL,
		"htm": method,
		"iat": now.Unix(),
		"jti": uuid.New().String(),
	})

	// Include the public key as a JWK in the header
	x := base64.RawURLEncoding.EncodeToString(c.PublicKey.X.Bytes())
	y := base64.RawURLEncoding.EncodeToString(c.PublicKey.Y.Bytes())

	jwk := map[string]interface{}{
		"kty": "EC",
		"crv": "P-256",
		"x":   x,
		"y":   y,
		"alg": "ES256",
	}

	token.Header["typ"] = "dpop+jwt"
	token.Header["alg"] = "ES256"
	token.Header["jwk"] = jwk

	return token.SignedString(c.PrivateKey)
}

// FetchWellKnownConfig retrieves the OpenID configuration from the authorization server
func (c *Client) FetchWellKnownConfig() (map[string]interface{}, error) {
	wellKnownURL := fmt.Sprintf("%s/realms/%s/.well-known/openid-configuration", c.AuthServerURL, c.RealmName)

	resp, err := http.DefaultClient.Get(wellKnownURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch well-known config: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to fetch well-known config, status: %d, body: %s", resp.StatusCode, string(body))
	}

	var config map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, fmt.Errorf("failed to decode well-known config: %w", err)
	}

	return config, nil
}

// GenerateClientAssertion creates a signed JWT client assertion
func (c *Client) GenerateClientAssertion(tokenEndpoint string) (string, error) {
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
		"iss": c.ClientID,
		"sub": c.ClientID,
		"aud": tokenEndpoint,
		"iat": now.Unix(),
		"exp": now.Add(5 * time.Minute).Unix(),
		"jti": fmt.Sprintf("%d-client-assertion", now.Unix()),
	})

	// Include the public key as a JWK in the header
	x := base64.RawURLEncoding.EncodeToString(c.PublicKey.X.Bytes())
	y := base64.RawURLEncoding.EncodeToString(c.PublicKey.Y.Bytes())

	jwk := map[string]interface{}{
		"kty": "EC",
		"crv": "P-256",
		"x":   x,
		"y":   y,
		"alg": "ES256",
	}

	token.Header["typ"] = "JWT"
	token.Header["jwk"] = jwk

	return token.SignedString(c.PrivateKey)
}

// GetAccessToken obtains a DPoP-bound access token from the authorization server
func (c *Client) GetAccessToken() (string, error) {
	// Fetch the well-known configuration to get the token endpoint
	config, err := c.FetchWellKnownConfig()
	if err != nil {
		return "", err
	}

	tokenEndpoint, ok := config["token_endpoint"].(string)
	if !ok {
		return "", fmt.Errorf("token_endpoint not found in well-known config")
	}

	// Generate client assertion
	clientAssertion, err := c.GenerateClientAssertion(tokenEndpoint)
	if err != nil {
		return "", fmt.Errorf("failed to generate client assertion: %w", err)
	}

	// Generate DPoP proof for the token endpoint
	dpopProof, err := c.GenerateDPoPProof(tokenEndpoint, "POST")
	if err != nil {
		return "", fmt.Errorf("failed to generate DPoP proof: %w", err)
	}

	// Prepare the token request
	formData := url.Values{}
	formData.Set("grant_type", "client_credentials")
	formData.Set("client_id", c.ClientID)
	formData.Set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer")
	formData.Set("client_assertion", clientAssertion)
	formData.Set("scope", "openid")
	formData.Set("jwks_uri", c.JwksURL)

	req, err := http.NewRequest(http.MethodPost, tokenEndpoint, strings.NewReader(formData.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("DPoP", dpopProof)

	// Send the token request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read token response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResponse map[string]interface{}
	if err := json.Unmarshal(body, &tokenResponse); err != nil {
		return "", fmt.Errorf("failed to parse token response: %w", err)
	}

	accessToken, ok := tokenResponse["access_token"].(string)
	if !ok {
		return "", fmt.Errorf("access_token not found in response")
	}

	return accessToken, nil
}

// ParseToken parses a JWT token string and returns the claims
func ParseToken(tokenString string) (map[string]interface{}, error) {
	// Split the token string into parts
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	// Decode the claims part (the second part)
	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode claims: %w", err)
	}

	// Parse the claims
	var claims map[string]interface{}
	if err := json.Unmarshal(claimsJSON, &claims); err != nil {
		return nil, fmt.Errorf("failed to parse claims: %w", err)
	}

	return claims, nil
}

// DPoPTokenSource is an oauth2.TokenSource that returns DPoP-bound tokens
type DPoPTokenSource struct {
	client *Client
	token  *oauth2.Token
	mu     sync.Mutex
}

// Token returns a valid token or an error
func (s *DPoPTokenSource) Token() (*oauth2.Token, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if we have a valid token
	if s.token != nil && s.token.Valid() {
		return s.token, nil
	}

	// Get a new token
	accessToken, err := s.client.GetAccessToken()
	if err != nil {
		return nil, err
	}

	// Parse the token to get the expiration time
	claims, err := ParseToken(accessToken)
	if err != nil {
		return nil, err
	}

	// Get the expiration time
	var expiry time.Time
	if exp, ok := claims["exp"].(float64); ok {
		expiry = time.Unix(int64(exp), 0)
	} else {
		// Default to 5 minutes from now
		expiry = time.Now().Add(5 * time.Minute)
	}

	// Create a new token
	s.token = &oauth2.Token{
		AccessToken: accessToken,
		TokenType:   "DPoP",
		Expiry:      expiry,
	}

	return s.token, nil
}

// DPoPTransport is an http.RoundTripper that adds DPoP proofs to requests
type DPoPTransport struct {
	Base        http.RoundTripper
	TokenSource oauth2.TokenSource
	Client      *Client
}

// RoundTrip adds a DPoP proof to the request and sets the Authorization header
func (t *DPoPTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// Get a valid token
	token, err := t.TokenSource.Token()
	if err != nil {
		return nil, err
	}

	// Clone the request to avoid modifying the original
	req2 := req.Clone(req.Context())

	// Generate a DPoP proof for this request
	dpopProof, err := t.Client.GenerateDPoPProof(req.URL.Path, req.Method)
	if err != nil {
		return nil, err
	}

	// Add the DPoP proof to the request
	req2.Header.Set("DPoP", dpopProof)

	// Add the token to the request
	req2.Header.Set("Authorization", fmt.Sprintf("%s %s", token.TokenType, token.AccessToken))

	// Send the request
	return t.Base.RoundTrip(req2)
}

// NewDPoPHTTPClient creates a new HTTP client that automatically adds DPoP proofs to requests
func NewDPoPHTTPClient(ctx context.Context, client *Client) *http.Client {
	// Create a base HTTP client
	base := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Create a DPoP transport
	transport := &DPoPTransport{
		Base:        http.DefaultTransport,
		TokenSource: client.TokenSource,
		Client:      client,
	}

	// Set the transport
	base.Transport = transport

	return base
}

// Client returns an HTTP client that automatically adds DPoP proofs to requests
func (c *Client) Client() *http.Client {
	return c.HttpClient
}

// ExportPublicKeyToPEM exports the client's public key in PEM format
func (c *Client) ExportPublicKeyToPEM(filePath string) error {
	// Marshal the public key to DER format
	derBytes, err := x509.MarshalPKIXPublicKey(c.PublicKey)
	if err != nil {
		return fmt.Errorf("failed to marshal public key: %w", err)
	}

	// Format as PEM
	pemKey := "-----BEGIN PUBLIC KEY-----\n"
	base64Content := base64.StdEncoding.EncodeToString(derBytes)
	for i := 0; i < len(base64Content); i += 64 {
		end := i + 64
		if end > len(base64Content) {
			end = len(base64Content)
		}
		pemKey += base64Content[i:end] + "\n"
	}
	pemKey += "-----END PUBLIC KEY-----\n"

	// Write to file
	return os.WriteFile(filePath, []byte(pemKey), 0644)
}
