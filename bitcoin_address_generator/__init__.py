from bitcoin_address_generator.core.keys import generate_private_key, get_public_key, get_compressed_public_key
from bitcoin_address_generator.core.address import create_address

__version__ = '0.1.0'

def generate_wallet(private_key=None):
    """Generate a new Bitcoin wallet or use existing private key."""
    if private_key is None:
        private_key = generate_private_key()
    public_key = get_public_key(private_key)
    compressed_public_key = get_compressed_public_key(public_key)
    address = create_address(compressed_public_key)
    return private_key, public_key, address