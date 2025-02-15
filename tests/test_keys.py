"""
Test suite for key generation and management functionality.
"""

import pytest
from bitcoin_address_generator.core.keys import (
    generate_private_key,
    get_public_key,
    get_compressed_public_key
)

def test_private_key_generation():
    """Test private key generation."""
    private_key = generate_private_key()
    assert len(private_key) == 64
    # Verify it's a valid hex string
    int(private_key, 16)

def test_private_key_to_public():
    """Test conversion of private key to public key."""
    # Known test vector
    private_key = "7b0cda14ab09ebeceb460d47b92f959f02540436c98147a81bd07700ea6a9e6a"
    public_key = get_public_key(private_key)
    
    assert public_key.startswith('04')
    assert len(public_key) == 130

def test_public_key_compression():
    """Test public key compression."""
    private_key = generate_private_key()
    public_key = get_public_key(private_key)
    compressed = get_compressed_public_key(public_key)
    
    assert compressed.startswith(('02', '03'))
    assert len(compressed) == 66

def test_invalid_private_key():
    """Test handling of invalid private key."""
    with pytest.raises(ValueError):
        get_public_key("invalid")

def test_invalid_public_key():
    """Test handling of invalid public key."""
    with pytest.raises(ValueError):
        get_compressed_public_key("invalid")

def test_consistent_key_generation():
    """Test that same private key generates same public key."""
    private_key = generate_private_key()
    public_key1 = get_public_key(private_key)
    public_key2 = get_public_key(private_key)
    
    assert public_key1 == public_key2