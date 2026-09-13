# Security Policy

COBRA spans cryptographic utilities, public-data integrations, energy/compute modelling and staged hosted products. Security expectations therefore differ by component.

## Supported Public Surface

Security reports are relevant to the current `main` branch and current public releases. Archived provenance material is retained for historical reference and is not necessarily maintained as production software.

The original Bitcoin Address Generator remains **educational/development software**. It should not be treated as a production wallet or used to protect material real-world funds without an independent security review.

Likewise, public reference energy/mining calculations and research prototypes should not be assumed to be production control systems unless explicitly documented as such.

## What Is Sensitive

Examples include:

- private-key generation or handling defects;
- credential or secret exposure;
- authentication/session vulnerabilities;
- cross-user or cross-site data access;
- customer or household data leakage;
- injection vulnerabilities;
- server-side request forgery or unsafe external requests;
- privilege escalation;
- cryptographic misuse;
- unsafe control paths affecting physical assets;
- vulnerabilities that could materially falsify economic/engineering outputs.

## Reporting a Vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Please report privately using the project's existing security contact:

- Email: `gs_wl889@icloud.com`
- Subject prefix: `COBRA SECURITY`

Include, where possible:

1. affected component and commit/version;
2. vulnerability description;
3. reproduction steps or proof of concept;
4. potential impact;
5. suggested mitigation, if known;
6. whether any real credentials or user data may have been exposed.

Do not include unrelated customer data, real private keys or unnecessary secrets in the report.

## Secret Handling

Never commit:

- wallet private keys or seed phrases;
- production API keys;
- supplier/meter credentials;
- database passwords or connection strings;
- encryption keys;
- OAuth/client secrets;
- session tokens;
- real customer exports.

Use environment variables or an approved secret-management mechanism for runtime credentials.

If a secret is accidentally committed, assume it is compromised: rotate/revoke it before attempting repository-history cleanup.

## Public / Private Architecture

The public repository intentionally excludes customer data, production credentials, proprietary intelligence and private operational infrastructure. Public code should remain safe to inspect and fork independently.

Security-sensitive hosted services and private intelligence are developed outside this public tree. Their existence should not be inferred as evidence that a public reference implementation is production-ready.

## Cryptographic Components

The original Bitcoin-address-generation code was created for education and development. Known limitations of the historical implementation may include limited side-channel protection, no hardware-backed key custody and no independent wallet-grade security audit.

For real Bitcoin custody, use established, independently reviewed wallet software/hardware appropriate to the threat model.

## Energy / Compute Components

COBRA calculations should not directly actuate physical equipment unless the relevant control path has been independently validated, access-controlled and explicitly authorised.

Economic or engineering outputs may depend on tariffs, market data, equipment specifications and site inputs. Incorrect or stale source data can produce incorrect decisions; source provenance and timestamps should therefore be preserved where possible.

## Disclosure

Please allow reasonable time for investigation and remediation before public disclosure. Where a vulnerability affects a third-party dependency or data provider, coordinated disclosure may be required.

The archived legacy security policy is available at [`archive/SECURITY-bitcoin-address-generator-2025.md`](archive/SECURITY-bitcoin-address-generator-2025.md).
