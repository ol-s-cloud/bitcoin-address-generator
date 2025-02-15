"""
Test suite for Bitcoin address generation and validation.
"""

import pytest
from bitcoin_address_generator.core.keys import (
    generate_private_key,
    get_public_key,
    get_compressed_public_key
)
from bitcoin_address_generator.core.address import create_address, validate_address

def test_address_creation():
    """Test complete address creation process."""
    private_key = generate_private_key()
    public_key = get_public_key(private_key)
    compressed_public_key = get_compressed_public_key(public_key)
    address = create_address(compressed_public_key)
    
    assert address.startswith('1')
    assert len(address) >= 26 and len(address) <= 35

def test_address_validation():
    """Test address validation."""
    # Generate a valid address
    private_key = generate_private_key()
    public_key = get_public_key(private_key)
    compressed_public_key = get_compressed_public_key(public_key)
    address = create_address(compressed_public_key)
    
    assert validate_address(address) is True

def test_invalid_address():
    """Test invalid address detection."""
    invalid_addresses = [
        "1NOTAVALIDAddressShouldFail",
        "3NOTAVALIDAddressShouldFail",
        "bc1NOTAVALIDAddressShouldFail",
        "",
        "12345",
        "1" * 34,  # Wrong checksum
    ]
    
    for addr in invalid_addresses:
        assert validate_address(addr) is False

def test_known_address():
    """Test with known test vector."""
    # Known test vector
    compressed_public_key = "0250863ad64a87ae8a2fe83c1af1a8403cb53f53e486d8511dad8a04887e5b2352"
    address = create_address(compressed_public_key)
    assert validate_address(address) is True

def test_invalid_public_key():
    """Test handling of invalid public key in address creation."""
    with pytest.raises(ValueError):
        create_address("invalid")

def test_address_consistency():
    """Test that same public key generates same address."""
    private_key = generate_private_key()
    public_key = get_public_key(private_key)
    compressed_public_key = get_compressed_public_key(public_key)
    
    address1 = create_address(compressed_public_key)
    address2 = create_address(compressed_public_key)
    
    assert address1 == address2