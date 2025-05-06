"""
Tyk FAPI 2.0 Python SDK

This SDK provides a Python client for FAPI 2.0 with DPoP support. It implements
the OAuth2 client pattern with a TokenSource that automatically obtains new
access tokens when needed and generates DPoP proofs for every request.
"""

from .client import Client
from .token_source import TokenSource
from .http_client import DPoPHTTPClient

__version__ = "0.1.0"
__all__ = ["Client", "TokenSource", "DPoPHTTPClient"]