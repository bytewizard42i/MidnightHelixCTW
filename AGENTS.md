# Working notes for contributors and agents

Hard-won operational knowledge for this repository. Most entries exist because
something cost real time to discover, or because a check passed locally and
would have failed somewhere expensive. Read the section that matches what you
are about to touch.

Companion documents: `docs/HACKATHON_COMPLETION_HANDOFF_TO_PENNY_2026-08-16.md`
is the control plan, `docs/IMPLEMENTATION_STATUS.md` is the truth ledger, and
`docs/MIDNIGHT_TRUST_BOUNDARY.md` governs Midnight claims.

## Verification

```bash
npm ci
npm run verify        # fixtures, doc links, workspace tests, infra tests, typecheck, build
npm run infra:validate
node scripts/verify-doc-links.mjs
git diff --check
```

Node.js 22 or newer is required. The local Midnight stack pins the exact
version in `local-midnight/.nvmrc` and fails fast if the resolved runtime is
older.

Regenerate the public-safe memory corpus (needs a TestTownDIDz checkout):

```bash
node scripts/build-memory-corpus.mjs --source ../TestTownDIDz          # rewrite
node scripts/build-memory-corpus.mjs --source ../TestTownDIDz --check  # verify only
```

## Lambda packaging: the trap that passes every local test

**The deployed artifact contains only `apps/api`.** `Makefile` stages the
workspaces, runs `npm ci --workspace @mhelix/api`, copies `apps/api/src`, and
then copies `node_modules` **excluding `@mhelix`** — workspace symlinks would
dangle inside the package.

Consequences, both learned the hard way:

* An import of another workspace, for example `@mhelix/mock-pillars`, resolves
  perfectly in tests and throws `ERR_MODULE_NOT_FOUND` in Lambda.
* An import that escapes the directory, for example
  `../../../fixtures/whatever.json`, does exactly the same.

So **`apps/api` must be self-contained.** The deterministic embedding generator
lives in `apps/api/src/synthetic-embedding.js`, and the memory corpus has a
deployable copy at `apps/api/src/memory-corpus.json`. That copy is written by
the same build script as the canonical fixture, and a test asserts the two are
byte-identical so the duplication cannot drift.

Before trusting any new runtime import, simulate the package:

```bash
mkdir -p /tmp/sim && cp -R apps/api/src /tmp/sim/src && cp apps/api/package.json /tmp/sim/
cp -R node_modules/pg node_modules/@aws-sdk /tmp/sim/node_modules/
node -e "import('/tmp/sim/src/handler.js').then(()=>console.log('ok'))"
```

`infrastructure/aws/test/template-contract.test.mjs` pins the exact dependency
set of `apps/api`. If that test fails after you add a dependency, the real
question is whether the dependency can ship at all, not whether to update the
expectation.

## CockroachDB

Cluster `helixchain-hackathon`, v26.2.x, database and schema
`mhelix_testwired`. Verify syntax against the **v26.2** documentation, not
`stable`.

* `crdb_sql_type` **is** documented in `information_schema.columns`. It is the
  way to prove a column is exactly `VECTOR(8)`. An earlier note in this project
  claimed it was undocumented; that was wrong, caused by reading a truncated
  page.
* A vector index is only usable when **every** prefix column is constrained to
  an exact value. The recall query pins `run_id` and `projection_generation_id`
  and orders by `<=>`, matching the declared `vector_cosine_ops` class.
* `feature.vector_index.enabled` defaults to **true** on Basic v26.2, so no
  cluster-setting change is expected. Verify rather than assume.
* `[SHOW ...]` as a table expression is a documented CockroachDB extension and
  is how the verifiers read `SHOW CREATE TABLE`, `SHOW GRANTS`,
  `SHOW SYSTEM GRANTS`, and `SHOW ROLES`.
* `digest(data, 'sha256')` returns 32 raw bytes, which matches the
  `octet_length(...) = 32` commitment constraints.
* **`GRANT` can auto-commit.** It is a schema change, so the grant packet is
  written without a surrounding transaction and is documented as *resumable and
  idempotent*, never atomic. Completion evidence is the readback, not the
  script's apparent success.

### Proving privileges honestly

Table grants are not the whole privilege surface. A readback must also cover:

* privileges reaching a role through the implicit **`public`** role — the
  classic way a least-privilege claim turns out false;
* system privileges via `SHOW SYSTEM GRANTS`;
* role options and memberships via `SHOW ROLES`;
* object **ownership**, which carries implicit full privilege and the grant
  option, and would silently defeat every table-level check.

Do not use `information_schema.schema_privileges.is_grantable` to decide schema
grantability; use `SHOW GRANTS ON SCHEMA`.

Prove shapes exactly, not by counting. A count of foreign keys passes happily
when a composite key has been downgraded to a weaker single-column key; compare
the ordered column list through `key_column_usage.ordinal_position`.

Never write `coalesce(<check>, true)` in a verifier. It turns "no rows
examined" into "true", which is the exact failure mode a fail-closed readback
must not have. A test rejects the pattern.

## The SQL boundary

There is no general query executor in this application, deliberately. Callers
may only invoke a named operation from the frozen catalog in
`apps/api/src/vector-memory-statements.js`, and every value crosses as a bound
parameter.

`apps/api/test/vector-memory-statements.test.mjs` rejects template
interpolation, string concatenation, unqualified table references,
non-contiguous placeholders, destructive verbs, `SELECT *`, any statement that
would return a stored vector or its commitment, and any `UPDATE` outside the
four reviewed lifecycle transitions (`updateRunActiveProjection`, the fourth,
repoints a run's single active-projection binding during the rebuild drill,
guarded by the previous generation id and the new generation being ACTIVE).

One more trap in that catalog test: the write-gate list, the UPDATE allowlist,
and the lazy facade in `cockroach-bootstrap.js` are three separate name lists
that must all be extended when a provider operation is added. Forgetting the
facade produces `undefined` at runtime — a generic 503 in Lambda that no
handler test catches, because handler tests inject a stub provider directly. A
test in `cockroach-runtime.test.mjs` now pins the facade to the provider's
real method surface.

Runtime rules in `vector-memory-provider.js`: one serializable transaction per
logical operation; retry **only** SQLSTATE `40001`, at most three attempts;
idempotency keys hashed to 32 bytes before they reach the database; a repeated
key with the same request replays, the same key with different content fails
and writes nothing; responses assembled field by field on an allowlist rather
than spread from a row.

## Status vocabulary and evidence

`REALDEAL_TEST`, `LIVE_TESTWIRED`, `VERIFIED_LOCAL`, `SOURCE_ONLY`, `MOCK`,
`NOT_CONNECTED`. Never promote a label because code exists, a build passes, or
an operator ran a direct query.

Keep evidence classes separate. A green build is not proof of deployment, a
remote hash is not proof of continuous integration, and a direct database query
is not proof of public behaviour.

A receipt cannot contain the hash of the commit that contains it. Record live
receipts in a later evidence commit, and never amend a published commit to make
a hash match.

The human-facing name for the serverless bridge is **Helix Runtime Bridge
(AWS (Amazon Web Services) Lambda)**. The machine identifier stays `aws`,
because the typed protocol contract and the browser both key on it.

## Secret scanning

`.gitleaks.toml` extends the default rules. Its allowlist holds exactly one
reviewed entry, and the bar for adding another is high.

Two things worth knowing before you fight it:

* The scan reads **patch content, including deleted lines**. Renaming an
  offending literal forward does not clear it, because the original remains in
  pushed history. Rewriting that history would need a force-push, which this
  repository prohibits.
* `generic-api-key` fires on the *shape* of an assignment: an identifier
  containing `KEY` plus a hyphenated token-like value. Name test fixtures so
  they do not look like credentials, and this never comes up.

Never relax a rule to make a check pass. Fix the fixture, or add a
minimal, exact-match allowlist entry with the review reasoning written down.

## GitHub CLI

The available token lacks `read:org`, so `gh pr edit` and `gh pr ready` fail
with a scope error. Use the REST API instead:

```bash
gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -F body=@body.md
gh api -X PUT   repos/<owner>/<repo>/pulls/<n>/merge -f merge_method=merge
```

Taking a pull request out of draft requires GraphQL, because REST cannot unset
`draft`:

```bash
ID=$(gh api repos/<owner>/<repo>/pulls/<n> --jq .node_id)
gh api graphql -f query='mutation($id:ID!){markPullRequestReadyForReview(input:{pullRequestId:$id}){pullRequest{isDraft}}}' -F id="$ID"
```

## Testing notes

Handler tests need the public configuration set **before** the module loads:
`MHELIX_PUBLIC_ALLOWED_ORIGINS`, `MHELIX_MAX_REQUEST_BYTES`,
`MHELIX_MAX_RESPONSE_BYTES`, `MHELIX_RELEASE_COMMIT`, `AWS_REGION`. A missing
origin surfaces as a puzzling `403` long before any route logic runs. Copy the
setup from `apps/api/test/handler.test.mjs` rather than inventing one.

Request bodies follow the typed contract: close uses `sessionId`, recall uses
`query`. The CockroachDB probe stub must return `receiptId` and a canonical UTC
`observedAt`, or the provider row stays `NOT_CONNECTED` and any gate depending
on it silently stays shut.

Blocked mutation routes deliberately perform **no** database probe when no
memory provider is deployed. Two existing tests encode that rule. If they fail,
change the code, not the tests.

Catalog statements are formatted literals that begin with a newline. A fake
database client that matches with `startsWith` must trim first, or every match
silently falls through to a default stub.

## Local Docker and Midnight

Docker Desktop runs on the Windows side. From WSL:

```bash
"/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" &
```

An unclean Windows shutdown can leave `C:\Users\<user>\.docker\daemon.json` and
`windows-daemon.json` filled with **null bytes**, which stops Docker Desktop
before its backend loads with `invalid character '\x00'`. The same event can
reset `AppData\Roaming\Docker\settings-store.json`, which removes
`EnableIntegrationWithDefaultWslDistro` and `IntegratedWslDistros` and makes
`docker` vanish inside WSL even while the engine runs.

Repair by backing up the corrupted files and writing valid JSON. **Do not use
"Reset to factory defaults"** for this: it discards all local images, including
the pinned Midnight node, indexer, and proof-server images, to fix a malformed
text file.

The local Midnight stack is `VERIFIED_LOCAL` and is not a dependency of the
public application. Archive its state recoverably with `npm run state:archive`;
never delete it.

## Standing safeguards

Never force-push, rebase shared history, or rewrite `main`. Never weaken or
delete a test to make a gate pass. Never commit a secret, and never place one
in a command that enters shell history. Push at every green checkpoint rather
than batching work locally: an unclean shutdown during this project destroyed
the Docker image cache and every uncommitted change would have gone with it.

`TaskFence` is read-only in this workspace. Other Helix assets are out of scope
for this hackathon.
