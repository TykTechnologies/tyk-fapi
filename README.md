# Tyk gRPC Plugin for FAPI with DPoP

This is a gRPC plugin for Tyk API Gateway that implements DPoP (Demonstrating Proof of Possession) authentication for FAPI (Financial-grade API) compliance.

## Features

- Pre-auth hook: Checks for the existence of Authorization and DPoP headers, and rewrites `Authorization: DPoP <token>` to `Authorization: Bearer <token>` for compatibility with Tyk's JWT middleware.
- Post-auth hook: Validates the DPoP proof and claims, including audience validation and DPoP fingerprint verification.

## Requirements

- Tyk API Gateway
- Docker (for building and running the plugin)

## Building and Running

### Using Docker

1. Build the Docker image:
   ```
   docker build -t tyk-grpc-plugin-fapi .
   ```

2. Run the container:
   ```
   docker run -p 5555:5555 tyk-grpc-plugin-fapi
   ```

### Manual Build

1. Install Protocol Buffers compiler:
   ```
   # macOS
   brew install protobuf

   # Ubuntu
   apt-get install -y protobuf-compiler
   ```

2. Install Go protobuf plugins:
   ```
   go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1
   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0
   ```

3. Generate protobuf code:
   ```
   mkdir -p proto/gen/proto
   protoc --go_out=proto/gen/proto --go_opt=paths=source_relative \
          --go-grpc_out=proto/gen/proto --go-grpc_opt=paths=source_relative \
          proto/coprocess.proto
   ```

4. Build the plugin:
   ```
   go build -o tyk-grpc-plugin-fapi
   ```

5. Run the plugin:
   ```
   ./tyk-grpc-plugin-fapi
   ```

## Configuring Tyk

1. Update your Tyk configuration file (`tyk.conf`) to enable gRPC plugins:
   ```json
   {
     "coprocess_options": {
       "enable_coprocess": true,
       "coprocess_grpc_server": "tcp://localhost:5555"
     }
   }
   ```

2. Configure your API definition to use the gRPC plugin:
   ```json
   {
     "name": "My FAPI API",
     "use_keyless": false,
     "jwt_signing_method": "rsa",
     "jwt_source": "https://your-jwks-url",
     "jwt_identity_base_field": "sub",
     "jwt_policy_field_name": "pol",
     "custom_middleware": {
       "pre": [
         {
           "name": "PreAuthCheck"
         }
       ],
       "post_key_auth": [
         {
           "name": "PostKeyAuth"
         }
       ],
       "driver": "grpc"
     }
   }
   ```

## How It Works

1. **Pre-auth hook**:
   - Checks for the existence of Authorization and DPoP headers
   - If Authorization header is `DPoP <token>`, rewrites it to `Bearer <token>`
   - Rejects requests with missing or invalid headers

2. **Tyk JWT middleware**:
   - Validates the JWT token (signature, expiration, etc.)

3. **Post-auth hook**:
   - Validates the audience claim in the token
   - Extracts the DPoP fingerprint (jkt) from the token
   - Validates the DPoP proof against the fingerprint
   - Removes the DPoP header before forwarding the request upstream
