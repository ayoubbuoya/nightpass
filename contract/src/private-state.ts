// SPDX-License-Identifier: Apache-2.0

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "./managed/nightpass/contract/index.js";

export type NightPassPrivateState = Readonly<{
  issuerSecret: Uint8Array;
  memberSecret: Uint8Array;
  memberSalt: Uint8Array;
}>;

export const createPrivateState = (
  issuerSecret: Uint8Array,
  memberSecret: Uint8Array,
  memberSalt: Uint8Array,
): NightPassPrivateState => ({ issuerSecret, memberSecret, memberSalt });

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
};
