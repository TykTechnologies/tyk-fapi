"""
Client implementation for the Tyk FAPI SDK.
"""

import json
import os
import time
import requests
from typing import Dict, Optional, Any, List, Union, Tuple
from urllib.parse import urlencode

import jwt
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ec import EllipticCurvePrivateKey, EllipticCurvePublicKey

from .jwks_server import JWKSServer
from .token_source import TokenSource
from .http_client import DPoPHTTPClient
from .utils import (
    load_or_generate_key,
    generate_kid,
    compute_jkt,
    generate_uuid,
    export_public_key_to_pem,
    public_key_to_jwk
)


class Client:
    """
    A FAPI 2.0 client with DPoP capabilities.
    """
    
    def __init__(
        self,
        client_id: str,
        auth_server_url: str,
        api_server_url: str,
        private_key: Optional[EllipticCurvePrivateKey] = None,
        client_secret: Optional[str] = None,
        jwks_server_port: int = 8082,
        realm_name: str = "fapi-demo"
    ):
        """
        Initialize a FAPI client.
        
        Args:
            client_id: The client ID.
            auth_server_url: The authorization server URL.
            api_server_url: The API server URL.
            private_key: Optional private key to use. If not provided, one will be generated.
            client_secret: Optional client secret.
            jwks_server_port: The port to run the JWKS server on.
            realm_name: The realm name.
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_server_url = auth_server_url
        self.api_server_url = api_server_url
        self.jwks_server_port = jwks_server_port
        self.realm_name = realm_name
        
        # If no private key is provided, generate one
        if private_key is None:
            self.private_key = load_or_generate_key("private_key.pem")
        else:
            self.private_key = private_key
        
        self.public_key = self.private_key.public_key()
        self.kid = generate_kid(self.public_key)
        self.jkt = compute_jkt(self.public_key)
        
        # Start the JWKS server
        self.jwks_server = JWKSServer(self.public_key, self.kid, self.jwks_server_port)
        self.jwks_server.start()
        self.jwks_url = self.jwks_server.jwks_url
        
        # Create a token source
        self.token_source = TokenSource(self)
        
        # Create an HTTP client
        self.http_client = DPoPHTTPClient(self)
    
    @classmethod
    def create(
        cls,
        client_id: str,
        auth_server_url: str,
        api_server_url: str,
        **kwargs
    ) -> "Client":
        """
        Create a new FAPI client.
        
        Args:
            client_id: The client ID.
            auth_server_url: The authorization server URL.
            api_server_url: The API server URL.
            **kwargs: Additional arguments to pass to the constructor.
            
        Returns:
            A new Client instance.
        """
        return cls(client_id, auth_server_url, api_server_url, **kwargs)
    
    def generate_dpop_proof(self, target_url: str, method: str) -> str:
        """
        Generate a DPoP proof JWT for the given URL and method.
        
        Args:
            target_url: The target URL.
            method: The HTTP method.
            
        Returns:
            A signed DPoP proof JWT.
        """
        now = int(time.time())
        
        # Create the JWK from the public key
        jwk = public_key_to_jwk(self.public_key)
        
        # Create the JWT header
        header = {
            "typ": "dpop+jwt",
            "alg": "ES256",
            "jwk": jwk
        }
        
        # Create the JWT payload
        payload = {
            "htu": target_url,
            "htm": method,
            "iat": now,
            "jti": generate_uuid()
        }
        
        # Sign the JWT
        return jwt.encode(
            payload=payload,
            key=self.private_key,
            algorithm="ES256",
            headers=header
        )
    
    def fetch_well_known_config(self) -> Dict[str, Any]:
        """
        Retrieve the OpenID configuration from the authorization server.
        
        Returns:
            The OpenID configuration.
            
        Raises:
            Exception: If the configuration cannot be retrieved.
        """
        well_known_url = f"{self.auth_server_url}/realms/{self.realm_name}/.well-known/openid-configuration"
        
        response = requests.get(well_known_url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch well-known config, status: {response.status_code}, body: {response.text}")
        
        return response.json()
    
    def generate_client_assertion(self, token_endpoint: str) -> str:
        """
        Create a signed JWT client assertion.
        
        Args:
            token_endpoint: The token endpoint URL.
            
        Returns:
            A signed JWT client assertion.
        """
        now = int(time.time())
        
        # Create the JWK from the public key
        jwk = public_key_to_jwk(self.public_key)
        
        # Create the JWT header
        header = {
            "typ": "JWT",
            "alg": "ES256",
            "jwk": jwk
        }
        
        # Create the JWT payload
        payload = {
            "iss": self.client_id,
            "sub": self.client_id,
            "aud": token_endpoint,
            "iat": now,
            "exp": now + 300,  # 5 minutes
            "jti": f"{now}-client-assertion"
        }
        
        # Sign the JWT
        return jwt.encode(
            payload=payload,
            key=self.private_key,
            algorithm="ES256",
            headers=header
        )
    
    def get_access_token(self) -> str:
        """
        Obtain a DPoP-bound access token from the authorization server.
        
        Returns:
            An access token string.
            
        Raises:
            Exception: If token acquisition fails.
        """
        # Fetch the well-known configuration to get the token endpoint
        config = self.fetch_well_known_config()
        
        token_endpoint = config.get("token_endpoint")
        if not token_endpoint:
            raise Exception("token_endpoint not found in well-known config")
        
        # Generate client assertion
        client_assertion = self.generate_client_assertion(token_endpoint)
        
        # Generate DPoP proof for the token endpoint
        dpop_proof = self.generate_dpop_proof(token_endpoint, "POST")
        
        # Prepare the token request
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": client_assertion,
            "scope": "openid",
            "jwks_uri": self.jwks_url
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "DPoP": dpop_proof
        }
        
        # Send the token request
        response = requests.post(token_endpoint, data=urlencode(data), headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Token request failed with status {response.status_code}: {response.text}")
        
        token_response = response.json()
        
        access_token = token_response.get("access_token")
        if not access_token:
            raise Exception("access_token not found in response")
        
        return access_token
    
    def client(self) -> DPoPHTTPClient:
        """
        Get an HTTP client that automatically adds DPoP proofs to requests.
        
        Returns:
            A DPoPHTTPClient instance.
        """
        return self.http_client
    
    def stop_jwks_server(self) -> None:
        """
        Stop the JWKS server.
        """
        if self.jwks_server:
            self.jwks_server.stop()
    
    def export_public_key_to_pem(self, file_path: str) -> None:
        """
        Export the client's public key in PEM format.
        
        Args:
            file_path: The path to write the public key to.
        """
        export_public_key_to_pem(self.private_key, file_path)