#!/bin/bash
set -e

# Clean up existing proto files and generated code
rm -rf proto/gen
rm -f proto/*.proto

# Create the output directory
mkdir -p proto/gen

# Copy Tyk's proto files to our project
cp /Users/asoorm/go/src/github.com/TykTechnologies/tyk/coprocess/proto/*.proto proto/

# Update the go_package option in the proto files to point to our project
for file in proto/*.proto; do
  # Update the go_package option
  sed -i '' 's|option go_package = "/coprocess";|option go_package = "github.com/TykTechnologies/tyk-fapi/plugins/tyk-grpc-plugin/proto/gen;proto";|g' "$file"
  
  # No need to update import paths as they are relative and should work as is
done

# Install the specific versions of protoc plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0

# Generate the protobuf code
protoc -I=proto \
       --go_out=proto/gen --go_opt=paths=source_relative \
       --go-grpc_out=proto/gen --go-grpc_opt=paths=source_relative \
       proto/*.proto

echo "Proto files updated and regenerated successfully!"