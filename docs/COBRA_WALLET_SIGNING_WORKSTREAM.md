# COBRA Wallet & Signing Workstream

Status: **separate from the public experimental launch**

COBRA's current public product can generate cryptographic entropy, derive Bitcoin addresses and expose the corresponding private key/WIF to the user locally. This workstream covers the next custody lifecycle: creating, reviewing, signing and broadcasting transactions.

## Current boundary

Available now:
- local private-key generation
- secp256k1 public-key derivation
- Bitcoin P2PKH address derivation
- WIF export / recovery kit
- explorer links
- experimental CLI address tooling
- offline architecture documentation

Not yet implemented as a COBRA wallet:
- UTXO discovery and coin selection
- fee estimation
- transaction construction
- PSBT creation / inspection
- transaction signing
- PSBT finalisation
- broadcast
- HD seeds / BIP32 / BIP39 / BIP44
- multisig / threshold signing
- hardware signer integration

## Test-first trajectory

1. deterministic Bitcoin test vectors
2. Testnet/Signet transaction construction
3. PSBT inspection
4. explicit transaction review: destination, amount, fee, change
5. offline signing
6. online broadcast
7. recovery / sweep tests
8. dependency pinning and reproducible builds
9. independent security review
10. only then controlled mainnet experiments

## Agent boundary

Agents may observe public state, estimate fees, prepare unsigned transaction intent, explain transactions and request approval. Private keys, WIFs and seed phrases must remain outside prompts, telemetry and remote agent infrastructure.

## Ecosystem integration

Future wallet integrations should be network-specific. Bitcoin private keys and addresses should only be imported or swept by software that explicitly supports the relevant Bitcoin address/key format. EVM wallets and other blockchain wallets use different network rules and should be integrated through explicit adapters rather than assuming keys or address formats are interchangeable.

## Product principle

**Agents can reason. Keys authorize.**
