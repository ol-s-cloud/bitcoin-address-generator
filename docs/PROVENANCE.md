# COBRA Project Provenance

COBRA retains the history of the work that preceded the current energy-intelligence platform. This repository is intentionally kept as the public upstream and provenance record rather than being rewritten into a new project with no visible lineage.

## Origin

The work began in 2023 as university coursework and an independent technical exercise in Bitcoin address generation. The original project explored the sequence from randomly generated private-key material to public keys and Bitcoin addresses using elliptic-curve cryptography, hashing and Base58Check encoding.

The original notebook remains in the repository:

- [`How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb`](../How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb)

The README that documented the Bitcoin Address Generator before the current COBRA overview has also been preserved as an archive snapshot:

- [`archive/README-bitcoin-address-generator-2025.md`](../archive/README-bitcoin-address-generator-2025.md)

The complete Git history remains the authoritative record of individual changes and dates.

## Evolution

The project expanded from cryptographic address generation into a broader investigation of Bitcoin infrastructure and mining. Mining made the relationship between computation, electricity and heat particularly explicit: compute consumes electricity, electricity has time- and location-dependent value, and mining hardware produces a significant thermal output that can itself become an engineering constraint or potential resource.

That led to a more general question:

> Can a site use real energy-system conditions, asset characteristics and economic constraints to decide when electricity-consuming equipment should operate, and then measure whether the decision produced the expected result?

COBRA grew from that question.

The current work extends the original cryptographic foundation into an energy-and-compute intelligence system spanning public system data, site models, engineering/economic calculations, explainable indicators, simulation and selected machine-learning research. Application domains under investigation include Bitcoin mining, AI and flexible compute, homes and communities, commercial and industrial sites, distributed generation and storage, and power-generation environments.

## What remains public

The repository follows an open-core boundary. Public code is code that can intentionally be inspected, forked, modified and self-hosted. That includes the original cryptographic work and, where deliberately released, public interfaces, reference calculations, data adapters, local tooling and community/self-hosted components.

Hosted customer infrastructure, customer data, credentials, proprietary intelligence, private optimisation logic, model internals and patent-sensitive mechanisms are not published by default.

This distinction allows the project to remain reproducible and useful to developers without turning the public repository into a disclosure of private operational or research IP.

## Continuity

The original Bitcoin project has not been deleted or rewritten out of the history. COBRA is presented as an evolution of that work: from cryptographic authority, to Bitcoin infrastructure, to mining economics, to energy-aware compute, and finally to a wider site-intelligence architecture.

For the current project overview, return to the [main README](../README.md).
