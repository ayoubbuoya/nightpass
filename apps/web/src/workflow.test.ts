// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { defaultExpiryInput, expiryToUnixSeconds } from "./workflow.js";

describe("frontend workflow utilities", () => {
  it("converts an expiry input to Unix seconds", () => {
    expect(expiryToUnixSeconds("2030-01-01T00:00:00Z")).toBe(1_893_456_000n);
  });

  it("creates a default expiry one hour in the future", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    const value = defaultExpiryInput(now);
    expect(new Date(value).getTime() - now.getTime()).toBe(60 * 60 * 1_000);
  });

  it("rejects an invalid expiry", () => {
    expect(() => expiryToUnixSeconds("not-a-date")).toThrow("valid expiry");
  });
});
