"""
Core functionality for Bitcoin address generation.
"""

from .keys import generate_private_key, get_public_key, get_compressed_public_key
from .address import create_address, validate_address

__all__ = [
    'generate_private_key',
    'get_public_key',
    'get_compressed_public_key',
    'create_address',
    'validate_address'
]