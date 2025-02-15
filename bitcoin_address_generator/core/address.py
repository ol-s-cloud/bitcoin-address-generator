"""
Bitcoin address generation and validation module.
"""

import hashlib
import base58

def create_address(public_key_compressed: str) -> str:
    """Create Bitcoin address from compressed public key.
    
    Args:
        public_key_compressed (str): Compressed public key in hexadecimal format
        
    Returns:
        str: Bitcoin address
        
    Raises:
        ValueError: If public key is invalid
    """
    try:
        # Convert public key to bytes
        hex_str = bytearray.fromhex(public_key_compressed)
        
        # SHA-256
        sha = hashlib.sha256()
        sha.update(hex_str)
        
        # RIPEMD-160
        rip = hashlib.new('ripemd160')
        rip.update(sha.digest())
        key_hash = rip.hexdigest()
        
        # Add version byte (0x00 for mainnet)
        modified_key_hash = "00" + key_hash
        
        # Double SHA-256 for checksum
        hex_str = bytearray.fromhex(modified_key_hash)
        sha = hashlib.sha256()
        sha.update(hex_str)
        sha_2 = hashlib.sha256()
        sha_2.update(sha.digest())
        
        # Get checksum (first 4 bytes)
        checksum = sha_2.hexdigest()[:8]
        
        # Combine version, key hash, and checksum
        byte_25_address = modified_key_hash + checksum
        
        # Base58 encode
        address = base58.b58encode(bytes(bytearray.fromhex(byte_25_address))).decode('utf-8')
        return address
    except Exception as e:
        raise ValueError(f"Error creating Bitcoin address: {str(e)}")

def validate_address(address: str) -> bool:
    """Validate Bitcoin address format and checksum.
    
    Args:
        address (str): Bitcoin address to validate
        
    Returns:
        bool: True if address is valid, False otherwise
    """
    try:
        # Decode from base58
        decoded = base58.b58decode(address)
        
        # Convert to hex
        hex_str = decoded.hex()
        
        # Extract components
        version = hex_str[:2]
        key_hash = hex_str[2:-8]
        checksum = hex_str[-8:]
        
        # Verify version
        if version != "00":
            return False
            
        # Verify checksum
        hex_str = bytearray.fromhex(version + key_hash)
        sha = hashlib.sha256()
        sha.update(hex_str)
        sha_2 = hashlib.sha256()
        sha_2.update(sha.digest())
        
        if sha_2.hexdigest()[:8] != checksum:
            return False
            
        return True
    except Exception:
        return False