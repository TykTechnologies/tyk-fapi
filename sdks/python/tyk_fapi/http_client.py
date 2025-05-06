"""
HTTP client implementation for the Tyk FAPI SDK.
"""

import requests
from requests.adapters import HTTPAdapter
from requests.models import PreparedRequest
from typing import Dict, Optional, Any, Union
from urllib.parse import urlparse

from .token_source import TokenSource


class DPoPTransport(HTTPAdapter):
    """
    A transport adapter that adds DPoP proofs to requests.
    """
    
    def __init__(self, client, token_source: TokenSource):
        """
        Initialize the DPoP transport.
        
        Args:
            client: The Client instance to use for DPoP proof generation.
            token_source: The TokenSource to use for token acquisition.
        """
        super().__init__()
        self.client = client
        self.token_source = token_source
    
    def add_headers(self, request: PreparedRequest, **kwargs) -> None:
        """
        Add DPoP and Authorization headers to the request.
        
        Args:
            request: The prepared request to modify.
            **kwargs: Additional arguments passed to the adapter.
        """
        # Get a valid token
        token = self.token_source.token()
        
        # Parse the URL to get the path
        parsed_url = urlparse(request.url)
        target_url = parsed_url.path
        if parsed_url.query:
            target_url += f"?{parsed_url.query}"
        
        # Generate a DPoP proof for this request
        dpop_proof = self.client.generate_dpop_proof(target_url, request.method)
        
        # Add the DPoP proof to the request
        request.headers["DPoP"] = dpop_proof
        
        # Add the token to the request
        request.headers["Authorization"] = f"{token.token_type} {token.access_token}"


class DPoPHTTPClient:
    """
    An HTTP client that automatically adds DPoP proofs to requests.
    """
    
    def __init__(self, client):
        """
        Initialize the DPoP HTTP client.
        
        Args:
            client: The Client instance to use for DPoP proof generation.
        """
        self.client = client
        self.session = requests.Session()
        
        # Add the DPoP transport
        adapter = DPoPTransport(client, client.token_source)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def request(self, method: str, url: str, **kwargs) -> requests.Response:
        """
        Make an HTTP request with DPoP proof.
        
        Args:
            method: The HTTP method to use.
            url: The URL to request.
            **kwargs: Additional arguments to pass to requests.
            
        Returns:
            The HTTP response.
        """
        return self.session.request(method, url, **kwargs)
    
    def get(self, url: str, **kwargs) -> requests.Response:
        """
        Make a GET request with DPoP proof.
        
        Args:
            url: The URL to request.
            **kwargs: Additional arguments to pass to requests.
            
        Returns:
            The HTTP response.
        """
        return self.request("GET", url, **kwargs)
    
    def post(self, url: str, **kwargs) -> requests.Response:
        """
        Make a POST request with DPoP proof.
        
        Args:
            url: The URL to request.
            **kwargs: Additional arguments to pass to requests.
            
        Returns:
            The HTTP response.
        """
        return self.request("POST", url, **kwargs)
    
    def put(self, url: str, **kwargs) -> requests.Response:
        """
        Make a PUT request with DPoP proof.
        
        Args:
            url: The URL to request.
            **kwargs: Additional arguments to pass to requests.
            
        Returns:
            The HTTP response.
        """
        return self.request("PUT", url, **kwargs)
    
    def delete(self, url: str, **kwargs) -> requests.Response:
        """
        Make a DELETE request with DPoP proof.
        
        Args:
            url: The URL to request.
            **kwargs: Additional arguments to pass to requests.
            
        Returns:
            The HTTP response.
        """
        return self.request("DELETE", url, **kwargs)
    
    def patch(self, url: str, **kwargs) -> requests.Response:
        """
        Make a PATCH request with DPoP proof.
        
        Args:
            url: The URL to request.
            **kwargs: Additional arguments to pass to requests.
            
        Returns:
            The HTTP response.
        """
        return self.request("PATCH", url, **kwargs)