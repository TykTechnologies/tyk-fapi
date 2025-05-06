"""
Utility functions for the Tyk FAPI SDK.
"""

import base64
import hashlib
import json
import os
import uuid
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ec import EllipticCurvePrivateKey, EllipticCurvePublicKey
from typing import Dict, Tuple, Optional, Any


def generate_key_pair() -> ec.EllipticCurvePrivateKey:
    """
    Generate a new EC key pair using the P-256 curve.
    
    Returns:
        An EC private key object.
    """
    return ec.generate_private_key(ec.SECP256R1())


def load_private_key_from_file(key_file: str) -> ec.EllipticCurvePrivateKey:
    """
    Load a private key from a PEM file.
    
    Args:
        key_file: Path to the PEM file containing the private key.
        
    Returns:
        An EC private key object.
        
    Raises:
        ValueError: If the key file cannot be read or parsed.
    """
    try:
        with open(key_file, "rb") as f:
            key_data = f.read()
            
        return serialization.load_pem_private_key(key_data, password=None)
    except Exception as e:
        raise ValueError(f"Failed to load private key from file: {e}")


def load_or_generate_key(key_file: str) -> ec.EllipticCurvePrivateKey:
    """
    Load a key from a file or generate a new one if the file doesn't exist.
    
    Args:
        key_file: Path to the PEM file containing the private key.
        
    Returns:
        An EC private key object.
    """
    if os.path.exists(key_file):
        print(f"Loading existing key from {key_file}")
        return load_private_key_from_file(key_file)
    
    print(f"Generating new key and saving to {key_file}")
    private_key = generate_key_pair()
    
    # Save the key to file
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    with open(key_file, "wb") as f:
        f.write(pem)
    
    return private_key


def export_public_key_to_pem(private_key: ec.EllipticCurvePrivateKey, file_path: str) -> None:
    """
    Export the public key to a PEM file.
    
    Args:
        private_key: The private key from which to extract the public key.
        file_path: Path where the public key will be saved.
    """
    public_key = private_key.public_key()
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    with open(file_path, "wb") as f:
        f.write(pem)


def public_key_to_jwk(public_key: ec.EllipticCurvePublicKey, kid: Optional[str] = None) -> Dict[str, str]:
    """
    Convert a public key to a JWK (JSON Web Key).
    
    Args:
        public_key: The public key to convert.
        kid: Optional key ID to include in the JWK.
        
    Returns:
        A dictionary representing the JWK.
    """
    numbers = public_key.public_numbers()
    
    # Convert to base64url encoding without padding
    x = base64.urlsafe_b64encode(numbers.x.to_bytes(32, byteorder="big")).decode("utf-8").rstrip("=")
    y = base64.urlsafe_b64encode(numbers.y.to_bytes(32, byteorder="big")).decode("utf-8").rstrip("=")
    
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": x,
        "y": y,
        "alg": "ES256",
        "use": "sig"
    }
    
    if kid:
        jwk["kid"] = kid
    
    return jwk


def generate_kid(public_key: ec.EllipticCurvePublicKey) -> str:
    """
    Generate a key ID (kid) from a public key.
    
    Args:
        public_key: The public key to generate the kid from.
        
    Returns:
        A string representing the kid.
    """
    numbers = public_key.public_numbers()
    x_bytes = numbers.x.to_bytes(32, byteorder="big")
    y_bytes = numbers.y.to_bytes(32, byteorder="big")
    combined = x_bytes + y_bytes
    
    # Take first 16 bytes of base64url encoding
    return base64.urlsafe_b64encode(combined).decode("utf-8").rstrip("=")[:16]


def compute_jkt(public_key: ec.EllipticCurvePublicKey) -> str:
    """
    Compute the JWK Thumbprint (jkt) as per RFC 7638.
    
    Args:
        public_key: The public key to compute the jkt from.
        
    Returns:
        A string representing the jkt.
    """
    # Create a JWK representation with only the required fields in lexicographic order
    numbers = public_key.public_numbers()
    x = base64.urlsafe_b64encode(numbers.x.to_bytes(32, byteorder="big")).decode("utf-8").rstrip("=")
    y = base64.urlsafe_b64encode(numbers.y.to_bytes(32, byteorder="big")).decode("utf-8").rstrip("=")
    
    jwk = {
        "crv": "P-256",
        "kty": "EC",
        "x": x,
        "y": y
    }
    
    # Serialize to JSON with no whitespace
    jwk_json = json.dumps(jwk, sort_keys=True, separators=(",", ":")).encode("utf-8")
    
    # Compute SHA-256 hash
    thumb = hashlib.sha256(jwk_json).digest()
    
    # Return base64url encoding without padding
    return base64.urlsafe_b64encode(thumb).decode("utf-8").rstrip("=")


def generate_uuid() -> str:
    """
    Generate a random UUID.
    
    Returns:
        A string representing the UUID.
    """
    return str(uuid.uuid4())


def parse_token(token_string: str) -> Dict[str, Any]:
    """
    Parse a JWT token string and return the claims.
    
    Args:
        token_string: The JWT token string to parse.
        
    Returns:
        A dictionary containing the token claims.
        
    Raises:
        ValueError: If the token cannot be parsed.
    """
    parts = token_string.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")
    
    # Decode the claims part (the second part)
    try:
        # Add padding if needed
        padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
        claims_json = base64.urlsafe_b64decode(padded)
        claims = json.loads(claims_json)
        return claims
    except Exception as e:
        raise ValueError(f"Failed to parse token: {e}")