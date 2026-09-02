# COBRA Offline Guide

COBRA can separate cryptographic signing from network access.

## Trust boundary

- **Offline machine:** entropy, private keys, signing, final human verification.
- **Online machine:** blockchain monitoring, fee/UTXO data, unsigned transaction construction, broadcasting.
- **Agents:** public-chain analysis and unsigned intent only. Never give an agent a private key, WIF or seed phrase.

## Address generation

Address derivation does not require internet access:

`entropy -> private key -> secp256k1 public key -> SHA-256 -> RIPEMD-160 -> version/checksum -> Base58Check address`

The historical research notebook in this repository is provenance and must remain untouched. Maintained offline/CLI code should live in separate files and releases.

## Terminal reference architecture

A future maintained COBRA CLI should expose commands such as:

```bash
cobra random --bytes 32
cobra bitcoin generate
cobra bitcoin derive --private-key <64-hex-characters>
cobra psbt inspect transaction.psbt
cobra psbt sign transaction.psbt --output signed.psbt
```

These command names document the intended interface; do not treat them as available until the CLI release implements and tests them.

For a truly offline installation, download a signed/checksummed release bundle or Python wheel on an online machine, verify it, transfer it to the air-gapped machine, and install locally. An air-gapped machine should not depend on live `pip` or CDN downloads.

## Offline transaction workflow

Bitcoin's PSBT format (BIP 174) is designed to allow a signer to operate offline.

1. Online/watch-only machine identifies spendable outputs and constructs an unsigned PSBT.
2. Transfer the PSBT to the offline signer using QR or controlled removable media.
3. Offline machine independently displays and verifies destination address, amount and fee.
4. Offline signer signs with the private key without exposing the key.
5. Return the signed PSBT/final transaction to the online machine.
6. Online machine broadcasts it to the Bitcoin peer-to-peer network.

## Cold storage

Cold storage reduces network attack surface by keeping controlling secrets away from network-connected systems. It does not remove physical, supply-chain, backup, entropy, malware or user-verification risks.

COBRA is currently educational/research software, not a custody-grade wallet. Transaction signing should remain experimental until covered by deterministic test vectors, pinned dependencies, reproducible builds and independent security review.

## Agents

Safe agent roles can include:

- monitor public addresses and confirmations;
- analyse fees and public blockchain conditions;
- prepare unsigned transaction intent/PSBTs;
- explain transaction fields before approval;
- alert on anomalies;
- coordinate developer APIs and research workflows.

Unsafe default: giving a remote agent/model the private key, seed phrase or WIF. Authorization should remain inside the trusted signing boundary, ideally with explicit human or hardware policy approval.

## References

- Bitcoin Core Offline Signing Tutorial: https://github.com/bitcoin/bitcoin/blob/master/doc/offline-signing-tutorial.md
- Bitcoin Core PSBT Howto: https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md
- BIP 174: https://bips.dev/174/
- Bitcoin Developer Guide, Wallets: https://developer.bitcoin.org/devguide/wallets.html
