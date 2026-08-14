# Publication checklist

## Source and ownership

- [ ] Apache-2.0 appears at repository root and GitHub detects it.
- [ ] Entrant name agrees with the actual owner of the submitted intellectual
  property.
- [ ] `PREEXISTING_WORK.md` lists every imported baseline and source commit.
- [ ] `docs/provenance/imported-sources.json` matches the imported files.
- [ ] Imported-file SHA-256 manifest is generated after the final copy.
- [ ] All required source, dependencies, example configuration, fixtures, and
  setup instructions are present.
- [ ] Ai coding assistance is disclosed.

## Security and privacy

- [ ] Full history and working tree pass secret scanning.
- [ ] No AWS account IDs, credential paths, wallet seeds, connection strings, or
  private endpoints appear in the public tree.
- [ ] All test data is synthetic.
- [ ] Browser bundle contains no database, Managed MCP, wallet, or secret values.
- [ ] Live roles are least privilege and environment-marker verification passes.
- [ ] API inputs, outputs, provider calls, and retries are bounded.
- [ ] Logs are redacted and have limited retention.
- [ ] No silent fallback to a mock provider exists.

## Media

- [ ] Every included asset appears in `MEDIA_RIGHTS.md`.
- [ ] Vision slides are labeled as source material, not implementation evidence.
- [ ] Unsupported absolute claims have been removed from final public media.
- [ ] No third-party PDF is copied into the repository.
- [ ] No music is used without documented rights.
- [ ] The final demo video is public, captioned, under three minutes, and shows the
  application functioning.

## Judge flow

- [ ] Public UI and generated AWS API URL work in an incognito browser.
- [ ] Session B recalls Session A from CockroachDB after browser refresh.
- [ ] Real Titan vector retrieval is visible.
- [ ] Exact scope and private predicate are separately shown.
- [ ] Real Midnight test-network receipt is visible, or the feature is removed
  from the live path and truthfully relabeled.
- [ ] Unauthorized document disclosure is denied with zero protected fields.
- [ ] Rebuild creates a shadow generation and returns the same committed result.
- [ ] Read-only Managed MCP verification is visible.
- [ ] Provider, region, commit, latency, and receipt evidence is inspectable.

## Devpost

- [ ] Submission title and repository identity are consistent.
- [ ] Two CockroachDB tools are named and their meaningful use is explained.
- [ ] AWS service use is named and visible in the video.
- [ ] Prior-work disclosure appears in Devpost, not only in the repository.
- [ ] Live demo remains free and functional through the judging period.
- [ ] All public links are tested signed out.
- [ ] Submission is made before Tuesday, August 18, 2026 at 5:00 PM EDT.
