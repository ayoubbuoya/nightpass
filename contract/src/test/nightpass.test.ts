// SPDX-License-Identifier: Apache-2.0

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import { createPrivateState } from "../private-state.js";
import { NightPassSimulator, type PlanPolicy } from "./nightpass-simulator.js";

setNetworkId("undeployed");

// Deterministic synthetic material. Never replace these with wallet seeds or
// real credential material.
const bytes = (value: number): Uint8Array => new Uint8Array(32).fill(value);

const ISSUER_SECRET = bytes(1);
const WRONG_ISSUER_SECRET = bytes(2);
const ALICE_SECRET = bytes(3);
const ALICE_SALT = bytes(4);
const MALLORY_SECRET = bytes(5);
const BOB_SECRET = bytes(6);
const BOB_SALT = bytes(7);
const EMPTY = bytes(0);

// Two unrelated protected services.
const AUDIENCE_BUILDERS = bytes(20);
const AUDIENCE_RESEARCH = bytes(21);

const CHALLENGE_ONE = bytes(30);
const CHALLENGE_TWO = bytes(31);
const CHALLENGE_THREE = bytes(32);

const PLAN_NAME = bytes(10);
const OTHER_PLAN_NAME = bytes(11);
const PLAN: PlanPolicy = {
  name: PLAN_NAME,
  priceMicroNight: 5_000n,
  durationSeconds: 2_000n,
};

const ISSUED_AT = 1_000;
const EXPIRES_AT = 2_500n;

const issuerState = createPrivateState(ISSUER_SECRET, EMPTY, EMPTY);
const unauthorizedIssuerState = createPrivateState(
  WRONG_ISSUER_SECRET,
  EMPTY,
  EMPTY,
);

// Issues Alice a membership and gives her the opening path she would rebuild
// from public ledger state in the browser.
const setupIssuedMembership = () => {
  const simulator = new NightPassSimulator(issuerState, PLAN);
  const commitment = simulator.deriveMembershipCommitment(
    PLAN_NAME,
    ALICE_SECRET,
    ALICE_SALT,
  );
  simulator.issueMembership(issuerState, commitment, EXPIRES_AT, ISSUED_AT);

  const path = simulator.findMembershipPath({
    commitment,
    expiresAt: EXPIRES_AT,
  });
  if (!path) throw new Error("test setup failed to locate the membership leaf");

  const alice = createPrivateState(EMPTY, ALICE_SECRET, ALICE_SALT, path);
  return { simulator, commitment, path, alice };
};

describe("plan policy", () => {
  it("publishes the plan name, price, and duration", () => {
    const simulator = new NightPassSimulator(issuerState, PLAN);
    const state = simulator.getLedger();

    expect(state.planName).toEqual(PLAN_NAME);
    expect(state.planPriceMicroNight).toBe(PLAN.priceMicroNight);
    expect(state.planDurationSeconds).toBe(PLAN.durationSeconds);
  });

  it("initializes the issuer commitment and an empty membership tree", () => {
    const simulator = new NightPassSimulator(issuerState, PLAN);
    const state = simulator.getLedger();

    expect(state.issuerCommitment).toEqual(
      simulator.deriveIssuerCommitment(ISSUER_SECRET),
    );
    expect(state.memberships.firstFree()).toBe(0n);
    expect(state.accessLog.isEmpty()).toBe(true);
  });
});

describe("issuance", () => {
  it("registers a membership leaf for the issuer", () => {
    const { simulator } = setupIssuedMembership();
    expect(simulator.getLedger().memberships.firstFree()).toBe(1n);
  });

  it("rejects issuance by an actor without the issuer secret", () => {
    const simulator = new NightPassSimulator(issuerState, PLAN);
    const commitment = simulator.deriveMembershipCommitment(
      PLAN_NAME,
      ALICE_SECRET,
      ALICE_SALT,
    );

    expect(() =>
      simulator.issueMembership(
        unauthorizedIssuerState,
        commitment,
        EXPIRES_AT,
        ISSUED_AT,
      ),
    ).toThrow("Only the issuer can issue a membership");
  });

  it("rejects an expiry that is not strictly in the future", () => {
    const { simulator } = setupIssuedMembership();

    expect(() =>
      simulator.issueMembership(
        issuerState,
        bytes(90),
        BigInt(ISSUED_AT),
        ISSUED_AT,
      ),
    ).toThrow("Membership expiry must be in the future");
  });

  it("rejects an expiry beyond the published plan duration", () => {
    const { simulator } = setupIssuedMembership();
    const beyondPolicy = BigInt(ISSUED_AT) + PLAN.durationSeconds + 1n;

    expect(() =>
      simulator.issueMembership(issuerState, bytes(91), beyondPolicy, ISSUED_AT),
    ).toThrow("Membership expiry exceeds the published plan duration");
  });

  it("accepts an expiry exactly at the published duration boundary", () => {
    const { simulator } = setupIssuedMembership();
    const atPolicy = BigInt(ISSUED_AT) + PLAN.durationSeconds;

    expect(() =>
      simulator.issueMembership(issuerState, bytes(92), atPolicy, ISSUED_AT),
    ).not.toThrow();
  });
});

describe("access authorization", () => {
  it("authorizes a member and records only a per-audience receipt", () => {
    const { simulator, alice, commitment } = setupIssuedMembership();

    simulator.proveAccess(
      alice,
      AUDIENCE_BUILDERS,
      CHALLENGE_ONE,
      ISSUED_AT + 1,
    );

    const state = simulator.getLedger();
    const key = simulator.deriveSessionKey(AUDIENCE_BUILDERS, CHALLENGE_ONE);
    const record = state.accessLog.lookup(key);

    expect(record.audience).toEqual(AUDIENCE_BUILDERS);
    expect(record.expiresAt).toBe(EXPIRES_AT);
    // The privacy invariant: the receipt must not carry the member commitment.
    expect(record.pseudonym).not.toEqual(commitment);
  });

  it("authorizes before and exactly at the inclusive expiry boundary", () => {
    const before = setupIssuedMembership();
    const at = setupIssuedMembership();

    expect(() =>
      before.simulator.proveAccess(
        before.alice,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        Number(EXPIRES_AT) - 1,
      ),
    ).not.toThrow();
    expect(() =>
      at.simulator.proveAccess(
        at.alice,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        Number(EXPIRES_AT),
      ),
    ).not.toThrow();
  });

  it("rejects a membership after its expiry", () => {
    const { simulator, alice } = setupIssuedMembership();

    expect(() =>
      simulator.proveAccess(
        alice,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        Number(EXPIRES_AT) + 1,
      ),
    ).toThrow("Membership has expired");
  });

  it("rejects a non-member holding a copied opening path", () => {
    const { simulator, path } = setupIssuedMembership();
    // Bob scraped Alice's path out of public ledger state but cannot open it.
    const bob = createPrivateState(EMPTY, BOB_SECRET, BOB_SALT, path);

    expect(() =>
      simulator.proveAccess(bob, AUDIENCE_BUILDERS, CHALLENGE_ONE, ISSUED_AT + 1),
    ).toThrow("Credential does not open the membership record");
  });

  it("rejects a member whose secret is wrong but whose salt is right", () => {
    const { simulator, path } = setupIssuedMembership();
    const mallory = createPrivateState(EMPTY, MALLORY_SECRET, ALICE_SALT, path);

    expect(() =>
      simulator.proveAccess(
        mallory,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        ISSUED_AT + 1,
      ),
    ).toThrow("Credential does not open the membership record");
  });

  it("rejects a credential issued under a different plan name", () => {
    const simulator = new NightPassSimulator(issuerState, {
      ...PLAN,
      name: PLAN_NAME,
    });
    // A leaf registered for the wrong plan cannot be opened by this contract's
    // plan-bound commitment derivation.
    const foreignCommitment = simulator.deriveMembershipCommitment(
      OTHER_PLAN_NAME,
      ALICE_SECRET,
      ALICE_SALT,
    );
    simulator.issueMembership(
      issuerState,
      foreignCommitment,
      EXPIRES_AT,
      ISSUED_AT,
    );
    const path = simulator.findMembershipPath({
      commitment: foreignCommitment,
      expiresAt: EXPIRES_AT,
    });
    if (!path) throw new Error("test setup failed to locate the leaf");

    const alice = createPrivateState(EMPTY, ALICE_SECRET, ALICE_SALT, path);

    expect(() =>
      simulator.proveAccess(
        alice,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        ISSUED_AT + 1,
      ),
    ).toThrow("Credential does not open the membership record");
  });

  it("rejects an opening path whose root was never registered", () => {
    const { path } = setupIssuedMembership();
    // A second, unrelated contract instance: the leaf exists only in the first.
    const fresh = new NightPassSimulator(issuerState, PLAN);
    const alice = createPrivateState(EMPTY, ALICE_SECRET, ALICE_SALT, path);

    expect(() =>
      fresh.proveAccess(alice, AUDIENCE_BUILDERS, CHALLENGE_ONE, ISSUED_AT + 1),
    ).toThrow("Membership is not registered");
  });

  it("fails closed when the member has no opening path at all", () => {
    const { simulator } = setupIssuedMembership();
    const unissued = createPrivateState(EMPTY, BOB_SECRET, BOB_SALT);

    expect(() =>
      simulator.proveAccess(
        unissued,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        ISSUED_AT + 1,
      ),
    ).toThrow("Membership is not registered");
  });
});

describe("challenge binding and replay protection", () => {
  it("rejects a replayed challenge at the same audience", () => {
    const { simulator, alice } = setupIssuedMembership();

    simulator.proveAccess(
      alice,
      AUDIENCE_BUILDERS,
      CHALLENGE_ONE,
      ISSUED_AT + 1,
    );

    expect(() =>
      simulator.proveAccess(
        alice,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        ISSUED_AT + 2,
      ),
    ).toThrow("Access challenge was already used");
  });

  it("rejects a replay attempted by a different member", () => {
    const { simulator, alice } = setupIssuedMembership();
    const secondCommitment = simulator.deriveMembershipCommitment(
      PLAN_NAME,
      BOB_SECRET,
      BOB_SALT,
    );
    simulator.issueMembership(
      issuerState,
      secondCommitment,
      EXPIRES_AT,
      ISSUED_AT,
    );
    const bobPath = simulator.findMembershipPath({
      commitment: secondCommitment,
      expiresAt: EXPIRES_AT,
    });
    if (!bobPath) throw new Error("test setup failed to locate Bob's leaf");
    const bob = createPrivateState(EMPTY, BOB_SECRET, BOB_SALT, bobPath);

    simulator.proveAccess(
      alice,
      AUDIENCE_BUILDERS,
      CHALLENGE_ONE,
      ISSUED_AT + 1,
    );

    // A challenge is consumed globally, not per member.
    expect(() =>
      simulator.proveAccess(
        bob,
        AUDIENCE_BUILDERS,
        CHALLENGE_ONE,
        ISSUED_AT + 2,
      ),
    ).toThrow("Access challenge was already used");
  });

  it("accepts a fresh challenge at the same audience", () => {
    const { simulator, alice } = setupIssuedMembership();

    simulator.proveAccess(
      alice,
      AUDIENCE_BUILDERS,
      CHALLENGE_ONE,
      ISSUED_AT + 1,
    );

    expect(() =>
      simulator.proveAccess(
        alice,
        AUDIENCE_BUILDERS,
        CHALLENGE_TWO,
        ISSUED_AT + 2,
      ),
    ).not.toThrow();
  });

  it("makes a proof minted for another audience invisible to this one", () => {
    const { simulator, alice } = setupIssuedMembership();

    // Alice proves to the research service using the builders service's
    // challenge. The builders service looks under its own session key.
    simulator.proveAccess(
      alice,
      AUDIENCE_RESEARCH,
      CHALLENGE_ONE,
      ISSUED_AT + 1,
    );

    const state = simulator.getLedger();
    const buildersKey = simulator.deriveSessionKey(
      AUDIENCE_BUILDERS,
      CHALLENGE_ONE,
    );
    const researchKey = simulator.deriveSessionKey(
      AUDIENCE_RESEARCH,
      CHALLENGE_ONE,
    );

    expect(state.accessLog.member(buildersKey)).toBe(false);
    expect(state.accessLog.member(researchKey)).toBe(true);
  });

  it("issues unlinkable pseudonyms to unrelated services", () => {
    const { simulator, alice } = setupIssuedMembership();

    simulator.proveAccess(
      alice,
      AUDIENCE_BUILDERS,
      CHALLENGE_ONE,
      ISSUED_AT + 1,
    );
    simulator.proveAccess(
      alice,
      AUDIENCE_RESEARCH,
      CHALLENGE_TWO,
      ISSUED_AT + 2,
    );

    const state = simulator.getLedger();
    const builders = state.accessLog.lookup(
      simulator.deriveSessionKey(AUDIENCE_BUILDERS, CHALLENGE_ONE),
    );
    const research = state.accessLog.lookup(
      simulator.deriveSessionKey(AUDIENCE_RESEARCH, CHALLENGE_TWO),
    );

    expect(builders.pseudonym).not.toEqual(research.pseudonym);
  });

  it("gives the same member a stable pseudonym at one service", () => {
    const { simulator, alice } = setupIssuedMembership();

    simulator.proveAccess(
      alice,
      AUDIENCE_BUILDERS,
      CHALLENGE_ONE,
      ISSUED_AT + 1,
    );
    simulator.proveAccess(
      alice,
      AUDIENCE_BUILDERS,
      CHALLENGE_THREE,
      ISSUED_AT + 2,
    );

    const state = simulator.getLedger();
    const first = state.accessLog.lookup(
      simulator.deriveSessionKey(AUDIENCE_BUILDERS, CHALLENGE_ONE),
    );
    const second = state.accessLog.lookup(
      simulator.deriveSessionKey(AUDIENCE_BUILDERS, CHALLENGE_THREE),
    );

    expect(first.pseudonym).toEqual(second.pseudonym);
  });
});
