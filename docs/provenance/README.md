# Provenance manifests

This directory records the source and SHA-256 digest of every imported baseline,
fixture, and selected media asset. Static manifests will be generated after the
curated files are copied into this standalone repository.

The manifests support three goals:

- make prior work visible instead of presenting it as new;
- prove exactly which source snapshot was imported;
- let reviewers detect accidental or unauthorized changes to imported material.

The original repositories remain authoritative for their own histories. This
repository is authoritative only for the new MidnightHelixCTW hackathon work.
