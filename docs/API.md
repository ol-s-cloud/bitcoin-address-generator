# API Documentation

## Core Functions

### generate_wallet
```python
def generate_wallet(private_key: str = None) -> Tuple[str, str, str]:
    """
    Generate a new Bitcoin wallet or use existing private key.
    
    Args:
        private_key (str, optional): Existing private key in hexadecimal format
        
    Returns:
        Tuple[str, str, str]: (private_key, public_key, address)
        
    Raises:
        ValueError: If provided private key is invalid
    """
```

### Key Management

#### generate_private_key
```python
def generate_private_key() -> str:
    """
    Generate a random private key.
    
    Returns:
        str: 64-character hexadecimal private key
    """
```

#### get_public_key
```python
def get_public_key(private_key: str) -> str:
    """
    Convert private key to public key using ECDSA.
    
    Args:
        private_key (str): 64-character hexadecimal private key
        
    Returns:
        str: Public key in hexadecimal format
        
    Raises:
        ValueError: If private key is invalid
    """
```

#### get_compressed_public_key
```python
def get_compressed_public_key(public_key: str) -> str:
    """
    Get compressed public key.
    
    Args:
        public_key (str): Uncompressed public key
        
    Returns:
        str: Compressed public key
        
    Raises:
        ValueError: If public key is invalid
    """
```

### Address Operations

#### create_address
```python
def create_address(public_key_compressed: str) -> str:
    """
    Create Bitcoin address from compressed public key.
    
    Args:
        public_key_compressed (str): Compressed public key in hexadecimal format
        
    Returns:
        str: Bitcoin address
        
    Raises:
        ValueError: If public key is invalid
    """
```

#### validate_address
```python
def validate_address(address: str) -> bool:
    """
    Validate Bitcoin address format and checksum.
    
    Args:
        address (str): Bitcoin address to validate
        
    Returns:
        bool: True if address is valid, False otherwise
    """
```

## Command Line Interface

### generate
```bash
bitcoin-address-generator generate [--private-key KEY] [--output FILE]
```

Options:
- `--private-key`: Use existing private key (optional)
- `--output`: Save output to file (optional)

### validate
```bash
bitcoin-address-generator validate ADDRESS
```

Validates the given Bitcoin address.

## Examples

### Generate New Wallet
```python
from bitcoin_address_generator import generate_wallet

private_key, public_key, address = generate_wallet()
print(f"Bitcoin Address: {address}")
```

### Use Existing Private Key
```python
from bitcoin_address_generator import generate_wallet

private_key = "7b0cda14ab09ebeceb460d47b92f959f02540436c98147a81bd07700ea6a9e6a"
_, _, address = generate_wallet(private_key=private_key)
print(f"Bitcoin Address: {address}")
```

### Validate Address
```python
from bitcoin_address_generator.core.address import validate_address

address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
is_valid = validate_address(address)
print(f"Address is valid: {is_valid}")
```