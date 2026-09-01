// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  commitmentHex,
  createMemberCredential,
  safeErrorMessage,
} from "../index.js";

const deterministicCrypto = {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T {
    if (array instanceof Uint8Array) array.fill(7);
    return array;
  },
};

describe("member credentials", () => {
  it("generates 32-byte private values and a public commitment", () => {
    const credential = createMemberCredential(deterministicCrypto);

    expect(credential.secret).toHaveLength(32);
    expect(credential.salt).toHaveLength(32);
    expect(credential.commitment).toHaveLength(32);
    expect(commitmentHex(credential)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns only allow-listed contract errors", () => {
    expect(safeErrorMessage(new Error("internal: Membership has expired"))).toBe(
      "Membership has expired",
    );
    expect(safeErrorMessage(new Error("secret=do-not-expose"))).toBe(
      "The Midnight transaction could not be completed",
    );
  });
});
