// MidnightHelixCTW local smoke-test driver (local transaction canary).
//
// End-to-end proof for the pinned local devnet: build the genesis dev
// wallet, deploy the compiled canary contract, submit ONE 32-byte value
// generated randomly BY THIS DRIVER, read the public ledger back through
// the indexer, and emit a sanitized JSON receipt. Fail-closed everywhere:
// any mismatch exits 1.
//
// Scope honesty: this canary proves the toolchain and readback path. The
// contract cannot verify that submitted bytes are random, safe,
// authorized, or a commitment to private data — it is permissionless and
// local-only, not private DID (Decentralized Identifier) authorization.
//
// Evidence label ladder (docs/MIDNIGHT_TRUST_BOUNDARY.md): success here is
// `VERIFIED LOCAL` at most — a local disposable chain proves mechanics,
// never `LIVE MIDNIGHT TEST NETWORK`.
//
// Interface sources (verified 2026-08-16 against the installed exact-pinned
// packages and current official examples via the official Kapa MCP):
// - @midnight-ntwrk/testkit-js 4.1.1: FluentWalletBuilder,
//   MidnightWalletProvider.withWallet, initializeMidnightProviders,
//   LocalTestConfiguration.
// - @midnight-ntwrk/midnight-js-contracts 4.1.1: deployContract.
// - Wallet gotchas from the Midnight Expert wallet plugin references:
//   (a) we deliberately AVOID MidnightWalletProvider.build() because it
//       logs the master seed, which our rules forbid printing;
//   (b) the testkit default DUST options use additionalFeeOverhead: 0n,
//       which makes the FIRST CONTRACT CALL on an idle devnet compute a
//       zero fee and be rejected as NotNormalized (error 117) — so we set
//       a positive overhead via withDustOptions.
//
// SAFETY: no seed, key, password, or credential appears in this file or in
// its output. The genesis dev seed arrives via the process environment.

import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { WebSocket } from 'ws';

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { LedgerParameters, ZswapSecretKeys, DustSecretKey } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import {
  FluentWalletBuilder,
  LocalTestConfiguration,
  MidnightWalletProvider,
  initializeMidnightProviders,
} from '@midnight-ntwrk/testkit-js';
import pino from 'pino';

// The generated contract module from `compact compile` (git-ignored output;
// run `npm run compile:contract` first).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- generated JS module without bundled type resolution for .cjs
import * as smokeContractModule from './artifacts/smoke_commitment/contract/index.js';

const ZK_ARTIFACTS = new URL('./artifacts/smoke_commitment', import.meta.url).pathname;
const IMAGE_VERSIONS = { node: '1.0.0', indexer: '4.3.3', proofServer: '8.1.0' };
const COMPILER_VERSION = '0.31.1';

function fail(message: string): never {
  console.error(`SMOKE FAIL (fail-closed): ${message}`);
  process.exit(1);
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

// Provenance guard: the receipt must be bound to the exact committed
// source that produced it, so the driver derives the full 40-hex Git HEAD
// itself (no caller-supplied override — a caller must not be able to
// forge provenance) and REFUSES to run when tracked source is dirty.
// Ignored runtime state (node_modules/, artifacts/, state dirs) may
// remain; `git status --porcelain -uno` reports tracked files only.
function requireCleanCommittedHead(): string {
  const gitOptions = { encoding: 'utf8' as const };
  const dirty = execFileSync('git', ['status', '--porcelain', '-uno'], gitOptions).trim();
  if (dirty.length > 0) {
    fail(`tracked source is dirty; commit or stash before running smoke:\n${dirty}`);
  }
  const head = execFileSync('git', ['rev-parse', 'HEAD'], gitOptions).trim();
  if (!/^[0-9a-f]{40}$/.test(head)) fail(`unexpected git HEAD format: ${head}`);
  console.log(`provenance: clean tracked tree at commit ${head}`);
  return head;
}

async function main(): Promise<void> {
  // 0. Provenance first: derive the clean committed HEAD before any work.
  const sourceCommit = requireCleanCommittedHead();

  // 1. Network identity + WebSocket polyfill for the wallet SDK in Node.
  setNetworkId('undeployed');
  globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

  // Quiet logger: secrets never reach it, and we keep runtime noise down so
  // the receipt is the last thing on stdout.
  const logger = pino({ level: process.env.SMOKE_LOG_LEVEL ?? 'warn' });

  // 2. Genesis dev seed from the environment ONLY (never a file/literal).
  const genesisSeed = process.env.MIDNIGHT_GENESIS_SEED;
  if (!genesisSeed) fail('MIDNIGHT_GENESIS_SEED is not set (see README)');

  // 3. Environment configuration for the already-running mhelix stack
  //    (ports must match standalone.yml).
  const env = new LocalTestConfiguration({ indexer: 8088, node: 9944, proofServer: 6300 });

  // 4. Build the wallet explicitly (not via .build(), which logs the seed).
  //    Positive additionalFeeOverhead prevents devnet error 117 on the
  //    first contract call; value follows the official examples.
  const { wallet, seeds, keystore } = await FluentWalletBuilder.forEnvironment(env)
    .withDustOptions({
      ledgerParams: LedgerParameters.initialParameters(),
      additionalFeeOverhead: 500_000_000_000_000_000n,
      feeBlocksMargin: 5,
    })
    .withSeed(genesisSeed)
    .buildWithoutStarting();

  const walletProvider = await MidnightWalletProvider.withWallet(
    logger,
    env,
    wallet,
    ZswapSecretKeys.fromSeed(seeds.shielded),
    DustSecretKey.fromSeed(seeds.dust),
    keystore,
  );

  // 5. Start + sync; waitForFunds inside start() also self-registers the
  //    genesis NIGHT UTXOs for DUST generation when DUST balance is zero.
  await walletProvider.start(true);

  // 6. Assemble the six Midnight.js providers with the testkit helper
  //    (private state store name doubles as the levelDB directory prefix).
  const providers = initializeMidnightProviders<'recordCommitment', Record<string, never>>(
    walletProvider,
    env,
    { privateStateStoreName: `mhelix-smoke-${Date.now()}`, zkConfigPath: ZK_ARTIFACTS },
  );

  // 7. Build the CompiledContract with the official fluent pattern (matches
  //    example-hello-world and the testkit e2e suite): no witnesses, assets
  //    from the compile output directory. Then deploy.
  const compiledSmokeContract = CompiledContract.make(
    'MhelixSmokeCommitment',
    smokeContractModule.Contract,
  ).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(ZK_ARTIFACTS),
  );
  const deployed = await deployContract(providers, {
    compiledContract: compiledSmokeContract,
  });
  const contractAddress = deployed.deployTxData.public.contractAddress;

  // 8. ONE fresh randomized 32-byte commitment, submitted on-chain.
  const commitment = new Uint8Array(randomBytes(32));
  const callResult = await deployed.callTx.recordCommitment(commitment);
  const txData = callResult.public;

  // 9. Ledger readback THROUGH THE INDEXER (not from the tx result):
  //    query the contract state and decode it with the generated ledger()
  //    reader, then fail closed on any mismatch.
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  if (contractState == null) fail('indexer returned no contract state');
  const ledgerState = smokeContractModule.ledger(contractState.data);

  const countOk = ledgerState.commitmentCount === 1n;
  const readBackHex = toHex(ledgerState.latestCommitment);
  const commitmentOk = readBackHex === toHex(commitment);
  if (!countOk) fail(`commitmentCount is ${ledgerState.commitmentCount}, expected exactly 1`);
  if (!commitmentOk) fail('ledger latestCommitment does not match the submitted commitment');

  // 10. Sanitized receipt — ONLY public, non-reconstructible facts.
  const receipt = {
    label: 'VERIFIED LOCAL',
    networkId: 'undeployed',
    contractAddress,
    txId: txData.txId,
    blockHeight: txData.blockHeight,
    circuit: 'recordCommitment',
    publicCommitmentHex: readBackHex,
    checks: { commitmentCountIsOne: countOk, commitmentMatches: commitmentOk },
    sourceCommit,
    compiler: COMPILER_VERSION,
    images: IMAGE_VERSIONS,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(receipt, null, 2));

  await walletProvider.stop();
  process.exit(0);
}

main().catch((error) => {
  // Never dump full objects (they can embed wallet internals); message only.
  fail(error instanceof Error ? error.message : String(error));
});
