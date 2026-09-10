// SPDX-License-Identifier: Apache-2.0

import { encodeLabel } from "@nightpass/client";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { beforeEach, describe, expect, it } from "vitest";
import { ProtectedService, type AccessReceipt } from "../index.js";

setNetworkId("undeployed");

const AUDIENCE = "builders.example";
const OTHER_AUDIENCE = "research.example";

const PSEUDONYM = new Uint8Array(32).fill(42);
const OTHER_PSEUDONYM = new Uint8Array(32).fill(43);

// A controllable clock, so challenge and session expiry are tested rather than
// waited for.
const makeClock = (start = 1_000_000) => {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
};

const sequentialCrypto = () => {
  let next = 1;
  return {
    getRandomValues<T extends ArrayBufferView | null>(array: T): T {
      if (array instanceof Uint8Array) array.fill(next++);
      return array;
    },
  };
};

const receiptFor = (
  audience: string,
  pseudonym: Uint8Array,
  expiresAtMs: number,
): AccessReceipt => ({
  audience: encodeLabel(audience),
  pseudonym,
  expiresAt: BigInt(Math.floor(expiresAtMs / 1_000)),
});

describe("ProtectedService", () => {
  let clock: ReturnType<typeof makeClock>;
  let service: ProtectedService;

  beforeEach(() => {
    clock = makeClock();
    service = new ProtectedService({
      audience: AUDIENCE,
      now: clock.now,
      cryptoSource: sequentialCrypto(),
      challengeTtlMs: 60_000,
      sessionTtlMs: 600_000,
    });
  });

  const validReceipt = () =>
    receiptFor(AUDIENCE, PSEUDONYM, clock.now() + 3_600_000);

  describe("challenges", () => {
    it("mints a fresh 32-byte challenge that is pending", () => {
      const challenge = service.issueChallenge();

      expect(challenge.value).toHaveLength(32);
      expect(service.isPending(challenge.value)).toBe(true);
    });

    it("mints a different challenge each time", () => {
      expect(service.issueChallenge().value).not.toEqual(
        service.issueChallenge().value,
      );
    });

    it("stops treating a challenge as pending once it expires", () => {
      const challenge = service.issueChallenge();
      clock.advance(60_001);

      expect(service.isPending(challenge.value)).toBe(false);
    });
  });

  describe("granting", () => {
    it("opens a session bound to the per-service pseudonym", () => {
      const challenge = service.issueChallenge();
      const verdict = service.redeem(challenge.value, validReceipt());

      expect(verdict.outcome).toBe("granted");
      if (verdict.outcome !== "granted") return;
      expect(verdict.session.audience).toBe(AUDIENCE);
      expect(verdict.session.pseudonym).toMatch(/^[0-9a-f]{64}$/);
      expect(verdict.session.returning).toBe(false);
    });

    it("recognizes a returning pseudonym without learning an identity", () => {
      service.redeem(service.issueChallenge().value, validReceipt());
      const second = service.redeem(
        service.issueChallenge().value,
        validReceipt(),
      );

      expect(second.outcome).toBe("granted");
      if (second.outcome !== "granted") return;
      expect(second.session.returning).toBe(true);
    });

    it("treats a different pseudonym as a different member", () => {
      service.redeem(service.issueChallenge().value, validReceipt());
      const other = service.redeem(
        service.issueChallenge().value,
        receiptFor(AUDIENCE, OTHER_PSEUDONYM, clock.now() + 3_600_000),
      );

      expect(other.outcome).toBe("granted");
      if (other.outcome !== "granted") return;
      expect(other.session.returning).toBe(false);
    });

    it("caps the session at the membership expiry", () => {
      const challenge = service.issueChallenge();
      // Membership outlives the challenge but not the full session TTL.
      const verdict = service.redeem(
        challenge.value,
        receiptFor(AUDIENCE, PSEUDONYM, clock.now() + 120_000),
      );

      expect(verdict.outcome).toBe("granted");
      if (verdict.outcome !== "granted") return;
      expect(verdict.session.expiresAt).toBe(clock.now() + 120_000);
    });

    it("caps the session at the service session TTL when the membership is longer", () => {
      const verdict = service.redeem(
        service.issueChallenge().value,
        validReceipt(),
      );

      expect(verdict.outcome).toBe("granted");
      if (verdict.outcome !== "granted") return;
      expect(verdict.session.expiresAt).toBe(clock.now() + 600_000);
    });
  });

  describe("denials", () => {
    const expectDenied = (
      verdict: ReturnType<ProtectedService["redeem"]>,
      reason: string,
    ) => {
      expect(verdict.outcome).toBe("denied");
      if (verdict.outcome !== "denied") return;
      expect(verdict.reason).toBe(reason);
      expect(verdict.message.length).toBeGreaterThan(0);
    };

    it("refuses a challenge this service never issued", () => {
      expectDenied(
        service.redeem(new Uint8Array(32).fill(9), validReceipt()),
        "unknown-challenge",
      );
    });

    it("refuses a challenge that has expired", () => {
      const challenge = service.issueChallenge();
      clock.advance(60_001);

      expectDenied(
        service.redeem(challenge.value, validReceipt()),
        "challenge-expired",
      );
    });

    it("refuses a replayed challenge", () => {
      const challenge = service.issueChallenge();
      service.redeem(challenge.value, validReceipt());

      expectDenied(
        service.redeem(challenge.value, validReceipt()),
        "challenge-consumed",
      );
    });

    it("refuses when no proof was recorded on chain", () => {
      expectDenied(
        service.redeem(service.issueChallenge().value, undefined),
        "no-proof",
      );
    });

    it("refuses a proof minted for a different audience", () => {
      const challenge = service.issueChallenge();

      expectDenied(
        service.redeem(
          challenge.value,
          receiptFor(OTHER_AUDIENCE, PSEUDONYM, clock.now() + 3_600_000),
        ),
        "audience-mismatch",
      );
    });

    it("refuses a proof whose membership has since expired", () => {
      const challenge = service.issueChallenge();

      expectDenied(
        service.redeem(
          challenge.value,
          receiptFor(AUDIENCE, PSEUDONYM, clock.now() - 1_000),
        ),
        "membership-expired",
      );
    });

    it("does not consume the challenge when the proof is missing", () => {
      const challenge = service.issueChallenge();
      service.redeem(challenge.value, undefined);

      // The member can still complete the proof and retry with the same
      // challenge while it remains fresh.
      expect(service.redeem(challenge.value, validReceipt()).outcome).toBe(
        "granted",
      );
    });
  });

  describe("audience isolation", () => {
    it("gives two services different audience bytes", () => {
      const other = new ProtectedService({
        audience: OTHER_AUDIENCE,
        now: clock.now,
        cryptoSource: sequentialCrypto(),
      });

      expect(other.audienceBytes).not.toEqual(service.audienceBytes);
    });

    it("refuses a challenge minted by a different service", () => {
      const other = new ProtectedService({
        audience: OTHER_AUDIENCE,
        now: clock.now,
        cryptoSource: sequentialCrypto(),
      });
      const foreign = other.issueChallenge();

      const verdict = service.redeem(foreign.value, validReceipt());
      expect(verdict.outcome).toBe("denied");
      if (verdict.outcome !== "denied") return;
      expect(verdict.reason).toBe("unknown-challenge");
    });
  });
});
