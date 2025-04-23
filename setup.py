from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="bitcoin_address_generator",  # Changed from hyphen to underscore
    version="0.2.0",
    author="ol-s-cloud",
    author_email="gs_wl889@icloud.com",
    description="A Python package for generating Bitcoin addresses using ECDSA",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/ol-s-cloud/bitcoin-address-generator",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Security :: Cryptography",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "ecdsa>=0.18.0",
        "base58>=2.1.1",
        "click>=8.0.0",
        "qrcode>=7.3.1",  # Added for QR code generation
        "cryptography>=37.0.0",  # Added for key encryption
    ],
    entry_points={
        "console_scripts": [
            "bitcoin-address-generator=bitcoin_address_generator.cli.main:cli",  # Updated to use cli group
        ],
    },
)