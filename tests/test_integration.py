"""
Integration tests for the Bitcoin Address Generator package.
"""

import pytest
from bitcoin_address_generator import generate_wallet
from bitcoin_address_generator.core.address import validate_address

def test_full_workflow():
    """Test complete workflow from private key to address."""
    # Generate new wallet
    private_key, public_key, address = generate_wallet()
    
    # Verify components
    assert len(private_key) == 64
    assert public_key.startswith('04')
    assert address.startswith('1')
    
    # Validate address
    assert validate_address(address)
    
    # Test with specific private key
    test_key = "7b0cda14ab09ebeceb460d47b92f959f02540436c98147a81bd07700ea6a9e6a"
    _, _, test_address = generate_wallet(private_key=test_key)
    assert validate_address(test_address)

def test_address_format():
    """Test address format requirements."""
    private_key, _, address = generate_wallet()
    
    # Address format checks
    assert len(address) >= 26
    assert len(address) <= 35
    assert address[0] == '1'  # Mainnet P2PKH address
    
    # Validate checksum
    assert validate_address(address)

def test_multiple_generations():
    """Test generating multiple addresses."""
    addresses = set()
    for _ in range(5):
        _, _, address = generate_wallet()
        # Ensure uniqueness
        assert address not in addresses
        addresses.add(address)
        # Validate each address
        assert validate_address(address)