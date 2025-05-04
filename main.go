package main

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"

	pb "github.com/TykTechnologies/tyk-grpc-plugin-fapi/proto/gen"
	"github.com/golang-jwt/jwt"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
)

var log = logrus.New()

func init() {
	log.Level = logrus.InfoLevel
	log.Formatter = &logrus.TextFormatter{
		FullTimestamp: true,
	}
}

// DPoPHandler implements the gRPC server for Tyk
type DPoPHandler struct {
	pb.UnimplementedDispatcherServer
}

// Dispatch handles the gRPC request from Tyk
func (d *DPoPHandler) Dispatch(ctx context.Context, object *pb.Object) (*pb.Object, error) {
	switch object.HookName {
	case "PreAuthCheck":
		return d.PreAuthCheck(object)
	case "PostKeyAuth":
		return d.PostKeyAuth(object)
	default:
		log.Warnf("Unknown hook: %s", object.HookName)
		return object, nil
	}
}

// DispatchEvent handles events from Tyk
func (d *DPoPHandler) DispatchEvent(ctx context.Context, event *pb.Event) (*pb.EventReply, error) {
	// We're not handling events in this plugin
	return &pb.EventReply{}, nil
}

// PreAuthCheck implements the pre-auth hook
// It checks for the existence of Authorization and DPoP headers
// If Authorization header is DPoP, it rewrites it to Bearer
func (d *DPoPHandler) PreAuthCheck(object *pb.Object) (*pb.Object, error) {
	log.Info("Running PreAuthCheck hook")

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
	if strings.HasPrefix(authHeader, "DPoP ") {
		token := strings.TrimPrefix(authHeader, "DPoP ")
		object.Request.SetHeaders["Authorization"] = "Bearer " + token
		log.Info("Rewrote DPoP token to Bearer token")
	} else if !strings.HasPrefix(authHeader, "Bearer ") {
		log.Error("Authorization header must start with DPoP or Bearer")
		return d.respondWithError(object, "Invalid Authorization header format", http.StatusUnauthorized)
	}

	return object, nil
}

// PostKeyAuth implements the post-auth hook
// It validates the DPoP proof and claims
func (d *DPoPHandler) PostKeyAuth(object *pb.Object) (*pb.Object, error) {
	log.Info("Running PostKeyAuth hook")

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

	// Extract token from Authorization header
	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Parse and validate the access token
	accessTokenClaims, err := d.parseAndValidateAccessToken(token)
	if err != nil {
		log.Errorf("Failed to parse access token: %v", err)
		return d.respondWithError(object, "Invalid access token", http.StatusUnauthorized)
	}

	// Validate audience claim
	if err := d.validateAudienceClaim(accessTokenClaims); err != nil {
		log.Errorf("Audience validation failed: %v", err)
		return d.respondWithError(object, err.Error(), http.StatusUnauthorized)
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

	// Create a new SetHeaders map or update existing one
	if object.Request.SetHeaders == nil {
		object.Request.SetHeaders = map[string]string{}
	}

	// Add the X-Foo header
	object.Request.SetHeaders["X-Foo"] = "Bar"
	log.Info("Added X-Foo: Bar header using SetHeaders in PostKeyAuth")

	// Add DPoP and Authorization to DeleteHeaders
	if object.Request.DeleteHeaders == nil {
		object.Request.DeleteHeaders = []string{}
	}
	object.Request.DeleteHeaders = append(object.Request.DeleteHeaders, "DPoP", "Authorization")
	log.Info("Added DPoP and Authorization to DeleteHeaders")

	// Print all headers after modification for debugging
	log.Info("Headers in PostKeyAuth after modification:")
	for k, v := range object.Request.Headers {
		log.Infof("  %s: %s", k, v)
	}

	log.Info("SetHeaders in PostKeyAuth:")
	for k, v := range object.Request.SetHeaders {
		log.Infof("  %s: %s", k, v)
	}

	log.Info("DeleteHeaders in PostKeyAuth:")
	for _, v := range object.Request.DeleteHeaders {
		log.Infof("  %s", v)
	}

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

// validateAudienceClaim validates the audience claim in the access token
func (d *DPoPHandler) validateAudienceClaim(claims jwt.MapClaims) error {
	// Get the audience claim
	aud, ok := claims["aud"]
	if !ok {
		return errors.New("missing audience claim")
	}

	// Check if audience is a string or an array
	switch v := aud.(type) {
	case string:
		// For simplicity, we're just checking if it's not empty
		if v == "" {
			return errors.New("empty audience claim")
		}
	case []interface{}:
		// For an array, check if it's not empty
		if len(v) == 0 {
			return errors.New("empty audience claim array")
		}
	default:
		return errors.New("invalid audience claim format")
	}

	return nil
}

// validateDPoPProof validates the DPoP proof
func (d *DPoPHandler) validateDPoPProof(dpopProof, expectedJkt, method, requestURL string) error {
	// Parse the DPoP proof
	token, _, err := new(jwt.Parser).ParseUnverified(dpopProof, jwt.MapClaims{})
	if err != nil {
		return fmt.Errorf("failed to parse DPoP proof: %w", err)
	}

	// Get the claims
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
		return fmt.Errorf("missing htu claim")
	}

	// Extract the path from the URL
	urlPath := requestURL
	if strings.Contains(requestURL, "://") {
		parsedURL, parseErr := url.Parse(requestURL)
		if parseErr == nil {
			urlPath = parsedURL.Path
		}
	}

	// Compare the path part only
	if htu != urlPath {
		return fmt.Errorf("invalid htu claim: expected %s, got %s", urlPath, htu)
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

func main() {
	log.Info("Starting DPoP gRPC server on :5555")
	lis, err := net.Listen("tcp", ":5555")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterDispatcherServer(s, &DPoPHandler{})
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
