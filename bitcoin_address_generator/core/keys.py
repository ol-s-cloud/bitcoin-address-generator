"""
Key generation and management module.
"""

import codecs
import os
import ecdsa

def generate_private_key():
    """Generate a random private key."""
    return codecs.encode(os.urandom(32), 'hex').decode('utf-8')

def get_public_key(private_key: str) -> str:
    """Convert private key to public key using ECDSA.
    
    Args:
        private_key (str): 64-character hexadecimal private key
        
    Returns:
        str: Public key in hexadecimal format
        
    Raises:
        ValueError: If private key is invalid
    """
    try:
        private_key_bytes = codecs.decode(private_key, 'hex')
        signing_key = ecdsa.SigningKey.from_string(private_key_bytes, curve=ecdsa.SECP256k1)
        verifying_key = signing_key.verifying_key
        public_key_bytes = verifying_key.to_string()
        public_key_hex = codecs.encode(public_key_bytes, 'hex')
        return (b'04' + public_key_hex).decode('utf-8')
    except Exception as e:
        raise ValueError(f"Invalid private key: {str(e)}")

def get_compressed_public_key(public_key: str) -> str:
    """Get compressed public key.
    
    Args:
        public_key (str): Uncompressed public key
        
    Returns:
        str: Compressed public key
        
    Raises:
        ValueError: If public key is invalid
    """
    try:
        if not public_key.startswith('04'):
            raise ValueError("Public key must start with '04'")
            
        if len(public_key) != 130:
            raise ValueError("Invalid public key length")
            
        if ord(bytearray.fromhex(public_key[-2:]))%2 == 0:
            return '02' + public_key[2:66]
        return '03' + public_key[2:66]
    except Exception as e:
        raise ValueError(f"Invalid public key: {str(e)}")