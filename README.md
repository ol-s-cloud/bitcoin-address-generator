# COBRA

<p align="center">
  <img src="assets/cobra-hero.jpg" alt="COBRA" width="900">
</p>

**Electricity, site and compute analysis.**

> **Project status:** Active development · **Version:** `0.3.0-alpha`

COBRA integrates electricity-system, market, site and compute data for monitoring, economic analysis and site-level decision support.

The public repository contains inspectable software, reference implementations, cryptographic utilities, public interfaces and developer tooling. Hosted customer infrastructure, customer data and protected analytical components are maintained separately.

> **Project lineage:** COBRA began as a university cryptography project focused on Bitcoin address generation and subsequently expanded into compute and energy intelligence. Earlier public deployments, repository paths and documentation remain available as part of the project record while current pages are progressively aligned with the present platform. See the [archived original README](archive/README-bitcoin-address-generator-2025.md), [Project Provenance](docs/PROVENANCE.md) and [Technical Overview](docs/TECHNICAL.md).

[Website](https://cobra-protocol.org) · [Explorer](https://cobra-protocol.org/explorer.html) · [Research](https://cobra-protocol.org/research.html) · [Technical](docs/TECHNICAL.md) · [Legacy README](archive/README-bitcoin-address-generator-2025.md) · [Provenance](docs/PROVENANCE.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python Package](https://github.com/ol-s-cloud/bitcoin-address-generator/actions/workflows/python-package.yml/badge.svg)](https://github.com/ol-s-cloud/bitcoin-address-generator/actions)

---

## System overview

| Layer | Current role |
| --- | --- |
| **External data** | Grid, market, tariff, property, weather, Bitcoin-network and mining-market inputs |
| **Site data** | Tariffs, meters, assets, capacity limits and operating assumptions |
| **Data layer** | Acquisition, normalisation, timestamps, units and availability state |
| **Analysis** | Engineering calculations, economic models and site-level evaluation |
| **Applications** | Explorer, COBRA Home and COBRA Mining |
| **Developer interfaces** | Public APIs, CLI, local tooling and reproducible technical interfaces |
| **Cryptographic utilities** | Bitcoin-oriented address generation, validation and offline/local workflows |

COBRA separates external observations, site-specific inputs and calculated outputs. Provider data is normalised before use by higher-level calculations. Missing or unavailable inputs are represented through explicit availability states.

Detailed architecture is maintained in the [Technical Overview](docs/TECHNICAL.md).

---

## Developer access

### Git

```bash
git clone https://github.com/ol-s-cloud/bitcoin-address-generator.git
cd bitcoin-address-generator
```

### Python / COBRA CLI

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .

cobra --version
cobra status
```

Current CLI commands include:

```bash
cobra status
cobra random --bytes 32
cobra generate
cobra generate --network testnet
cobra validate <address> --network testnet
```

The CLI is currently `0.3.0-alpha` and testnet-first. Full usage is documented in the [CLI Guide](docs/CLI.md).

### Web / Node.js

```bash
npm install
npm test
```

Database-backed routes use the server-side environment configuration documented in [`.env.example`](.env.example).

---

## Components

| Component | Function |
| --- | --- |
| **Explorer** | Public electricity, Bitcoin/network and compute-related indicators |
| **COBRA Home** | Household and property-level energy analysis |
| **COBRA Mining** | ASIC/site configuration, facility modelling and mining economics |
| **Cryptographic utilities** | Bitcoin-oriented address and cryptographic tooling |
| **Offline tools** | Local cryptographic workflows |
| **CLI** | Developer and cryptographic command-line interface |
| **Public APIs** | Programmatic access to released functions and data interfaces |
| **Research interfaces** | Reproducible public technical and analytical work |

---

## Data sources

COBRA uses provider-specific adapters around a common internal data model.

| Source | Data |
| --- | --- |
| **NESO** | Great Britain electricity-system conditions |
| **Elexon** | Balancing and electricity-market data |
| **Octopus Energy** | Consented customer tariff and consumption data |
| **EPC** | Building energy-performance information |
| **PVGIS** | Solar-resource and photovoltaic estimates |
| **Bitcoin network sources** | Network and blockchain observations |
| **Mining-market sources** | SHA-256 hashprice and related mining metrics |
| **Manufacturer specifications** | Equipment characteristics |
| **Site inputs** | Tariffs, capacity, assets and operating assumptions |
| **FX sources** | Currency-normalised calculations |

Source metadata, timestamps, units and availability states are preserved through the analysis pipeline.

---

## Mining reference model

COBRA Mining combines site and market inputs including:

```text
ASIC specification
+ quantity
+ site power limit
+ electricity rate
+ facility PUE
+ pool fee
+ operating cost
+ hashprice
+ FX
```

Calculated outputs include active hashrate, facility power, electricity consumption, gross revenue, electricity cost, operating profit, operating margin, break-even electricity rate and site capacity.

Site profitability calculations combine market information with site-specific operating assumptions.

---

## Technical stack

The public repository contains components implemented across:

- Python package and command-line tooling;
- browser-based JavaScript, HTML and CSS;
- Node.js server-side and API components;
- PostgreSQL-backed hosted functionality;
- external data-provider adapters;
- automated Node.js and Python testing;
- GitHub Actions continuous integration.

---

## Engineering standards and frameworks

COBRA uses established standards and frameworks as engineering references across information security, energy management, software assurance and AI-enabled components.

| Reference | Scope |
| --- | --- |
| **ISO/IEC 27001:2022** | Information-security management |
| **ISO 50001:2018** | Energy-management systems and energy-performance improvement |
| **ISO/IEC 42001:2023** | AI management for applicable AI/ML components |
| **NIST Cybersecurity Framework 2.0** | Cybersecurity risk management |
| **OWASP ASVS 5.0** | Web and application security verification |
| **IEC 62443 series** | Industrial and operational-technology cybersecurity |

These references guide engineering and governance work. Formal certification and conformity status are reported separately following assessment.

---

## Repository boundary

This repository is the public upstream and provenance record for COBRA.

The public repository includes public interfaces, cryptographic utilities, documented schemas, public-data integrations, reference calculations, CLI tooling and reproducible technical examples.

Production credentials, customer datasets, customer infrastructure and protected analytical implementations are maintained within their respective private environments.

See [Technical Overview](docs/TECHNICAL.md), [Security](SECURITY.md) and [Project Provenance](docs/PROVENANCE.md).

---

## Repository provenance and previous scope

COBRA originated from the `ol-s-cloud/bitcoin-address-generator` repository. The original cryptographic implementation, notebook, earlier deployments and Git history remain part of the project's public development record.

Historical material includes:

- [Archived Bitcoin Address Generator README](archive/README-bitcoin-address-generator-2025.md)
- [Pre-COBRA README](archive/README-pre-COBRA-2026.md)
- [Project Provenance](docs/PROVENANCE.md)
- [Original Bitcoin-address notebook](How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb)
- [Legacy technical guide](archive/TECHNICAL-bitcoin-address-generator-2025.md)

Some retained public pages still reflect the earlier cryptography and Bitcoin-focused scope. These materials remain accessible for continuity and provenance while the active website, documentation and interfaces are updated around COBRA's current energy and compute work.

---

## Documentation

| Reference | Scope |
| --- | --- |
| [Technical Overview](docs/TECHNICAL.md) | Architecture, data model and engineering concepts |
| [API Reference](docs/API.md) | Public package interfaces |
| [CLI Guide](docs/CLI.md) | Command-line tooling |
| [Offline Guide](COBRA_OFFLINE_GUIDE.md) | Local cryptographic workflow |
| [Web Application](WEB_APP.md) | Public web implementation |
| [Project Provenance](docs/PROVENANCE.md) | Repository lineage and retained history |
| [Legacy README](archive/README-bitcoin-address-generator-2025.md) | Earlier Bitcoin Address Generator scope |
| [Security](SECURITY.md) | Security policy and disclosure |
| [Contributing](CONTRIBUTING.md) | Contribution process |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community participation |

---

## References

Primary external references include:

- [National Energy System Operator](https://www.neso.energy/)
- [Elexon](https://www.elexon.co.uk/)
- [Octopus Energy Developer API](https://developer.octopus.energy/)
- [European Commission JRC PVGIS](https://re.jrc.ec.europa.eu/pvg_tools/en/)
- [Bitcoin Core](https://bitcoincore.org/)
- [ISO/IEC 27001:2022](https://www.iso.org/standard/27001)
- [ISO 50001:2018](https://www.iso.org/standard/69426.html)
- [ISO/IEC 42001:2023](https://www.iso.org/standard/42001)
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)
- [OWASP ASVS](https://owasp.org/projects/asvs)
- [IEC 62443](https://syc-se.iec.ch/deliveries/cybersecurity-guidelines/security-standards-and-best-practices/iec-62443/)

---

## License

This repository is distributed under the [MIT License](LICENSE).

External datasets, APIs and services retain their respective licences, terms and attribution requirements.

---

**COBRA · ol-s-cloud**