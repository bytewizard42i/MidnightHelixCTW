# Provenance manifests

This directory records provenance for every imported baseline, fixture, and selected
media asset. `imported-sources.json` records source repositories, paths, refs, and
Git blob identifiers. `imported-files.sha256` records the SHA-256 digest of each
curated destination file after import.

The manifests support three goals:

- make prior work visible instead of presenting it as new;
- prove exactly which source snapshot was imported;
- let reviewers detect accidental or unauthorized changes to imported material.

The original repositories remain authoritative for their own histories. This
repository is authoritative only for the new MidnightHelixCTW hackathon work.
