// SPDX-License-Identifier: Apache-2.0

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import { createPrivateState } from "../private-state.js";
import { NightPassSimulator } from "./nightpass-simulator.js";

setNetworkId("undeployed");

const bytes = (value: number): Uint8Array => new Uint8Array(32).fill(value);

const ISSUER_SECRET = bytes(1);
const WRONG_ISSUER_SECRET = bytes(2);
const MEMBER_SECRET = bytes(3);
const MEMBER_SALT = bytes(4);
const WRONG_MEMBER_SECRET = bytes(5);
const UNUSED_SECRET = bytes(6);
const UNUSED_SALT = bytes(7);
const EMPTY = bytes(0);

const issuerState = createPrivateState(ISSUER_SECRET, EMPTY, EMPTY);
const unauthorizedIssuerState = createPrivateState(
  WRONG_ISSUER_SECRET,
  EMPTY,
  EMPTY,
);
const memberState = createPrivateState(EMPTY, MEMBER_SECRET, MEMBER_SALT);
const wrongMemberState = createPrivateState(
  EMPTY,
  WRONG_MEMBER_SECRET,
  MEMBER_SALT,
);
const unregisteredMemberState = createPrivateState(
  EMPTY,
  UNUSED_SECRET,
  UNUSED_SALT,
);

const ISSUED_AT = 1_000;
const EXPIRES_AT = 2_000n;

const setupIssuedMembership = () => {
  const simulator = new NightPassSimulator(issuerState);
  const commitment = simulator.deriveMembershipCommitment(
    MEMBER_SECRET,
    MEMBER_SALT,
  );
  simulator.issueMembership(issuerState, commitment, EXPIRES_AT, ISSUED_AT);
  return { simulator, commitment };
};

describe("NightPass membership contract", () => {
  it("initializes the issuer commitment and an empty membership registry", () => {
    const simulator = new NightPassSimulator(issuerState);
    const state = simulator.getLedger();

    expect(state.issuerCommitment).toEqual(
      simulator.deriveIssuerCommitment(ISSUER_SECRET),
    );
    expect(state.memberships.isEmpty()).toBe(true);
  });

  it("allows the issuer to register a membership commitment", () => {
    const { simulator, commitment } = setupIssuedMembership();
    const state = simulator.getLedger();

    expect(state.memberships.size()).toBe(1n);
    expect(state.memberships.member(commitment)).toBe(true);
    expect(state.memberships.lookup(commitment)).toBe(EXPIRES_AT);
  });

  it("rejects issuance by an actor without the issuer secret", () => {
    const simulator = new NightPassSimulator(issuerState);
    const commitment = simulator.deriveMembershipCommitment(
      MEMBER_SECRET,
      MEMBER_SALT,
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

  it("rejects a duplicate membership commitment", () => {
    const { simulator, commitment } = setupIssuedMembership();

    expect(() =>
      simulator.issueMembership(
        issuerState,
        commitment,
        EXPIRES_AT + 1_000n,
        ISSUED_AT,
      ),
    ).toThrow("Membership already exists");
  });

  it("rejects an expiry that is not strictly in the future", () => {
    const simulator = new NightPassSimulator(issuerState);
    const commitment = simulator.deriveMembershipCommitment(
      MEMBER_SECRET,
      MEMBER_SALT,
    );

    expect(() =>
      simulator.issueMembership(
        issuerState,
        commitment,
        BigInt(ISSUED_AT),
        ISSUED_AT,
      ),
    ).toThrow("Membership expiry must be in the future");
  });

  it("authorizes the member before and at the expiry boundary", () => {
    const beforeExpiry = setupIssuedMembership().simulator;
    const atExpiry = setupIssuedMembership().simulator;

    expect(() =>
      beforeExpiry.assertActiveMembership(memberState, Number(EXPIRES_AT) - 1),
    ).not.toThrow();
    expect(() =>
      atExpiry.assertActiveMembership(memberState, Number(EXPIRES_AT)),
    ).not.toThrow();
  });

  it("rejects a member with an incorrect secret", () => {
    const { simulator } = setupIssuedMembership();

    expect(() =>
      simulator.assertActiveMembership(wrongMemberState, ISSUED_AT + 1),
    ).toThrow("Membership is not registered");
  });

  it("rejects an unregistered membership", () => {
    const simulator = new NightPassSimulator(issuerState);

    expect(() =>
      simulator.assertActiveMembership(unregisteredMemberState, ISSUED_AT),
    ).toThrow("Membership is not registered");
  });

  it("rejects a membership after its expiry", () => {
    const { simulator } = setupIssuedMembership();

    expect(() =>
      simulator.assertActiveMembership(memberState, Number(EXPIRES_AT) + 1),
    ).toThrow("Membership has expired");
  });
});
