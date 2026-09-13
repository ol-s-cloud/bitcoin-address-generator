# COBRA Technical Overview

This document describes COBRA's **public technical architecture and engineering principles**. It intentionally omits customer infrastructure, proprietary optimisation, private model internals, production credentials and patent-sensitive implementation details.

For the original Bitcoin Address Generator technical guide, see [`archive/TECHNICAL-bitcoin-address-generator-2025.md`](../archive/TECHNICAL-bitcoin-address-generator-2025.md).

## System Model

COBRA is organised around a common site model rather than a collection of unrelated dashboards.

```text
External observations
(grid / market / weather / Bitcoin / property)
                +
Site observations
(tariff / meter / assets / limits / telemetry)
                ↓
          Normalised site state
                ↓
      Engineering + economic models
                ↓
      Decision / scenario / indicator
                ↓
          Explanation + evidence
                ↓
       Optional authorised action
                ↓
           Measured outcome
```

The same abstraction can represent a home, mining facility, flexible-compute site, commercial/industrial site, generation asset or microgrid while allowing each domain to retain its own specific models.

## Core Public Concepts

### Site

A site represents the physical/economic boundary within which COBRA is evaluating energy use.

Typical fields include:

- site type;
- country/timezone/currency;
- electricity tariff or power-cost basis;
- import/export limits;
- generation and storage state;
- asset inventory;
- operational constraints;
- data provenance and observation time.

### Asset

An asset may be a miner, compute device, appliance, battery, solar system, EV, heat pump, generator or another controllable/observable load.

Public/reference asset records may contain manufacturer, model, rated power, nominal performance and source provenance. Site-specific telemetry remains private where applicable.

### Observation

Observations are timestamped measurements or external conditions. COBRA distinguishes observations from assumptions and from modelled outputs.

Examples include:

- half-hourly electricity consumption;
- tariff rates;
- grid-carbon intensity;
- balancing/system conditions;
- solar/weather observations;
- Bitcoin network/mining-market observations;
- equipment telemetry.

### Decision

A decision is a structured conclusion such as:

- run / defer / stop compute;
- shift a flexible load;
- review abnormal baseload;
- compare a battery/solar intervention;
- take no action because evidence/economics do not justify one.

A decision should carry evidence, assumptions and an explanation.

### Outcome

Where an action occurs, COBRA can compare a predicted result with the realised result. This creates a validation loop rather than treating every recommendation as correct by definition.

## Public vs Private Boundary

### Suitable for the public/open-core surface

- cryptographic utilities;
- public-data adapters;
- schemas and stable interfaces;
- reference calculations;
- public Explorer indicators;
- CSV/local-data tooling;
- developer CLI/SDK components;
- self-hosted/local components approved for release;
- transparent rules and reproducible examples.

### Private by default

- customer accounts and production customer databases;
- credentials and secret-management implementation;
- customer/site telemetry not intentionally shared;
- proprietary opportunity ranking;
- advanced optimisation/control policies;
- private forecasting/model features;
- model weights and private training pipelines;
- commercial/CRM systems;
- patent-sensitive orchestration mechanisms.

The public repository should never require disclosure of private implementation details in order to remain useful.

## Data Sources

Current project work includes adapters or modelling around:

- NESO electricity-system data;
- Elexon/BMRS balancing and market data;
- Octopus Energy customer/meter/tariff data with user consent;
- PVGIS solar resource/yield data;
- EPC/building-energy data where permitted;
- weather/environmental observations;
- Bitcoin network and mining-market observations;
- manufacturer equipment specifications;
- user-supplied or locally imported site data.

Each external observation should carry enough metadata to determine source, time and units. Provider-specific payloads should be normalised before entering higher-level decision logic.

## Reference Indicator Architecture

The public Explorer is intended to expose system/reference conditions without leaking private site economics.

Example indicator families include:

- Energy Condition;
- Grid Flexibility;
- Bitcoin Network;
- Mining Economics;
- Low-Carbon Compute;
- Compute Window.

Indicators should make unavailable data explicit. A missing site tariff, for example, should not be replaced with a public wholesale price and presented as the site's actual cost.

## Mining Reference Model

A basic mining economics model requires more than Bitcoin price.

At minimum:

```text
ASIC hashrate
+ ASIC power
+ fleet quantity / uptime
+ facility overhead
+ site electricity rate
+ hashprice / mining monetisation input
+ FX when currencies differ
+ pool / operating costs where applicable
        ↓
revenue
power / energy
cost
operating profit
break-even electricity rate
```

Grid/carbon conditions can refine a preferred operating window but do not turn an uneconomic operation into a profitable one by themselves.

## Home Reference Model

A household/site energy model can combine:

```text
meter intervals
+ retail tariff
+ bills
+ appliance / asset information
+ property context
+ grid / weather context
        ↓
usage diagnostics
cost reconstruction
bill-period reconciliation
shift/scenario opportunities
```

Household retail tariffs remain distinct from wholesale market prices.

## Machine Learning

Machine learning is added only where it improves a measurable task beyond deterministic calculation.

Research areas include:

- forecasting;
- anomaly detection;
- appliance/asset inference;
- observation-quality assessment;
- opportunity ranking;
- site-state estimation;
- decision calibration;
- predicted-versus-realised evaluation.

Public documentation may describe model purpose, inputs, outputs and validation methodology without exposing proprietary feature engineering, model artefacts or private training data.

## Reliability and Data Quality

A production-oriented decision system must distinguish:

1. **system state** — what the physical/economic system appears to be doing;
2. **observation quality** — whether the data is complete, current and trustworthy;
3. **model output** — what the calculation/model predicts;
4. **decision** — what action follows from that evidence.

COBRA therefore treats data coverage, timestamps, units and provenance as first-class engineering concerns.

## Geographic Adapters

Great Britain is the current primary validation environment. Country-specific market/tariff adapters are expected to sit behind common interfaces so the site model does not assume that all electricity markets behave like GB.

Finland is a priority next-market study, with additional European markets following after source, tariff and regulatory validation.

## Self-Hosted Architecture

Public/self-hosted components may run locally on Linux, Raspberry Pi or similar environments where appropriate. A local deployment may combine:

- public-data adapters;
- user-entered tariffs;
- local SQLite/storage;
- CSV ingestion;
- MQTT/Home Assistant interfaces;
- local dashboards;
- transparent threshold rules;
- reference engineering calculations.

Private hosted intelligence is not required to make every public component useful.

## Cryptographic Lineage

The project's original cryptographic work remains part of the architecture and provenance. The historical implementation demonstrates the path from private-key material to Bitcoin addresses using secp256k1/ECDSA, SHA-256, RIPEMD-160 and Base58Check encoding.

See:

- [Project Provenance](PROVENANCE.md)
- [Legacy Technical Guide](../archive/TECHNICAL-bitcoin-address-generator-2025.md)
- [Original Notebook](../How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb)

## Engineering Rule

The public architecture should remain understandable without exposing the private implementation:

> **Observe accurately, preserve provenance, model explicitly, explain decisions, and measure outcomes.**
