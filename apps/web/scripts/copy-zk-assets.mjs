// SPDX-License-Identifier: Apache-2.0

import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dirname, "..");
const generatedRoot = resolve(
  appRoot,
  "../../contract/src/managed/nightpass",
);
const publicRoot = resolve(appRoot, "public");

await mkdir(publicRoot, { recursive: true });

for (const directory of ["keys", "zkir"]) {
  const destination = resolve(publicRoot, directory);
  await rm(destination, { recursive: true, force: true });
  await cp(resolve(generatedRoot, directory), destination, { recursive: true });
}
