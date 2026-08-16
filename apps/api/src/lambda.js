// SPDX-License-Identifier: Apache-2.0

import {
  createLazyCockroachDbProvider,
  createLazyVectorMemoryProvider,
} from "./cockroach-bootstrap.js";
import { createHandler } from "./handler.js";

// Deployment entrypoint. Both providers are lazy: nothing touches the network
// until a request needs it, and any initialization failure keeps the affected
// capability fail-closed rather than crashing the function.
export const handler = createHandler({
  cockroachProvider: createLazyCockroachDbProvider(),
  vectorMemoryProvider: createLazyVectorMemoryProvider(),
});
