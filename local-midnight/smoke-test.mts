// MidnightHelixCTW local smoke-test driver (scaffold; network steps PROPOSED).
//
// Evidence label ladder (docs/MIDNIGHT_TRUST_BOUNDARY.md): success here is
// `VERIFIED LOCAL` at most. Steps that require a RUNNING network are marked
// `PROPOSED` below and have NOT been executed — this scaffold was produced
// under a no-containers constraint.
//
// Interface sources (verified 2026-08-16):
// - Official guide "Deploying and operating a contract" (Midnight.js 4.1.1),
//   retrieved via the official Kapa MCP.
// - Package existence and exact versions verified against the npm registry
//   (`npm view ... dist-tags`); see
//   docs/archive/midnight/2026-08-16-local-environment-rehearsal.md.
//
// SAFETY: no seed, key, password, or credential appears in this file. The
// genesis dev seed is read from the environment at runtime.

import { randomBytes } from 'node:crypto';
import { WebSocket } from 'ws';

// VERIFIED IMPORTS (names match the official 4.1.1 provider guide):
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { deployContract, getPublicStates } from '@midnight-ntwrk/midnight-js-contracts';

// Local endpoints — must match standalone.yml exactly.
const INDEXER_HTTP = 'http://127.0.0.1:8088/api/v4/graphql';
const INDEXER_WS = 'ws://127.0.0.1:8088/api/v4/graphql/ws';
const PROOF_SERVER = 'http://127.0.0.1:6300';
const ZK_ARTIFACTS = new URL('./artifacts/smoke_commitment', import.meta.url).pathname;

// Fail-closed helper: any mismatch ends the run with a non-zero exit code.
function assertOrDie(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`SMOKE FAIL (fail-closed): ${message}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  // 1. Network identity + WebSocket polyfill (required in Node.js for the
  //    wallet SDK's indexer subscription; verified in the official guide).
  setNetworkId('undeployed');
  globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

  // 2. Wallet from the pre-funded genesis DEV seed, supplied via env — never
  //    hardcoded, even though the local dev seed is publicly documented.
  const genesisSeed = process.env.MIDNIGHT_GENESIS_SEED;
  assertOrDie(!!genesisSeed, 'MIDNIGHT_GENESIS_SEED is not set (see README)');

  // Password for the local encrypted private-state store, also via env
  // (16+ chars, 3 of 4 character classes — enforced by the provider).
  const statePassword = process.env.MIDNIGHT_SMOKE_STATE_PASSWORD ?? '';
  assertOrDie(
    statePassword.length >= 16,
    'MIDNIGHT_SMOKE_STATE_PASSWORD is unset or under 16 characters (see README)',
  );

  // PROPOSED (needs running network + wallet-sdk 1.2.0 session):
  //   - build the wallet from the seed with @midnight-ntwrk/wallet-sdk 1.2.0
  //   - wait for full sync against the indexer
  //   - ensure DUST registration so the wallet can pay fees
  //   - derive walletProvider + midnightProvider (submission) from it
  // Symbol names VERIFIED against the installed 1.2.0 barrel on 2026-08-16:
  // WalletFacade, WalletSeed, HDWallet, DustWallet, ShieldedWallet,
  // UnshieldedWallet, generateRandomSeed all exist as exports. The exact
  // construction/sync sequence remains PROPOSED until it can be executed
  // against a running network and checked against the official guide.

  // 3. The six providers (shapes verified against the official 4.1.1 guide).
  const zkConfigProvider = new NodeZkConfigProvider<'recordCommitment'>(ZK_ARTIFACTS);
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'mhelix-smoke-private-state',
      signingKeyStoreName: 'mhelix-smoke-signing-keys',
      // 16+ chars, 3 character classes — enforced at runtime by the provider.
      // Supplied via env: the task queue forbids ANY password literal in
      // candidate files, even a dev-only one for a disposable local store.
      privateStoragePasswordProvider: () => statePassword,
      accountId: 'REPLACED-BY-WALLET-ADDRESS-AT-RUNTIME',
    }),
    publicDataProvider: indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PROOF_SERVER, zkConfigProvider),
    // walletProvider / midnightProvider: PROPOSED, see step 2.
  };

  // 4. PROPOSED (needs running network): deploy the compiled contract.
  //   const deployed = await deployContract(providers, {
  //     compiledContract,            // from artifacts/smoke_commitment
  //     privateStateId: 'mhelix-smoke',
  //   });

  // 5. PROPOSED (needs running network): one randomized commitment tx.
  //   const commitment = randomBytes(32);          // opaque by construction
  //   const result = await deployed.callTx.recordCommitment(commitment);

  // 6. PROPOSED (needs running network): ledger readback + fail-closed check.
  //   const publicStates = await getPublicStates(providers, deployed.deployTxData.public.contractAddress);
  //   assertOrDie(ledgerState.commitmentCount === 1n, 'commitmentCount != 1');
  //   assertOrDie(equalBytes(ledgerState.latestCommitment, commitment), 'commitment mismatch');

  // 7. PROPOSED: emit sanitized evidence receipt (no secrets, ever):
  //   { networkId, contractAddress, txId, blockHeight, circuit: 'recordCommitment',
  //     compiler: '0.31.1', images: { node: '1.0.0', indexer: '4.3.3', proof: '8.1.0' },
  //     commitmentHex, timestamp }

  console.log('Rehearsal driver: providers assembled; network steps remain PROPOSED.');
}

main().catch((error) => {
  console.error('SMOKE FAIL (fail-closed):', error);
  process.exit(1);
});
