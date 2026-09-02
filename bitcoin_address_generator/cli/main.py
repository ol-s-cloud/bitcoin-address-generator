"""COBRA command-line interface.

Experimental/testnet-first developer interface for local Bitcoin address work.
Transaction construction/signing is intentionally not implemented yet.
"""

import hashlib
import os
import sys
import click
import base58

from bitcoin_address_generator.core.keys import (
    generate_private_key,
    get_public_key,
    get_compressed_public_key,
)

__version__ = "0.3.0"
NETWORK_VERSION = {"mainnet": b"\x00", "testnet": b"\x6f"}


def _p2pkh_address(compressed_public_key: str, network: str) -> str:
    pub = bytes.fromhex(compressed_public_key)
    sha = hashlib.sha256(pub).digest()
    ripe = hashlib.new("ripemd160", sha).digest()
    payload = NETWORK_VERSION[network] + ripe
    checksum = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4]
    return base58.b58encode(payload + checksum).decode("ascii")


def _validate_p2pkh(address: str, network: str) -> bool:
    try:
        raw = base58.b58decode(address)
        if len(raw) != 25 or raw[:1] != NETWORK_VERSION[network]:
            return False
        payload, checksum = raw[:-4], raw[-4:]
        expected = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4]
        return checksum == expected
    except Exception:
        return False


@click.group(context_settings={"help_option_names": ["-h", "--help"]})
@click.version_option(__version__, prog_name="COBRA CLI")
def cli():
    """COBRA — Cryptographic Oracle for Bytes, Randomness & Addresses.

    Experimental developer CLI. Testnet is the default network.
    """


@cli.command()
def status():
    """Show current CLI capability and security boundary."""
    click.echo("COBRA CLI 0.3.0 // EXPERIMENTAL")
    click.echo("Default network: testnet")
    click.echo("Available: random, generate, derive, validate, status")
    click.echo("Not available: PSBT construction, signing, broadcast, seed wallets")
    click.echo("Secrets are processed locally by this CLI.")
    click.echo("Do not use experimental output for material funds.")


@cli.command("random")
@click.option("--bytes", "byte_count", default=32, type=click.IntRange(1, 4096), show_default=True)
@click.option("--format", "fmt", type=click.Choice(["hex", "int"]), default="hex", show_default=True)
def random_value(byte_count, fmt):
    """Generate cryptographically secure local randomness."""
    value = os.urandom(byte_count)
    click.echo(value.hex() if fmt == "hex" else int.from_bytes(value, "big"))


@cli.command()
@click.option("--network", type=click.Choice(["testnet", "mainnet"]), default="testnet", show_default=True)
@click.option("--private-key", help="Use an existing 64-character hexadecimal private key.")
@click.option("--show-secret", is_flag=True, help="Print the private key to the terminal. Avoid shell logging/history exposure.")
@click.option("--secret-output", type=click.Path(dir_okay=False, writable=True), help="Write the private key to a local file instead of printing it.")
def generate(network, private_key, show_secret, secret_output):
    """Generate a key locally and derive a legacy P2PKH address."""
    private_key = private_key or generate_private_key()
    try:
        public_key = get_public_key(private_key)
        compressed = get_compressed_public_key(public_key)
        address = _p2pkh_address(compressed, network)
    except Exception as exc:
        raise click.ClickException(str(exc))

    click.echo(f"Network: {network}")
    click.echo(f"Compressed public key: {compressed}")
    click.echo(f"P2PKH address: {address}")

    if secret_output:
        with open(secret_output, "w", encoding="utf-8") as handle:
            handle.write(private_key + "\n")
        click.echo(f"Private key written locally to: {secret_output}")
    elif show_secret:
        click.echo(f"Private key: {private_key}")
    else:
        click.echo("Private key hidden. Use --show-secret or --secret-output only in a trusted local environment.")

    if network == "mainnet":
        click.echo("WARNING: mainnet derivation is experimental; COBRA CLI is not yet a production wallet.", err=True)


@cli.command()
@click.argument("private_key")
@click.option("--network", type=click.Choice(["testnet", "mainnet"]), default="testnet", show_default=True)
def derive(private_key, network):
    """Derive a P2PKH address from an existing local private key."""
    try:
        public_key = get_public_key(private_key)
        compressed = get_compressed_public_key(public_key)
        address = _p2pkh_address(compressed, network)
    except Exception as exc:
        raise click.ClickException(str(exc))
    click.echo(f"Network: {network}")
    click.echo(f"Compressed public key: {compressed}")
    click.echo(f"P2PKH address: {address}")


@cli.command()
@click.argument("address")
@click.option("--network", type=click.Choice(["testnet", "mainnet"]), default="testnet", show_default=True)
def validate(address, network):
    """Validate a legacy P2PKH address checksum for the selected network."""
    valid = _validate_p2pkh(address, network)
    click.echo("valid" if valid else "invalid")
    if not valid:
        sys.exit(1)


if __name__ == "__main__":
    cli()
