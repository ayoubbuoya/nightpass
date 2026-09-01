// SPDX-License-Identifier: Apache-2.0

import { Buffer } from "buffer";

// Some Midnight browser dependencies inspect these Node-compatible globals.
Object.defineProperty(globalThis, "process", {
  value: { env: { NODE_ENV: import.meta.env.MODE } },
  configurable: true,
});
globalThis.Buffer = Buffer;
