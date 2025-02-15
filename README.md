# Bitcoin Address Generator

A Python package for generating Bitcoin addresses using the Elliptic Curve Digital Signature Algorithm (ECDSA).

## Introduction

This repository explores the use of randomly generated hexadecimal numbers to create Bitcoin wallet addresses using the Elliptic Curve Digital Signature Algorithm (ECDSA). When Alice wants to buy a book from Bob, after all has been agreed upon, Bob needs to provide Alice with a bitcoin wallet address where the payments will be deposited. The transaction will be done on the blockchain, so Bob needs a bitcoin wallet address to receive payments.

In cryptography, the ECDSA offers a variant of the Digital Signature Algorithm (DSA) which uses elliptic-curve cryptography.

## Method

The process involves several cryptographic steps:

1. Private Key Generation
   - Generate a random 256-bit private key
   - Encode it as a 64-character hexadecimal string

2. Public Key Creation
   - Apply ECDSA using the secp256k1 curve
   - Convert private key to public key pair

3. Address Generation
   - Perform SHA-256 hashing
   - Apply RIPEMD-160 hashing
   - Add version byte
   - Calculate checksum
   - Encode in Base58Check format

## Installation
Coming soon.

## Usage
Documentation in progress.

## Security
This package is for educational purposes. Never use generated addresses with real Bitcoin without proper security review.

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
For any queries: gs_wl889@icloud.com