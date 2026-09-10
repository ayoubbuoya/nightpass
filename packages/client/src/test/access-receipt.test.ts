// SPDX-License-Identifier: Apache-2.0

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it, vi } from "vitest";
import { NightPassClient, encodeLabel, type AccessReceipt } from "../index.js";

setNetworkId("undeployed");

const AUDIENCE = encodeLabel("builders.example");
const CHALLENGE = new Uint8Array(32).fill(5);

const RECEIPT: AccessReceipt = {
  audience: AUDIENCE,
  pseudonym: new Uint8Array(32).fill(9),
  expiresAt: 1_800_000_000n,
};

// Exercises waitForAccessReceipt's retry loop directly against a stubbed
// readAccessReceipt, so the indexer-lag behaviour is tested without a network.
const clientWithReads = (
  reads: ReadonlyArray<AccessReceipt | undefined>,
): { client: NightPassClient; calls: () => number } => {
  let index = 0;
  const client = Object.create(NightPassClient.prototype) as NightPassClient;
  Object.defineProperty(client, "readAccessReceipt", {
    value: async () => reads[Math.min(index++, reads.length - 1)],
  });
  return { client, calls: () => index };
};

describe("waitForAccessReceipt", () => {
  it("returns immediately when the receipt is already indexed", async () => {
    const { client, calls } = clientWithReads([RECEIPT]);

    await expect(
      client.waitForAccessReceipt(AUDIENCE, CHALLENGE),
    ).resolves.toEqual(RECEIPT);
    expect(calls()).toBe(1);
  });

  it("retries through indexer lag before succeeding", async () => {
    vi.useFakeTimers();
    const { client, calls } = clientWithReads([undefined, undefined, RECEIPT]);

    const pending = client.waitForAccessReceipt(AUDIENCE, CHALLENGE, {
      attempts: 5,
      delayMs: 10,
    });
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toEqual(RECEIPT);
    expect(calls()).toBe(3);
    vi.useRealTimers();
  });

  it("gives up and reports no proof when none was ever submitted", async () => {
    vi.useFakeTimers();
    const { client, calls } = clientWithReads([undefined]);

    const pending = client.waitForAccessReceipt(AUDIENCE, CHALLENGE, {
      attempts: 3,
      delayMs: 10,
    });
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toBeUndefined();
    // Exactly the configured number of attempts, no more.
    expect(calls()).toBe(3);
    vi.useRealTimers();
  });
});
