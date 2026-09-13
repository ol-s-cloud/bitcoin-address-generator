# COBRA Protocol

**Cryptographic authority, energy-system data and compute intelligence for real-world sites.**

[Website](https://cobra-protocol.org) · [Register a Site](https://cobra-protocol.org/uk.html) · [Provenance](docs/PROVENANCE.md) · [Technical Docs](docs/TECHNICAL.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python Package](https://github.com/ol-s-cloud/bitcoin-address-generator/actions/workflows/python-package.yml/badge.svg)](https://github.com/ol-s-cloud/bitcoin-address-generator/actions)

> **Repository role**
>
> This repository is the public upstream and provenance record for COBRA. It intentionally contains only code, interfaces, documentation and reference components that can be made public. Hosted customer infrastructure, customer data, proprietary intelligence, private optimisation logic and patent-sensitive implementations are maintained outside the public tree.

## Overview

COBRA is an open-core energy-and-compute intelligence project built around a simple systems question:

> **Given the physical state of a site, the condition of the energy system, the characteristics of its assets and the economics of operating them, what should the site do with electricity — and why?**

The project combines cryptography, electricity-system data, site modelling, engineering economics, explainable decision support and selected machine-learning research. Its application domains include Bitcoin mining, AI and flexible compute, homes and communities, commercial and industrial sites, distributed generation and storage, and power-generation environments.

The long-term technical pattern is:

```text
Cryptographic authority
        ↓
Real-world data
        ↓
Site + asset state
        ↓
Energy / compute intelligence
        ↓
Decision + explanation
        ↓
Authorised action
        ↓
Measured outcome
        ↓
Predicted vs realised performance
```

COBRA does not treat a dashboard, a data feed or a price chart as "intelligence" on its own. A feature is only considered an intelligence feature when it produces a measurable decision, prediction or explanation from real data.

---

## From Bitcoin Address Generation to COBRA

This repository began in **2023** as university coursework and an independent technical exercise in Bitcoin address generation. The original work explored private-key generation, elliptic-curve cryptography, public keys, hashing and Base58Check encoding.

That work then expanded into Bitcoin infrastructure and mining. Mining exposed a wider engineering problem: computation consumes significant electrical power, electricity varies in economic value over time and location, and mining equipment converts most of that electrical input into heat. That creates questions around operating windows, site constraints, thermal management, energy utilisation and whether compute should run at all under a given set of conditions.

Those questions became broader than Bitcoin.

COBRA evolved from:

```text
Bitcoin address generation
        ↓
cryptographic tools and offline operation
        ↓
Bitcoin network and mining economics
        ↓
energy-aware compute
        ↓
site-level energy intelligence
        ↓
multiple physical and computational use cases
```

The original materials have **not** been removed or rewritten out of the history. See [Project Provenance](docs/PROVENANCE.md) and the archived [Bitcoin Address Generator README](archive/README-bitcoin-address-generator-2025.md).

---

## System Architecture

COBRA is being developed as a layered system rather than a single application.

```text
                         COBRA
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
 Cryptography         Data / APIs        Public interfaces
       │                   │                   │
 keys / signing       grid / market        Explorer
 offline / CLI        tariffs              calculators
 provenance           weather              research
 device identity      solar / property      developer tools
       │               Bitcoin network          │
       └───────────────────┬───────────────────┘
                           │
                      Site model
                           │
               Energy + compute context
                           │
                Intelligence / simulation
                           │
                 Decision + explanation
                           │
               Outcome / validation layer
```

Public interfaces can expose reference indicators and reproducible calculations. Site-specific customer information and proprietary decision logic remain private by default.

---

## Application Domains

| Domain | COBRA question |
| --- | --- |
| **Bitcoin mining** | Is this miner or fleet economically sensible to run under the site's actual power economics and current network conditions? |
| **AI / flexible compute** | When should schedulable compute run, defer, throttle or move relative to energy availability, cost and workload constraints? |
| **Homes** | What is the household using, what is it costing, what can move, and which interventions are economically meaningful? |
| **Communities / microgrids** | How can local generation, storage and flexible demand be coordinated and evaluated? |
| **Commercial / industrial sites** | Which loads are flexible, what are the operational constraints, and what actions reduce cost or improve utilisation? |
| **Generation + storage** | How should generation, storage, export and flexible demand be represented within a common site model? |
| **Power-generation environments** | How can energy-intensive compute or controllable loads be modelled alongside generation constraints and operating conditions? |
| **Nuclear-energy research contexts** | How might high-availability generation, thermal constraints and flexible compute be represented in site-level energy/compute models? This is a research direction, not a claim of deployed nuclear control. |

---

## Data and Integration Work

COBRA is designed to combine public system data with consented customer/site data and verified asset specifications. Current data and integration work includes:

| Source / dataset family | Role in COBRA | Data boundary |
| --- | --- | --- |
| **NESO** | Great Britain electricity-system conditions, regional/grid context, carbon and flexibility signals | Public/system data |
| **Elexon / BMRS** | Balancing, market and electricity-system observations | Public/system data |
| **Octopus Energy** | Consented customer consumption, meter and retail-tariff data | Private customer connection |
| **European Commission JRC / PVGIS** | Solar resource and PV-yield reference modelling | Public/reference data |
| **Energy Performance Certificates (EPC)** | Building characteristics and energy-performance context where permitted | Public/property data |
| **Weather / environmental data** | Physical context for demand, solar and site modelling | Public/reference data |
| **Bitcoin network and mining-market data** | Network state, mining monetisation conditions and reference economics | Public/market data |
| **Manufacturer specifications** | Miner, appliance and equipment reference characteristics | Public/reference data |
| **User / site inputs** | Tariffs, assets, capacity limits, operating assumptions and local constraints | Site-specific/private as applicable |
| **CSV / local imports** | User-controlled interval and operational data for self-hosted or staged workflows | User-controlled |

Not every adapter or hosted integration is released in this repository. Public release is intentional: components are reviewed for security, licensing, privacy and intellectual-property boundaries before they are moved into the open-core surface.

---

## COBRA Indicators and Explorer

The public Explorer is intended to make complex system conditions easier to inspect without confusing market context with site-specific profitability.

Reference indicator families include:

- **Energy Condition** — observable electricity-system state and price context.
- **Grid Flexibility** — signals relevant to surplus, scarcity and flexible demand.
- **Bitcoin Network** — network and mining-market conditions.
- **Mining Economics** — reference economics where the necessary assumptions are supplied.
- **Low-Carbon Compute** — energy/carbon context relevant to schedulable compute.
- **Compute Window** — whether selected conditions are favourable, conditional or unfavourable for a defined workload.

A public wholesale electricity price is **not** automatically a household tariff, and Bitcoin price alone is **not** a mining-profitability signal. COBRA's engineering rule is to preserve the difference between public reference data and the actual economics of a site.

---

## Intelligence, Machine Learning and Validation

COBRA follows a deterministic-first approach: calculations that can be derived transparently from physical quantities, tariffs and measured data should remain inspectable before machine learning is added.

Research and engineering areas include:

- load and demand forecasting;
- anomaly and state-change detection;
- observation/data-quality assessment;
- appliance and asset inference;
- tariff and operating-window analysis;
- scenario simulation for storage, generation and flexible loads;
- economic threshold estimation;
- explainable opportunity ranking;
- energy-to-compute scheduling;
- predicted-versus-realised outcome evaluation;
- calibration and reliability of decision-support models.

Machine-learning models, proprietary features, model weights, private training pipelines, advanced optimisation and control policies are not published by default.

The preferred validation loop is:

```text
Observation → Model → Decision → Action → Outcome → Compare → Improve
```

That allows COBRA to distinguish between something that looked favourable in a model and something that produced measurable value in the physical system.

---

## Engineering Principles

COBRA is being built around several non-negotiable principles:

1. **Real data before synthetic certainty.** Missing information should be reported as unavailable rather than replaced with invented values.
2. **Site economics before generic signals.** Public market conditions provide context; they do not replace the site's actual tariff, assets and constraints.
3. **Explainability before automation.** A recommendation should expose the evidence and assumptions that produced it.
4. **Deterministic where possible.** Machine learning is used where it adds measurable value, not as a label for ordinary arithmetic.
5. **Privacy by architecture.** Customer data and credentials do not belong in public repositories.
6. **Open-core by design.** Public components should be genuinely useful and independently deployable; proprietary hosted intelligence remains private.
7. **Outcome validation.** Where possible, predicted value should be compared with realised value after an action.
8. **No forced action.** "Do nothing" or "do not run" is a valid result when the economics or evidence do not justify intervention.

---

## Geographic Scope

COBRA's current real-world validation is focused primarily on **Great Britain**, where the project is working with GB electricity-system data, household energy data and UK site scenarios.

**Finland** is a priority next-market study, followed by additional European countries. International expansion is deliberately adapter-based: a country is added only when its electricity-market structure, tariff semantics, data sources and regulatory boundaries can be represented correctly rather than being forced into a UK model.

The long-term architecture is intended to support country-specific energy adapters behind a common site and decision interface.

---

## Open Core and Self-Hosted Development

COBRA is **open-core**, not a fully open-source hosted platform.

The public rule is straightforward:

> If code is released here, it should be code we are comfortable allowing another developer to inspect, fork, modify and operate independently.

Public/community components may include:

- cryptographic utilities and CLI tools;
- public-data adapters;
- documented schemas and interfaces;
- reference engineering/economic calculations;
- CSV and local-data tooling;
- MQTT / Home Assistant / device-interface specifications where released;
- local dashboards and transparent rule engines;
- Raspberry Pi and other self-hosted community components after review.

Private components include hosted customer infrastructure, production credentials, customer data, proprietary intelligence, advanced forecasting/optimisation, private commercial systems and patent-sensitive implementation details.

### Fork this repository

```bash
git clone https://github.com/ol-s-cloud/bitcoin-address-generator.git
cd bitcoin-address-generator
```

The repository currently retains its **MIT licence**. Future repositories or components may use different licences; always check the licence distributed with the specific component you are using.

---

## Current Public Repository

This repository contains the project's original cryptographic lineage together with public web, CLI, documentation and other intentionally releasable components.

The original Python package remains available for educational/development use:

```bash
pip install bitcoin-address-generator
```

```python
from bitcoin_address_generator import generate_wallet

private_key, public_key, address = generate_wallet()
print(address)
```

See the archived [legacy README](archive/README-bitcoin-address-generator-2025.md) for the original package-oriented documentation and learning resources.

> The original Bitcoin address-generation package is educational/development software. Do not treat it as a production wallet or use it to protect material real-world funds without an independent security review.

---

## Project Surfaces

| Surface | Role |
| --- | --- |
| [**COBRA Protocol**](https://cobra-protocol.org) | Public project, Explorer, research, tools and project information |
| **COBRA Home** | Household energy-account and site-intelligence product under staged validation |
| **COBRA Mining** | Miner/fleet economics, facility modelling and energy-aware compute intelligence under active engineering |
| **COBRA Explorer** | Public system/network/reference indicators |
| **COBRA Research** | Technical research and validation work |
| **COBRA Offline / CLI** | Local and cryptographic workflows |
| **Self-hosted / Community** | Public components intended for local deployment as they pass disclosure and release review |

Hosted product development is staged separately from the public repository so that public code remains safe to fork and private operational code remains private.

---

## Contributing

Contributions to the public/open-core surface are welcome. Please read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)
- [Technical Guide](docs/TECHNICAL.md)
- [API Reference](docs/API.md)
- [CLI Guide](docs/CLI.md)

Useful contribution areas include documentation, test coverage, public-data adapters, data-quality checks, reproducible reference calculations, local/self-hosted tooling and issues found in released components.

Please do **not** submit real API keys, customer data, wallet secrets, private keys, meter credentials or other sensitive information in issues or pull requests.

---

## Participate / Register a Site

COBRA is moving from software architecture into real-world site validation. Households, energy users, mining/compute operators, generation projects, developers and researchers can follow the project at:

- **Website:** https://cobra-protocol.org
- **UK site registration:** https://cobra-protocol.org/uk.html
- **GitHub:** https://github.com/ol-s-cloud/bitcoin-address-generator

Site registration is an expression of interest / onboarding route and does not itself imply service availability, commercial acceptance or participation in an electricity/flexibility market.

---

## Security and Responsible Disclosure

Security issues should be reported according to [SECURITY.md](SECURITY.md). Do not place secrets or exploit details that could put users at risk into a public issue.

COBRA's cryptographic, energy and compute components have different safety profiles. Public reference calculations and research prototypes should not be assumed to be production control systems unless they are explicitly documented as such.

---

## Provenance

The repository deliberately retains its original lineage.

- [COBRA Project Provenance](docs/PROVENANCE.md)
- [Archived Bitcoin Address Generator README](archive/README-bitcoin-address-generator-2025.md)
- [Original Bitcoin-address notebook](How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb)
- Full Git commit history in this repository

The evolution is part of the project: **cryptography → Bitcoin → mining → energy-aware compute → site intelligence**.

---

## License

This repository is licensed under the [MIT License](LICENSE).

Third-party datasets, APIs and external services retain their own terms, licences and usage conditions. Inclusion as a data source or technical reference does not imply partnership, endorsement or affiliation.

---

**COBRA by ol-s-cloud**  
Cryptographic sovereignty · energy intelligence · compute economics · measurable outcomes
