"""
Command-line interface for Bitcoin Address Generator.
"""

import click
from bitcoin_address_generator.core.keys import generate_private_key, get_public_key, get_compressed_public_key
from bitcoin_address_generator.core.address import create_address, validate_address

@click.group()
def cli():
    """Bitcoin Address Generator CLI"""
    pass

@cli.command()
@click.option('--private-key', help='Use existing private key (optional)')
@click.option('--output', '-o', type=click.File('w'), help='Output file (optional)')
def generate(private_key, output):
    """Generate a new Bitcoin address."""
    try:
        if not private_key:
            private_key = generate_private_key()
            click.echo(f"Generated private key: {private_key}")
        
        public_key = get_public_key(private_key)
        click.echo(f"Public key: {public_key}")
        
        compressed_public_key = get_compressed_public_key(public_key)
        click.echo(f"Compressed public key: {compressed_public_key}")
        
        address = create_address(compressed_public_key)
        click.echo(f"Bitcoin address: {address}")
        
        if output:
            output.write(f"Private key: {private_key}\n")
            output.write(f"Public key: {public_key}\n")
            output.write(f"Compressed public key: {compressed_public_key}\n")
            output.write(f"Bitcoin address: {address}\n")
            click.echo(f"Output written to {output.name}")
            
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        exit(1)

@cli.command()
@click.argument('address')
def validate(address):
    """Validate a Bitcoin address."""
    try:
        is_valid = validate_address(address)
        if is_valid:
            click.echo(f"Address {address} is valid")
        else:
            click.echo(f"Address {address} is invalid")
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        exit(1)

if __name__ == '__main__':
    cli()