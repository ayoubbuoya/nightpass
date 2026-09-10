// SPDX-License-Identifier: Apache-2.0

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import {
  commitmentHex,
  createMemberCredential,
  decodeLabel,
  encodeLabel,
  safeErrorMessage,
  servicePseudonym,
  withMemberCredential,
  MembershipNotRegisteredError,
} from "../index.js";

setNetworkId("undeployed");

// Fills each requested buffer with a counter so successive calls differ, which
// is what the secret/salt pair needs in order to be distinguishable.
const sequentialCrypto = () => {
  let next = 1;
  return {
    getRandomValues<T extends ArrayBufferView | null>(array: T): T {
      if (array instanceof Uint8Array) array.fill(next++);
      return array;
    },
  };
};

const PLAN = encodeLabel("Builders Pro");
const OTHER_PLAN = encodeLabel("Research Pro");
const AUDIENCE_A = encodeLabel("builders.example");
const AUDIENCE_B = encodeLabel("research.example");

describe("labels", () => {
  it("round-trips a human-readable label through 32 fixed bytes", () => {
    const encoded = encodeLabel("Builders Pro");

    expect(encoded).toHaveLength(32);
    expect(decodeLabel(encoded)).toBe("Builders Pro");
  });

  it("rejects a label that does not fit the on-chain field", () => {
    expect(() => encodeLabel("x".repeat(33))).toThrow(
      "Label must encode to at most 32 bytes",
    );
  });

  it("accounts for multi-byte characters rather than character count", () => {
    // 11 characters, but 33 UTF-8 bytes.
    expect(() => encodeLabel("é".repeat(17))).toThrow(
      "Label must encode to at most 32 bytes",
    );
  });
});

describe("member credentials", () => {
  it("generates 32-byte private values and a public commitment", () => {
    const credential = createMemberCredential(PLAN, sequentialCrypto());

    expect(credential.secret).toHaveLength(32);
    expect(credential.salt).toHaveLength(32);
    expect(credential.commitment).toHaveLength(32);
    expect(commitmentHex(credential)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses a distinct secret and salt", () => {
    const credential = createMemberCredential(PLAN, sequentialCrypto());
    expect(credential.secret).not.toEqual(credential.salt);
  });

  it("binds the commitment to the plan", () => {
    const onPlan = createMemberCredential(PLAN, sequentialCrypto());
    const onOtherPlan = createMemberCredential(OTHER_PLAN, sequentialCrypto());

    // Same secret and salt, different plan, different commitment.
    expect(onPlan.secret).toEqual(onOtherPlan.secret);
    expect(onPlan.commitment).not.toEqual(onOtherPlan.commitment);
  });

  it("discards a stale opening path when the credential is replaced", () => {
    const credential = createMemberCredential(PLAN, sequentialCrypto());
    const stale = {
      issuerSecret: new Uint8Array(32),
      memberSecret: new Uint8Array(32),
      memberSalt: new Uint8Array(32),
      membershipPath: { leaf: { commitment: new Uint8Array(32), expiresAt: 1n }, path: [] },
    };

    expect(withMemberCredential(stale, credential).membershipPath).toBeUndefined();
  });
});

describe("service pseudonyms", () => {
  it("differs across audiences for the same member", () => {
    const credential = createMemberCredential(PLAN, sequentialCrypto());

    expect(servicePseudonym(credential, AUDIENCE_A)).not.toEqual(
      servicePseudonym(credential, AUDIENCE_B),
    );
  });

  it("is stable for the same member and audience", () => {
    const credential = createMemberCredential(PLAN, sequentialCrypto());

    expect(servicePseudonym(credential, AUDIENCE_A)).toEqual(
      servicePseudonym(credential, AUDIENCE_A),
    );
  });

  it("never equals the membership commitment", () => {
    const credential = createMemberCredential(PLAN, sequentialCrypto());

    expect(servicePseudonym(credential, AUDIENCE_A)).not.toEqual(
      credential.commitment,
    );
  });
});

describe("error sanitization", () => {
  it("returns only allow-listed contract errors", () => {
    expect(safeErrorMessage(new Error("internal: Membership has expired"))).toBe(
      "Membership has expired",
    );
    expect(
      safeErrorMessage(new Error("failed assert: Access challenge was already used")),
    ).toBe("Access challenge was already used");
  });

  it("suppresses any message it does not recognize", () => {
    expect(safeErrorMessage(new Error("secret=do-not-expose"))).toBe(
      "The Midnight transaction could not be completed",
    );
    expect(safeErrorMessage({ memberSalt: "leak" })).toBe(
      "The Midnight transaction could not be completed",
    );
  });

  it("passes the unregistered-membership error through unchanged", () => {
    expect(safeErrorMessage(new MembershipNotRegisteredError())).toBe(
      "Membership is not registered",
    );
  });
});
