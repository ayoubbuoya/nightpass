// SPDX-License-Identifier: Apache-2.0

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type {
  Ledger,
  Witnesses,
} from "./managed/nightpass/contract/index.js";

// The opening path a member holds into the public membership tree. It is
// rebuilt from public ledger state, but the leaf and its index are kept private
// so that proving membership does not reveal which membership was used.
//
// Derived from the generated witness signature so the shape cannot drift away
// from what the compiled circuit expects.
export type MembershipPath = ReturnType<
  Witnesses<unknown>["localMembershipPath"]
>[1];

export type NightPassPrivateState = Readonly<{
  issuerSecret: Uint8Array;
  memberSecret: Uint8Array;
  memberSalt: Uint8Array;
  // Absent until the member has been issued and has located their leaf.
  membershipPath?: MembershipPath;
}>;

export const createPrivateState = (
  issuerSecret: Uint8Array,
  memberSecret: Uint8Array,
  memberSalt: Uint8Array,
  membershipPath?: MembershipPath,
): NightPassPrivateState => ({
  issuerSecret,
  memberSecret,
  memberSalt,
  membershipPath,
});

// A membership path is only meaningful once the member has been issued. Failing
// loudly here keeps the browser from submitting a proof that cannot succeed,
// and keeps the reason out of any value that might be logged.
const requirePath = (state: NightPassPrivateState): MembershipPath => {
  if (!state.membershipPath) {
    throw new Error("Membership is not registered");
  }
  return state.membershipPath;
};

// Witnesses return private values only to the local Compact runtime. Do not add
// logging, telemetry, or error messages containing these values.
export const witnesses = {
  localIssuerSecret: ({
    privateState,
  }: WitnessContext<Ledger, NightPassPrivateState>): [
    NightPassPrivateState,
    Uint8Array,
  ] => [privateState, privateState.issuerSecret],

  localMemberSecret: ({
    privateState,
  }: WitnessContext<Ledger, NightPassPrivateState>): [
    NightPassPrivateState,
    Uint8Array,
  ] => [privateState, privateState.memberSecret],

  localMemberSalt: ({
    privateState,
  }: WitnessContext<Ledger, NightPassPrivateState>): [
    NightPassPrivateState,
    Uint8Array,
  ] => [privateState, privateState.memberSalt],

  localMembershipPath: ({
    privateState,
  }: WitnessContext<Ledger, NightPassPrivateState>): [
    NightPassPrivateState,
    MembershipPath,
  ] => [privateState, requirePath(privateState)],
};
