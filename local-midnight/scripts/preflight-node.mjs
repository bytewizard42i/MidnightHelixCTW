// Fail-fast Node.js version preflight.
//
// Why this exists: the Midnight wallet SDK (Software Development Kit)
// requires Node.js 22 or newer (it uses Iterator helpers; Node.js 20
// crashes at first wallet sync). A machine can easily have an older
// default Node.js in noninteractive shells even when an interactive shell
// uses the right one, so every compile / smoke / network command runs this
// check first and stops BEFORE any network work with a useful message.
//
// This script itself runs on any Node.js version — it only reads
// process.version and exits.

import { readFileSync } from 'node:fs';

const REQUIRED_MAJOR = 22;
const currentMajor = Number(process.version.slice(1).split('.')[0]);

let pinned = 'see .nvmrc';
try {
  pinned = readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim();
} catch {
  // .nvmrc missing is not fatal for the message; the major check still runs.
}

if (Number.isNaN(currentMajor) || currentMajor < REQUIRED_MAJOR) {
  console.error(
    [
      `PREFLIGHT FAIL: Node.js ${process.version} is too old for the Midnight`,
      `wallet SDK (Software Development Kit); major version ${REQUIRED_MAJOR}+ is required.`,
      '',
      'To activate the pinned version with nvm (Node Version Manager):',
      `  nvm install ${pinned}`,
      `  nvm use ${pinned}`,
      '',
      'In noninteractive shells (scripts, CI (Continuous Integration), editors),',
      'ensure PATH resolves a Node.js 22+ binary, for example:',
      `  export PATH="$HOME/.nvm/versions/node/v${pinned}/bin:$PATH"`,
      '',
      'Stopping before any compile or network work.',
    ].join('\n'),
  );
  process.exit(1);
}

console.log(`preflight ok: Node.js ${process.version} (requires ${REQUIRED_MAJOR}+, pinned ${pinned})`);
