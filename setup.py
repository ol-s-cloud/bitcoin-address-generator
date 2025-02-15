from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="bitcoin-address-generator",
    version="0.1.0",
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
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Topic :: Security :: Cryptography",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.7",
    install_requires=[
        "ecdsa>=0.18.0",
        "base58>=2.1.1",
        "click>=8.0.0",
    ],
    entry_points={
        "console_scripts": [
            "bitcoin-address-generator=bitcoin_address_generator.cli.main:generate_address",
        ],
    },
)