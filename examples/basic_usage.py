"""
Basic usage example of the Bitcoin Address Generator package.
"""

from bitcoin_address_generator import generate_wallet
from bitcoin_address_generator.core.address import validate_address

def main():
    # Generate a new wallet
    print("Generating new Bitcoin wallet...")
    private_key, public_key, address = generate_wallet()
    
    print(f"\nPrivate Key (keep this secret!):")
    print(private_key)
    
    print(f"\nPublic Key:")
    print(public_key)
    
    print(f"\nBitcoin Address:")
    print(address)
    
    # Validate the generated address
    is_valid = validate_address(address)
    print(f"\nAddress is valid: {is_valid}")
    
    # Use existing private key
    print("\nUsing existing private key...")
    existing_key = "7b0cda14ab09ebeceb460d47b92f959f02540436c98147a81bd07700ea6a9e6a"
    _, _, address = generate_wallet(private_key=existing_key)
    print(f"Generated address: {address}")

if __name__ == "__main__":
    main()