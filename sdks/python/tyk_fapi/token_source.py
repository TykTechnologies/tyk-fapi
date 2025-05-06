"""
TokenSource implementation for the Tyk FAPI SDK.
"""

import time
import threading
from typing import Dict, Optional, Any

from .utils import parse_token


class Token:
    """
    Represents an OAuth 2.0 token.
    """
    
    def __init__(self, access_token: str, token_type: str, expiry: int):
        """
        Initialize a token.
        
        Args:
            access_token: The access token string.
            token_type: The token type (e.g., "DPoP").
            expiry: The expiration time as a Unix timestamp.
        """
        self.access_token = access_token
        self.token_type = token_type
        self.expiry = expiry
    
    def is_valid(self) -> bool:
        """
        Check if the token is still valid.
        
        Returns:
            True if the token is valid, False otherwise.
        """
        # Add a 30-second buffer to avoid using tokens that are about to expire
        return time.time() < (self.expiry - 30)


class TokenSource:
    """
    A source of OAuth 2.0 tokens that automatically refreshes when needed.
    """
    
    def __init__(self, client):
        """
        Initialize the token source.
        
        Args:
            client: The Client instance to use for token acquisition.
        """
        # Avoid circular import
        from .client import Client
        
        self.client = client
        self.token = None
        self.lock = threading.RLock()
    
    def token(self) -> Token:
        """
        Get a valid token, refreshing if necessary.
        
        Returns:
            A valid Token object.
            
        Raises:
            Exception: If token acquisition fails.
        """
        with self.lock:
            # Check if we have a valid token
            if self.token is not None and self.token.is_valid():
                return self.token
            
            # Get a new token
            access_token = self.client.get_access_token()
            
            # Parse the token to get the expiration time
            claims = parse_token(access_token)
            
            # Get the expiration time
            if "exp" in claims:
                expiry = int(claims["exp"])
            else:
                # Default to 5 minutes from now
                expiry = int(time.time()) + 300
            
            # Create a new token
            self.token = Token(
                access_token=access_token,
                token_type="DPoP",
                expiry=expiry
            )
            
            return self.token