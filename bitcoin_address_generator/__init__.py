"""
Bitcoin Address Generator Package

A Python package for generating Bitcoin addresses using ECDSA
"""

from bitcoin_address_generator.core.keys import (
    generate_private_key, 
    get_public_key, 
    get_compressed_public_key,
    encrypt_private_key,
    decrypt_private_key
)
from bitcoin_address_generator.core.address import (
    create_address, 
    create_p2sh_address, 
    create_segwit_address,
    validate_address,
    validate_p2sh_address,
    validate_segwit_address
)
from bitcoin_address_generator.core.qr import generate_qr_code

__version__ = '0.2.0'

def generate_wallet(private_key=None, address_type='p2pkh'):
    """Generate a new Bitcoin wallet or use existing private key.
    
    Args:
        private_key (str, optional): Existing private key to use. If None, a new one is generated.
        address_type (str, optional): Type of address to generate. One of: 'p2pkh', 'p2sh', 'segwit'.
            Default is 'p2pkh' (standard address).
            
    Returns:
        tuple: (private_key, public_key, address)
        
    Raises:
        ValueError: If the address type is invalid
    """
    if private_key is None:
        private_key = generate_private_key()
    
    public_key = get_public_key(private_key)
    compressed_public_key = get_compressed_public_key(public_key)
    
    if address_type == 'p2pkh':
        address = create_address(compressed_public_key)
    elif address_type == 'p2sh':
        address = create_p2sh_address(compressed_public_key)
    elif address_type == 'segwit':
        address = create_segwit_address(compressed_public_key)
    else:
        raise ValueError(f"Invalid address type: {address_type}. Choose from: 'p2pkh', 'p2sh', 'segwit'")
    
    return private_key, public_key, address

def generate_bulk_wallets(count=5, address_type='p2pkh'):
    """Generate multiple Bitcoin wallets.
    
    Args:
        count (int, optional): Number of wallets to generate. Default is 5.
        address_type (str, optional): Type of address to generate. One of: 'p2pkh', 'p2sh', 'segwit'.
            Default is 'p2pkh' (standard address).
            
    Returns:
        list: List of (private_key, public_key, address) tuples
    """
    wallets = []
    for _ in range(count):
        wallet = generate_wallet(address_type=address_type)
        wallets.append(wallet)
    return wallets

def sign_message(private_key, message):
    """Sign a message with a private key.
    
    Args:
        private_key (str): Private key to sign with
        message (str): Message to sign
        
    Returns:
        str: Signature in base64 format
    """
    raise NotImplementedError("Message signing will be implemented in v0.2.0")

def verify_signature(address, message, signature):
    """Verify a signature for a message.
    
    Args:
        address (str): Bitcoin address
        message (str): Message that was signed
        signature (str): Signature to verify in base64 format
        
    Returns:
        bool: True if signature is valid, False otherwise
    """
    raise NotImplementedError("Signature verification will be implemented in v0.2.0")