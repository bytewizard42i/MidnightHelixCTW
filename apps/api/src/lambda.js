// SPDX-License-Identifier: Apache-2.0

import { createLazyCockroachDbProvider } from "./cockroach-bootstrap.js";
import { createHandler } from "./handler.js";

export const handler = createHandler({
  cockroachProvider: createLazyCockroachDbProvider(),
});
