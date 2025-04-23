"""
Bitcoin address generation and validation module.
"""

import hashlib
import base58
import codecs
import struct

def create_address(public_key_compressed: str) -> str:
    """Create Bitcoin address from compressed public key (P2PKH).
    
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

def create_p2sh_address(public_key_compressed: str) -> str:
    """Create P2SH Bitcoin address from compressed public key.
    
    Args:
        public_key_compressed (str): Compressed public key in hexadecimal format
        
    Returns:
        str: P2SH Bitcoin address
        
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
        
        # Create redeem script (OP_0 <pubkey_hash>)
        redeem_script = "76a914" + key_hash + "88ac"
        redeem_script_bytes = bytearray.fromhex(redeem_script)
        
        # Hash the redeem script
        sha = hashlib.sha256()
        sha.update(redeem_script_bytes)
        rip = hashlib.new('ripemd160')
        rip.update(sha.digest())
        script_hash = rip.hexdigest()
        
        # Add version byte (0x05 for P2SH mainnet)
        modified_script_hash = "05" + script_hash
        
        # Double SHA-256 for checksum
        hex_str = bytearray.fromhex(modified_script_hash)
        sha = hashlib.sha256()
        sha.update(hex_str)
        sha_2 = hashlib.sha256()
        sha_2.update(sha.digest())
        
        # Get checksum (first 4 bytes)
        checksum = sha_2.hexdigest()[:8]
        
        # Combine version, script hash, and checksum
        byte_address = modified_script_hash + checksum
        
        # Base58 encode
        address = base58.b58encode(bytes(bytearray.fromhex(byte_address))).decode('utf-8')
        return address
    except Exception as e:
        raise ValueError(f"Error creating P2SH Bitcoin address: {str(e)}")

def create_segwit_address(public_key_compressed: str) -> str:
    """Create SegWit Bitcoin address (P2WPKH/Bech32) from compressed public key.
    
    Args:
        public_key_compressed (str): Compressed public key in hexadecimal format
        
    Returns:
        str: SegWit Bitcoin address (bech32)
        
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
        key_hash = rip.digest()
        
        # Create nested P2SH-P2WPKH address (simplified version)
        # Note: For a complete implementation, Bech32 encoding should be used
        # This is a simplified version that creates P2SH-wrapped SegWit address
        
        # Create redeem script (OP_0 <20-byte-key-hash>)
        redeem_script = b"\\x00\\x14" + key_hash
        
        # Hash the redeem script
        sha = hashlib.sha256()
        sha.update(redeem_script)
        rip = hashlib.new('ripemd160')
        rip.update(sha.digest())
        script_hash = rip.digest()
        
        # Add version byte (0x05 for P2SH mainnet)
        p2sh_bytes = b"\\x05" + script_hash
        
        # Double SHA-256 for checksum
        sha = hashlib.sha256()
        sha.update(p2sh_bytes)
        sha_2 = hashlib.sha256()
        sha_2.update(sha.digest())
        
        # Get checksum (first 4 bytes)
        checksum = sha_2.digest()[:4]
        
        # Combine version, script hash, and checksum
        address_bytes = p2sh_bytes + checksum
        
        # Base58 encode
        address = base58.b58encode(address_bytes).decode('utf-8')
        return address
    except Exception as e:
        raise ValueError(f"Error creating SegWit Bitcoin address: {str(e)}")

def validate_address(address: str) -> bool:
    """Validate Bitcoin address format and checksum (P2PKH).
    
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

def validate_p2sh_address(address: str) -> bool:
    """Validate P2SH Bitcoin address format and checksum.
    
    Args:
        address (str): P2SH Bitcoin address to validate
        
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
        script_hash = hex_str[2:-8]
        checksum = hex_str[-8:]
        
        # Verify version
        if version != "05":
            return False
            
        # Verify checksum
        hex_str = bytearray.fromhex(version + script_hash)
        sha = hashlib.sha256()
        sha.update(hex_str)
        sha_2 = hashlib.sha256()
        sha_2.update(sha.digest())
        
        if sha_2.hexdigest()[:8] != checksum:
            return False
            
        return True
    except Exception:
        return False

def validate_segwit_address(address: str) -> bool:
    """Validate SegWit Bitcoin address format.
    
    Args:
        address (str): SegWit Bitcoin address to validate
        
    Returns:
        bool: True if address is valid, False otherwise
    """
    # Simplified validation for P2SH-wrapped SegWit addresses
    # For proper validation, we should implement Bech32 validation
    return validate_p2sh_address(address)