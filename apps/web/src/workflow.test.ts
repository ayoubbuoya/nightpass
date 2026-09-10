// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  DEMO_PLAN,
  PRIMARY_AUDIENCE,
  RIVAL_AUDIENCE,
  defaultExpiryInput,
  expiryToUnixSeconds,
  formatDuration,
  formatPrice,
  maxExpiryInput,
  shortHex,
} from "./workflow.js";

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

  it("offers a maximum expiry matching the published plan duration", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    const value = maxExpiryInput(DEMO_PLAN, now);

    expect(new Date(value).getTime() - now.getTime()).toBe(
      Number(DEMO_PLAN.durationSeconds) * 1_000,
    );
  });

  it("keeps the default expiry inside the published plan duration", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    expect(new Date(defaultExpiryInput(now)).getTime()).toBeLessThanOrEqual(
      new Date(maxExpiryInput(DEMO_PLAN, now)).getTime(),
    );
  });

  it("uses two distinct audiences so wrong-audience rejection is provable", () => {
    expect(PRIMARY_AUDIENCE).not.toBe(RIVAL_AUDIENCE);
  });

  it("formats the published policy for display", () => {
    expect(formatDuration(DEMO_PLAN.durationSeconds)).toBe("30 days");
    expect(formatDuration(3_600n)).toBe("1 hours");
    expect(formatPrice(5_000_000n)).toBe("5.00 test NIGHT");
  });

  it("abbreviates long public values without altering short ones", () => {
    expect(shortHex("abc")).toBe("abc");
    expect(shortHex("a".repeat(64))).toContain("…");
  });
});
