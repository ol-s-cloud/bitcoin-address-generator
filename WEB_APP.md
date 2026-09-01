# Entropy Lab Web App

A lightweight static web interface layered on top of the existing Bitcoin Address Generator repository.

## Tools

### Random Generator
Uses the browser Web Crypto API to generate:
- cryptographically strong hexadecimal values
- random byte sequences
- unbiased random integers within a selected range
- UUID v4 values

### Bitcoin Address Lab
An educational visualization of the path from a 256-bit private key to a legacy Bitcoin P2PKH address:

1. Generate or provide a valid 32-byte private key.
2. Derive the compressed secp256k1 public key.
3. Apply SHA-256 followed by RIPEMD-160 (HASH160).
4. Add the Bitcoin mainnet version byte.
5. Add the Base58Check checksum.
6. Encode the payload as a legacy P2PKH address.

## Safety

The Bitcoin Address Lab is intentionally educational. It is not a production wallet, does not provide wallet backup guarantees, and generated addresses should not be funded.

## Architecture

The web app is static HTML, CSS and JavaScript. Randomness is generated locally. Bitcoin public-key operations and hashing are loaded as pinned browser modules from the Noble cryptography packages.

## Historical notebook

`How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb` is deliberately preserved untouched. The web interface is an additional layer around the existing repository rather than a rewrite of that notebook.

## Vercel

The repository root can be deployed directly as a static site. No build command, server, database, authentication or environment variables are required.
