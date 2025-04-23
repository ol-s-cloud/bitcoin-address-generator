"""
Key generation and management module.
"""

import codecs
import os
import ecdsa
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

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

def _derive_key(password: str, salt: bytes = None) -> tuple:
    """Derive a key from a password using PBKDF2.
    
    Args:
        password (str): Password to derive key from
        salt (bytes, optional): Salt for key derivation
        
    Returns:
        tuple: (key, salt)
    """
    if salt is None:
        salt = os.urandom(16)
        
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt

def encrypt_private_key(private_key: str, password: str) -> dict:
    """Encrypt a private key with a password.
    
    Args:
        private_key (str): Private key to encrypt
        password (str): Password to encrypt with
        
    Returns:
        dict: Dictionary containing:
            - encrypted_key (str): Base64-encoded encrypted private key
            - salt (str): Base64-encoded salt used for encryption
    """
    try:
        # Derive key from password
        key, salt = _derive_key(password)
        
        # Create a Fernet instance
        fernet = Fernet(key)
        
        # Encrypt the private key
        encrypted_data = fernet.encrypt(private_key.encode())
        
        # Return encrypted data and salt as base64
        return {
            'encrypted_key': base64.b64encode(encrypted_data).decode(),
            'salt': base64.b64encode(salt).decode()
        }
    except Exception as e:
        raise ValueError(f"Error encrypting private key: {str(e)}")

def decrypt_private_key(encrypted_data: dict, password: str) -> str:
    """Decrypt a private key with a password.
    
    Args:
        encrypted_data (dict): Dictionary containing:
            - encrypted_key (str): Base64-encoded encrypted private key
            - salt (str): Base64-encoded salt used for encryption
        password (str): Password to decrypt with
        
    Returns:
        str: Decrypted private key
        
    Raises:
        ValueError: If decryption fails
    """
    try:
        # Decode encrypted data and salt
        encrypted_key = base64.b64decode(encrypted_data['encrypted_key'])
        salt = base64.b64decode(encrypted_data['salt'])
        
        # Derive key from password and salt
        key, _ = _derive_key(password, salt)
        
        # Create a Fernet instance
        fernet = Fernet(key)
        
        # Decrypt the private key
        decrypted_data = fernet.decrypt(encrypted_key).decode()
        
        return decrypted_data
    except Exception as e:
        raise ValueError(f"Error decrypting private key: {str(e)}")