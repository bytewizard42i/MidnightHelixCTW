# Build Stages and Evidence Labels

This repository uses John S.'s DIDzM build-stage convention in a standalone,
public form.

## Build stages

| Stage | Meaning |
| --- | --- |
| DemoLand | Product rules and interface are simulated. External mechanisms are mocked. |
| TestWired | Isolated synthetic-data build stage and target environment. The label does not prove that any provider is connected. |
| RealDeal | Production mechanisms, production endpoints, and real users or value. |

MHelixCTW targets **TestWired**. During TestWired assembly, source and local UI
may exist while providers remain `SOURCE_ONLY`, `PLANNED`, or `NOT_CONNECTED`.
A capability becomes `LIVE_TESTWIRED` only after the named test or cloud service
succeeds and current evidence is recorded.

## Evidence labels

Machine evidence labels apply to individual capabilities and outputs, not the
entire application:

| Label | Meaning |
| --- | --- |
| `LIVE_TESTWIRED` | Named real test or cloud service called successfully with synthetic data and current evidence recorded |
| `VERIFIED_LOCAL` | Stated local check passed, without proving public deployment or live cloud integration |
| `MOCK` | Deterministic synthetic fixture or local behavior that does not call the named external system |
| `SOURCE_ONLY` | Source or infrastructure exists, but successful execution in the named environment is not evidenced |
| `PLANNED` | Capability is not connected and cannot support a decision |

Connection state is reported separately as `CONNECTED` or `NOT_CONNECTED`.
`REALDEAL_TEST` may appear only as a human-facing evidence label on one
successful output carrying a sanitized real test-service receipt. It is never a
build stage or a substitute for the machine label `LIVE_TESTWIRED`.

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

## Display gates

The judge interface may always use these boundary phrases:

- `TESTWIRED`
- `SYNTHETIC DATA ONLY`
- `MOCK IDENTITY PROVIDER`
- `MOCK AGENT AUTHORITY`
- `MOCK ASSET IDENTITY`
- `NOT CONNECTED`, for any unavailable planned subsystem

The following phrases are gated and must not appear as current claims until the
truth ledger records their required evidence:

- `PUBLIC TEST ENVIRONMENT`, only after a signed-out public URL is verified;
- `LIVE COCKROACHDB CLOUD - TEST DATA`, only after live query and receipt evidence;
- `LIVE AWS API GATEWAY + LAMBDA`, only after the generated endpoint and runtime evidence pass;
- `LIVE MIDNIGHT TEST NETWORK`, only after a real supported-network receipt.
