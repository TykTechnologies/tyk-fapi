FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy the source code
COPY . .

# Generate protobuf code
RUN apk add --no-cache protobuf
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0
RUN mkdir -p proto/gen
RUN protoc -I=proto \
            --go_out=proto/gen \
            --go_opt=paths=source_relative \
            --go-grpc_out=proto/gen --go-grpc_opt=paths=source_relative \
            proto/*.proto

RUN go mod tidy
RUN go mod download

# Build the application
RUN go build -o tyk-grpc-plugin

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/tyk-grpc-plugin .

# Expose the gRPC port
EXPOSE 5555

# Run the application
CMD ["./tyk-grpc-plugin"]
