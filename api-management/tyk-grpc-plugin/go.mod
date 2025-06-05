module github.com/TykTechnologies/tyk-fapi/api-management/tyk-grpc-plugin

go 1.24

require (
	github.com/TykTechnologies/tyk-fapi/plugins/tyk-grpc-plugin v0.0.0-20250604093230-34d8d88a2dd1
	github.com/golang-jwt/jwt v3.2.2+incompatible
	github.com/sirupsen/logrus v1.9.3
	google.golang.org/grpc v1.64.0
	google.golang.org/protobuf v1.33.0
)

require (
	golang.org/x/net v0.22.0 // indirect
	golang.org/x/sys v0.18.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240318140521-94a12d6c2237 // indirect
)
