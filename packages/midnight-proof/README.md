# Midnight Test Proof Provider

This package is reserved for the narrow real Midnight TestWired integration.
It must not copy the private monorepo Midnight adapter and must use currently
supported official tooling.

Required behavior:

1. Commit to the synthetic property evidence or authorized predicate state.
2. Verify `property.is_unencumbered` without publishing the source evidence.
3. Return an inspectable test-network transaction or proof receipt.
4. Verify the commitment lineage used by a reconstructed recall projection.
5. Fail closed on network, contract, proof, or receipt mismatch.

Until those behaviors are verified, this subsystem is `PLANNED`, not
`REALDEAL_TEST`.
