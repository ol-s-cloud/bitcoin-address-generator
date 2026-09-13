# Contributing to COBRA

Thank you for contributing to COBRA's public/open-core surface.

COBRA combines cryptographic tools, public energy-system data, reference engineering calculations, developer interfaces and self-hosted components. This public repository is intentionally narrower than the full hosted platform: contributions should be suitable for public inspection, forking and independent deployment.

## Before You Start

Please read:

- [README.md](README.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)
- [docs/TECHNICAL.md](docs/TECHNICAL.md)
- [docs/PROVENANCE.md](docs/PROVENANCE.md)

## Good Contribution Areas

Public contributions are particularly useful in:

- documentation and examples;
- test coverage and regression cases;
- public-data adapters;
- data validation and provenance handling;
- reproducible reference calculations;
- CSV/local-data workflows;
- CLI and developer tooling;
- self-hosted or Raspberry Pi-compatible components that have been approved for public release;
- MQTT, Home Assistant or device-interface work where the interface is intentionally public;
- accessibility, performance and reliability improvements to released public interfaces.

## Public / Private Boundary

Do not submit or request publication of:

- customer or household data;
- API keys, credentials, private keys or wallet secrets;
- production database configuration;
- private hosted-platform code;
- proprietary optimisation or control logic;
- private model weights or training artefacts;
- commercial/internal operating data;
- patent-sensitive implementation details that have not been approved for disclosure.

If you are unsure whether something belongs in the public repository, open a high-level discussion without including the sensitive material.

## Development Process

1. Fork the repository.
2. Create a focused branch from `main`.
3. Make the smallest coherent change required.
4. Add or update tests when behaviour changes.
5. Update documentation when interfaces or behaviour change.
6. Run the relevant test suite and static checks locally.
7. Confirm that no secrets or private data are included.
8. Open a pull request with a clear description of the problem, approach and validation performed.

Example:

```bash
git clone https://github.com/<your-account>/bitcoin-address-generator.git
cd bitcoin-address-generator
git checkout -b feature/short-description
```

## Engineering Expectations

Contributions should favour:

- explicit units and currencies;
- source timestamps and provenance where data is external;
- deterministic calculations where machine learning is unnecessary;
- clear handling of unavailable or incomplete data;
- reproducible tests;
- separation between public reference signals and private/site-specific conclusions;
- explanations and assumptions alongside economic or engineering outputs.

Do not silently substitute wholesale electricity prices for retail tariffs, Bitcoin price for mining profitability, or synthetic values for unavailable observations.

## Bug Reports

A useful bug report includes:

- a concise summary;
- the relevant component/version/commit;
- reproducible steps;
- expected behaviour;
- observed behaviour;
- sample non-sensitive input where possible;
- environment details;
- any diagnostics already attempted.

For security vulnerabilities, **do not open a public issue**. Follow [SECURITY.md](SECURITY.md).

## Pull Requests

Pull requests should:

- have a narrow, reviewable scope;
- explain why the change is needed;
- include tests for new behaviour where practical;
- avoid unrelated formatting churn;
- preserve existing provenance and historical material;
- pass automated checks before merge.

## Licensing

Unless explicitly stated otherwise for a particular component, contributions to this repository are made under the repository's [MIT License](LICENSE).

Third-party data sources, APIs, specifications and libraries retain their own licences and terms. Contributors are responsible for ensuring that new integrations are compatible with those terms.

## Historical Bitcoin Components

The original Bitcoin Address Generator remains part of the repository's provenance and continues to have educational value. The archived project documentation is available under [`archive/`](archive/) and [docs/PROVENANCE.md](docs/PROVENANCE.md).

Changes to legacy cryptographic components should preserve backward compatibility where practical and must not weaken the existing educational-use security warnings.

## Code of Conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
