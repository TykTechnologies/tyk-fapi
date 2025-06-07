#!/bin/bash
set -e

# Clean up existing generated files
rm -rf proto/gen

# Create the output directory
mkdir -p proto/gen

# Install the specific versions of protoc plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0

# Generate the protobuf code
protoc -I=proto \
        --go_out=proto/gen --go_opt=paths=source_relative \
        --go-grpc_out=proto/gen --go-grpc_opt=paths=source_relative \
        proto/*.proto

echo "Proto files regenerated successfully!"
