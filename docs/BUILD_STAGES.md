# Build Stages and Evidence Labels

This repository uses John S.'s DIDzM build-stage convention in a standalone,
public form.

## Build stages

| Stage | Meaning |
| --- | --- |
| DemoLand | Product rules and interface are simulated. External mechanisms are mocked. |
| TestWired | The same product calls real test networks, proof servers, cloud services, and test APIs. Data, accounts, and stakes remain synthetic. |
| RealDeal | Production mechanisms, production endpoints, and real users or value. |

MHelixCTW targets **TestWired**.

## Evidence labels

Evidence labels apply to individual outputs, not the entire application:

| Label | Meaning |
| --- | --- |
| `MOCK` | Deterministic synthetic provider or simulated external result |
| `REALDEAL_TEST` | Real mechanism called against test or cloud infrastructure with synthetic data |
| `REALDEAL` | Verified production mechanism with production data or value |
| `PLANNED` | Capability is not connected and cannot support a decision |

The same application may mix labels. Every response must identify the label for
each contributing subsystem.

## House rules

1. Never silently fall back from a live provider to a mock.
2. Provider failure is visible and fails closed.
3. Same application code, different providers and configuration at explicit
   seams.
4. Synthetic fixtures never imply production identity, title, legal status, or
   financial effect.
5. A build or health response is not proof that every provider path works.
6. `REALDEAL_TEST` requires an inspectable request, transaction, proof, or
   database receipt from the named test mechanism.

## Submission labels

The judge interface uses these exact phrases:

- `TESTWIRED`
- `PUBLIC TEST ENVIRONMENT`
- `SYNTHETIC DATA ONLY`
- `LIVE COCKROACHDB CLOUD - TEST DATA`
- `LIVE AWS API GATEWAY + LAMBDA`
- `LIVE MIDNIGHT TEST NETWORK`, only after a real receipt
- `MOCK IDENTITY PROVIDER`
- `MOCK AGENT AUTHORITY`
- `MOCK ASSET IDENTITY`
- `NOT CONNECTED`, for any unavailable planned subsystem
