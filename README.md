# Bitcoin Address Generator

[![PyPI version](https://badge.fury.io/py/bitcoin-address-generator.svg)](https://badge.fury.io/py/bitcoin-address-generator)
[![Python Package](https://github.com/ol-s-cloud/bitcoin-address-generator/actions/workflows/python-package.yml/badge.svg)](https://github.com/ol-s-cloud/bitcoin-address-generator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ⚠️ Educational and Development Use Only
This package is intended for educational and development purposes. Do not use for production or with real Bitcoin transactions.

## Introduction
This repository demonstrates Bitcoin wallet address creation using the Elliptic Curve Digital Signature Algorithm (ECDSA). It provides tools for generating and managing Bitcoin addresses, ideal for learning about cryptocurrency fundamentals.

## Features
- Generate random private keys
- Convert private keys to public keys using ECDSA
- Create valid Bitcoin addresses
- Command-line interface
- Comprehensive validation
- Educational examples and documentation

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
```

## Command Line Usage
```bash
# Generate new address
bitcoin-address-generator generate

# Validate address
bitcoin-address-generator validate <address>
```

## Development Roadmap

### v0.1.0 (Current)
- Basic Bitcoin address generation
- Command-line interface
- Core cryptographic operations
- Educational documentation
- Test suite

### v0.2.0 (Planned)
- Support for different address types (P2SH, SegWit)
- Key encryption for secure storage
- QR code generation for addresses
- Bulk address generation
- Basic transaction signing

### v0.3.0 (Planned)
- HD wallet support (BIP32/39/44)
- Mnemonic phrase generation
- Multi-signature support
- Network validation
- Address balance checking

### v0.4.0 (Planned)
- Web interface
- API endpoint support
- Transaction history
- Address monitoring
- Automated testing with testnet

## Security
This package is for educational purposes. See [SECURITY.md](SECURITY.md) for important security considerations and limitations.

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on submitting pull requests.

## Documentation
- [Technical Guide](docs/TECHNICAL.md)
- [API Reference](docs/API.md)
- [Security Info](docs/SECURITY.md)

## Contact
For questions and support: gs_wl889@icloud.com

## License
MIT License - see [LICENSE](LICENSE)