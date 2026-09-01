# COBRA

**Cryptographic Oracle for Bytes, Randomness & Addresses**

COBRA is a free, open-source browser micro-product layered on top of the existing Bitcoin Address Generator repository.

## Current tools

### Random Generator
Uses the browser Web Crypto API to generate cryptographically strong hexadecimal values, random bytes, unbiased integers and UUID v4 values.

### Bitcoin Address Generator
An educational visualization of the path from a 256-bit private key to a legacy Bitcoin P2PKH address:

1. Generate or provide a valid 32-byte private key.
2. Derive the compressed secp256k1 public key.
3. Apply SHA-256 followed by RIPEMD-160 (HASH160).
4. Add the Bitcoin mainnet version byte.
5. Add the Base58Check checksum.
6. Encode the payload as a legacy P2PKH address.
7. Represent the same private key as compressed-mainnet Wallet Import Format (WIF) for educational recovery/import demonstrations.

## Where an address exists

Creating an address does not create an account on a COBRA server or register the address with Bitcoin. An address is derived from cryptographic material. If bitcoin is later sent to that address, the transaction/output becomes part of Bitcoin's distributed ledger. Spending authority depends on possession of the corresponding private key.

Compatible wallet software may import or sweep a private key, commonly represented as WIF. COBRA does not retain recovery copies.

## Historical provenance

The project originated as the Python/Google Colab notebook `How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb`. The notebook is deliberately preserved untouched. Its Git history records original authorship in August 2023. The modern web interface is an additional implementation and presentation layer around that research lineage.

The original notebook explores hexadecimal private keys, ECDSA/secp256k1, public-key compression, SHA-256, RIPEMD-160 and Base58 encoding. The repository later evolved into a Python package. COBRA exposes the same core ideas interactively in the browser.

## References

- Bitcoin Developer Guide — Wallets: https://developer.bitcoin.org/devguide/wallets.html
- Bitcoin Developer Reference — Transactions / address conversion: https://developer.bitcoin.org/reference/transactions.html
- Bitcoin Wiki — Wallet Import Format: https://en.bitcoin.it/wiki/Wallet_import_format
- Original COBRA research notebook: `How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb`

## Safety

COBRA is an educational cryptography tool, not a production wallet. Human-selected numbers should not be treated as secure entropy. Do not paste real private keys into web tools or fund demonstration addresses.

## Scope

COBRA currently ships randomness utilities and Bitcoin address derivation. Other cryptographic or blockchain utilities may be added later, but are intentionally not advertised as current functionality.

## Deployment

The web layer is static HTML, CSS and JavaScript and can be deployed directly to Vercel. No database, authentication or environment variables are required for the current browser implementation.
