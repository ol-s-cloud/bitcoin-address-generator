# Bitcoin Address Generator

[![PyPI version](https://badge.fury.io/py/bitcoin-address-generator.svg)](https://badge.fury.io/py/bitcoin-address-generator)
[![Python Package](https://github.com/ol-s-cloud/bitcoin-address-generator/actions/workflows/python-package.yml/badge.svg)](https://github.com/ol-s-cloud/bitcoin-address-generator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Introduction
This repository explores the use of randomly generated hexadecimal numbers to create a bitcoin wallet address using the Elliptic Curve Digital Signature Algorithm (ECDSA). When Alice wants to buy a book from Bob, after all has been agreed upon, Bob needs to provide Alice with a bitcoin wallet address where the payments will be deposited. The transaction will be done on the blockchain, so Bob needs a bitcoin wallet address to receive payments. This repository covers how a bitcoin wallet address can be created from randomly generated private keys.

In cryptography, the Elliptic Curve Digital Signature Algorithm (ECDSA) offers a variant of the Digital Signature Algorithm (DSA) which uses elliptic-curve cryptography.

## Method
Bob signs a hash of a message with his private key, and then Alice proves with his public key. Bob also uses a random nonce value for the signature (K)

![ecdsa_new](https://github.com/ol-s-cloud/bitcoin-address-generator/assets/134246135/3311cd8a-cebb-465e-bea8-91fcf7ffb39d)

With ECDSA, Alice will sign a message with her private key, and then Bob will use her public key to verify that she signed the message (and that the message has not changed)
![ecdsa](https://github.com/ol-s-cloud/bitcoin-address-generator/assets/134246135/e062bc0a-fc16-4203-a0fa-c0844cb995df)

The diagram below illustrates the architecture and how the Bitcoin wallet addresses are created:

![Architecture](https://github.com/ol-s-cloud/bitcoin-address-generator/assets/134246135/5c530686-c50a-4a00-bce7-3d1be3462d99)

## Features
- Generate random private keys
- Convert private keys to public keys using ECDSA
- Create valid Bitcoin addresses
- Comprehensive validation and error handling
- Command-line interface
- Well-documented API

## Setting Up Environment
To achieve the desired outcome, first we need to set up the environment. For development purposes, you can use:
1. Google Colab environment - https://colab.research.google.com/
2. Local Python environment
3. Package installation via pip (see Installation section)

For getting randomly generated private keys, you can use:
- Random generation within the package
- Private keys from wallet addresses created via https://www.bitaddress.org
- Other hex generators like https://www.browserling.com/tools/random-hex

Note: For production use, always ensure secure methods of private key generation.

## Python Libraries & Dependencies

• **ECDSA Python Library** - Implementation of the Elliptic Curve Cryptography
• **Hashlib** - Contains hash algorithms for SHA256, RIPEMD160
• **Codecs** - For encoding and decoding
• **Base58** - For Base58Check encoding

## Installation

```bash
pip install bitcoin-address-generator
```

## Quick Start

```python
from bitcoin_address_generator import generate_wallet

# Generate new wallet
private_key, public_key, address = generate_wallet()
print(f"Bitcoin Address: {address}")

# Use existing private key
address = generate_wallet(private_key="your-private-key")
```

## Command Line Usage

```bash
# Generate new address
bitcoin-address-generator

# Use existing private key
bitcoin-address-generator --private-key YOUR_PRIVATE_KEY
```

## Documentation
- [Technical Implementation Guide](docs/TECHNICAL.md)
- [API Reference](docs/API.md)
- [Security Considerations](docs/SECURITY.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Jupyter Notebook Tutorial](https://colab.research.google.com/drive/1d26u6FgGqRcBdL1_Bc6FwLfKJ2c6lWJ3)

## Roadmap

### v0.1.0 (Current)
- Basic Bitcoin address generation
- Command-line interface
- Core cryptographic operations
- Basic validation and error handling

### v0.2.0 (Planned)
- Web interface implementation
- Interactive address generation
- QR code generation
- Private key encryption
- Bulk address generation

### v0.3.0 (Planned)
- RESTful API service
- API key authentication
- Rate limiting
- Swagger documentation
- Multi-language SDKs

### v0.4.0 (Planned)
- Multi-cryptocurrency support
- HD wallet implementation (BIP32, BIP39, BIP44)
- Advanced address validation
- Balance checking
- Transaction history

## Changelog

### v0.1.0 (2025-02-15)
- Initial release
- Basic Bitcoin address generation
- Command-line interface
- Core cryptographic functions
- Basic documentation

## Feedback
If you have any feedback, please reach out to me at gs_wl889@icloud.com

## Contributing
Contributions are always welcome!

See `CONTRIBUTING.md` for ways to get started.

Please adhere to this project's `CODE_OF_CONDUCT.md`.

## Love to read more? Here are some resources & references
- [Bitcoin Technical Document](https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses)
- [List of Addresses Prefixes](https://en.bitcoin.it/wiki/List_of_address_prefixes)
- [Elliptic Curve Digital Signature Algorithm](https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm)
- [ECDSA Python Library](https://pypi.org/project/ecdsa/)
- [SEC2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)
- [Efficient and Secure ECDSA Algorithm Survey](https://www.researchgate.net/publication/331397446_Efficient_and_Secure_ECDSA_Algorithm_and_its_Applications_A_Survey)

## Security
This package is for educational purposes. Never use generated addresses with real Bitcoin without proper security review. See [SECURITY.md](SECURITY.md) for important security considerations.

## License
[MIT](https://choosealicense.com/licenses/mit/)