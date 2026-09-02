# COBRA CLI 0.3.0

**Status:** Alpha / experimental / testnet-first.

COBRA CLI exposes local Bitcoin address research tools from the terminal. It is not yet a production wallet or transaction signer.

## Install from source with pip

```bash
python -m venv .venv
source .venv/bin/activate  # macOS / Linux
# .venv\Scripts\activate  # Windows
pip install git+https://github.com/ol-s-cloud/bitcoin-address-generator.git
```

Then verify:

```bash
cobra --version
cobra status
```

## Current commands

```bash
cobra status
cobra random --bytes 32
cobra generate
cobra generate --network testnet
cobra derive <64-hex-private-key> --network testnet
cobra validate <address> --network testnet
```

`testnet` is the default network. Mainnet address derivation can be selected explicitly with `--network mainnet`, but the CLI remains experimental and should not be treated as a production wallet.

## Secret handling

Generated secrets are hidden by default. To explicitly reveal or write a private key locally:

```bash
cobra generate --network testnet --show-secret
cobra generate --network testnet --secret-output ./testnet-key.txt
```

Terminal history, logs, screen capture and compromised hosts can expose secrets. Never paste private keys, WIFs or seed phrases into AI-agent prompts, remote telemetry or public issue trackers.

## Available now

- cryptographically secure local randomness
- secp256k1 key derivation
- legacy P2PKH address generation
- testnet/mainnet network selection
- P2PKH checksum validation
- CLI status/version reporting

## Not available yet

- PSBT construction
- PSBT inspection/signing
- transaction broadcasting
- HD/seed wallets
- multisig orchestration
- hardware-wallet integration
- production custody guarantees

## Next milestone

The next CLI milestone is testnet/signet PSBT inspection and signing, followed by two-machine air-gapped testing. Mainnet transaction testing should only follow successful deterministic vectors, integration tests, reproducible builds and a security review.

The historical 2023 notebook remains a provenance artifact and is not modified by CLI development.
