"""
JWKS Server implementation for the Tyk FAPI SDK.
"""

import json
import logging
import threading
from flask import Flask, jsonify, request
from typing import Dict, List, Optional, Callable

from cryptography.hazmat.primitives.asymmetric.ec import EllipticCurvePublicKey
from .utils import public_key_to_jwk


class JWKSServer:
    """
    A server that hosts a JSON Web Key Set (JWKS) endpoint.
    """
    
    def __init__(self, public_key: EllipticCurvePublicKey, kid: str, port: int = 8082):
        """
        Initialize the JWKS server.
        
        Args:
            public_key: The public key to serve.
            kid: The key ID.
            port: The port to run the server on.
        """
        self.public_key = public_key
        self.kid = kid
        self.port = port
        self.app = Flask(__name__)
        self.server_thread = None
        self.jwks_url = f"http://localhost:{port}/.well-known/jwks.json"
        
        # Set up routes
        self.app.route("/.well-known/jwks.json")(self.handle_jwks)
        
        # Disable Flask's default logging
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
    
    def handle_jwks(self):
        """
        Handle requests to the JWKS endpoint.
        
        Returns:
            A JSON response containing the JWKS.
        """
        # Log the request
        print(f"JWKS request from {request.remote_addr}")
        
        # Create a JWK from the public key
        jwk = public_key_to_jwk(self.public_key, self.kid)
        
        # Create a JWKS
        jwks = {
            "keys": [jwk]
        }
        
        # Set CORS headers
        response = jsonify(jwks)
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        
        return response
    
    def start(self) -> None:
        """
        Start the JWKS server in a separate thread.
        
        Raises:
            RuntimeError: If the server is already running.
        """
        if self.server_thread is not None and self.server_thread.is_alive():
            raise RuntimeError("JWKS server already running")
        
        def run_server():
            self.app.run(host="0.0.0.0", port=self.port, debug=False, use_reloader=False)
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()
        
        print(f"Starting JWKS server on port {self.port}")
        print(f"JWKS server started. Local URL: {self.jwks_url}")
        print(f"For Keycloak in Docker, use: http://host.docker.internal:{self.port}/.well-known/jwks.json")
    
    def stop(self) -> None:
        """
        Stop the JWKS server.
        """
        if self.server_thread is None or not self.server_thread.is_alive():
            return
        
        # This is a bit of a hack, but Flask doesn't provide a clean way to stop the server
        import requests
        try:
            requests.get(f"http://localhost:{self.port}/shutdown", timeout=0.1)
        except requests.exceptions.RequestException:
            pass
        
        self.server_thread = None
        print("JWKS server stopped")