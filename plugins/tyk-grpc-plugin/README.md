# Tyk gRPC Plugin for FAPI with DPoP

This is a gRPC plugin for Tyk API Gateway that implements DPoP (Demonstrating Proof of Possession) authentication for FAPI (Financial-grade API) compliance.

## Features

- Single DPoP validation hook: Validates DPoP proof and claims in a single step, including:
  - Checking for the existence of Authorization and DPoP headers
  - Rewriting `Authorization: DPoP <token>` to `Authorization: Bearer <token>` for compatibility with Tyk's JWT middleware
  - Extracting the DPoP fingerprint (jkt) from the token
  - Validating the DPoP proof against the fingerprint
  - Removing the DPoP header before forwarding the request upstream

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
```yaml
  middleware:
    global:
      contextVariables:
        enabled: true
      pluginConfig:
       driver: grpc
      prePlugins:
      - enabled: true
        functionName: DPoPCheck
        path: ''
      trafficLogs:
       enabled: true
```

## How It Works

1. **DPoP validation hook (pre-auth)**:
   - Checks for the existence of Authorization and DPoP headers
   - If Authorization header is `DPoP <token>`, rewrites it to `Bearer <token>`
   - Parses the access token
   - Extracts the DPoP fingerprint (jkt) from the token
   - Validates the DPoP proof against the fingerprint
   - Removes the DPoP header before forwarding the request
   - Rejects requests with missing or invalid headers/tokens

2. **Tyk JWT middleware**:
   - Validates the JWT token (signature, expiration, etc.)
   - Processes the request based on the JWT claims