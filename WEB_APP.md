# COBRA

**Cryptographic Oracle for Bytes, Randomness & Addresses**

**COBRA by ol-s-cloud** is a free, open-source Bitcoin cryptography micro-product built directly on the existing [Bitcoin Address Generator](https://github.com/ol-s-cloud/bitcoin-address-generator) research repository.

## Current product

### Random Generator
Browser-local generation of cryptographically strong hexadecimal values, random bytes, unbiased integers and UUID v4 values.

### Bitcoin Address Generator
Educational P2PKH derivation:
1. valid 256-bit private key
2. compressed secp256k1 public key
3. SHA-256 + RIPEMD-160 (HASH160)
4. Bitcoin mainnet version byte
5. double-SHA-256 checksum
6. Base58Check P2PKH address
7. compressed-mainnet Wallet Import Format (WIF)

COBRA also produces a downloadable recovery kit containing the user's current address and secret material. This file is created in the browser; COBRA does not retain a server-side recovery copy.

## Research presentation

The website deliberately exposes the technical lineage behind the tool rather than presenting address generation as a black box. It includes:

- a terminal-style view of the original Python package usage and derivation chain
- a secp256k1 elliptic-curve explainer and schematic
- ECDSA and address-architecture diagrams already present in the repository README
- explicit links back to the original source repository
- technical and academic references including SEC 2 elliptic-curve parameters, ECDSA documentation, Bitcoin technical references, the ECDSA Python library, and an ECDSA survey paper
- visible attribution throughout the interface as **COBRA by ol-s-cloud**

The hero uses the original repository address-architecture visual as a darkened background treatment so the product presentation remains visibly connected to the original work.

## Live activity and social proof

The website includes a real-time activity rail beside the tools. Each newly generated public address appears immediately with a relative timestamp such as `just now`, `6s ago`, or `2m ago`, plus a direct Blockchain.com Explorer link.

The rail also displays generated-address metrics for this browser and current session. It is intentionally labelled **Activity on this device** because v1 has no shared persistence backend and must not imply that local activity represents all COBRA users.

A future cross-user COBRA live feed can be added using a small persistent backend. That registry should be opt-in and store only public addresses, timestamps, derivation metadata and public explorer/on-chain status. It must never store private keys or WIF values.

Social controls include GitHub repository/star links, Share on X, and native recommend/share functionality.

## Secret handling

Private keys and WIF values are controlling secrets. COBRA's browser implementation keeps derivation local and does not intentionally transmit or store them. The public activity log stores only Bitcoin addresses, timestamps and address type in the user's browser localStorage.

## Explorer and logs

Each derived public address links directly to `https://www.blockchain.com/explorer/addresses/btc/<address>` for public Bitcoin-network inspection.

Generating an address is not an on-chain transaction. An address becomes observable through Bitcoin transaction data only when it participates in a transaction/output.

## Implementations

### Browser engine — live
JavaScript/Web Crypto plus pinned Noble cryptography packages. This is the currently deployed interactive engine and keeps private-key operations client-side.

### Original Python lineage — preserved
The repository's Python package and original Google Colab notebook implement the same core methodology using Python, ECDSA, hashlib and Base58. They remain source/research artifacts rather than a server-side private-key service.

## Historical provenance

`How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb` is deliberately preserved untouched. COBRA is a modern interface and product layer around that research lineage, not a replacement for the notebook.

The project originated during postgraduate study in Finance & Data Analytics as an exploration of blockchain technologies, cryptographic keys and Bitcoin address construction. This statement is not intended to imply university endorsement of COBRA.

## Developer access

COBRA does not yet expose a public production API. Developers, researchers and teams can contact the project to discuss future API/SDK access, integrations, licensing or research collaboration. Keeping access enquiry-based initially leaves room to design authentication, rate limits, safe cryptographic boundaries and commercial licensing before opening the API broadly.

Contact: `gs_wl889@icloud.com`

## References

- Bitcoin technical background for version 1 addresses: https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses
- Bitcoin ECDSA: https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm
- SEC 2 recommended elliptic curve domain parameters: https://www.secg.org/sec2-v2.pdf
- ECDSA Python library: https://pypi.org/project/ecdsa/
- ECDSA survey: https://www.researchgate.net/publication/331397446_Efficient_and_Secure_ECDSA_Algorithm_and_its_Applications_A_Survey
- Bitcoin Developer Guide — Wallets: https://developer.bitcoin.org/devguide/wallets.html
- Bitcoin Developer Reference — Transactions: https://developer.bitcoin.org/reference/transactions.html
- Bitcoin Wiki — Wallet Import Format: https://en.bitcoin.it/wiki/Wallet_import_format
- Blockchain.com Explorer: https://www.blockchain.com/explorer
- Original notebook: `How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb`

## Safety

COBRA is educational and experimental software. It may derive mathematically valid Bitcoin addresses, but it is not a production wallet, custodian, exchange, recovery service or financial service. Human-selected numbers should not be treated as secure entropy, and demonstration keys should not be used for material funds.

## Scope

COBRA is Bitcoin-only in v1. Additional networks and cryptographic utilities may be added later when they actually exist.

## Deployment

The current web layer is static HTML, CSS and JavaScript and can be deployed directly to Vercel using the **Other** framework preset. The repository also contains the original Python package, so Vercel may otherwise auto-detect Python. No database, authentication or environment variables are required for this version.