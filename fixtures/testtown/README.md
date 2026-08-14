# Curated TestTown Fixture

This directory contains the complete fictional cast and evidence required by
the MHelixCTW judge scenario. It is intentionally much smaller than the public
TestTownDIDz repository.

## Source

Repository:
<https://github.com/bytewizard42i/TestTownDIDz>

Pinned public commit:

```text
f145c07b3f8abf62c04e1532f67118b5a5aa66b9
```

The original source files are stored under `source/`. Derived hackathon files
are under `derived/` and identify their relationship to the source.

## Why the snapshot is local

- Judges can run the project without another repository.
- Runtime behavior does not depend on GitHub availability or branch movement.
- A pinned source commit and hashes preserve provenance.
- The exact synthetic case remains deterministic throughout judging.

An optional future sync checker may compare this snapshot with the pinned
public source. Runtime code always uses the local fixture.

## Fixture boundary

- Edgar Morrow and the farmhouse originate in TestTown.
- TestTown's current farmhouse contains no deed, lien, or mortgage evidence.
- MHelixCTW adds a clearly fictional recorder, property agent, unauthorized
  agent, deed record, mortgage-satisfaction record, and title-status record.
- DIDz, AgenticDID, and RWAz provider outputs remain labeled `MOCK`.
- No record has legal, financial, identity, or property effect.
