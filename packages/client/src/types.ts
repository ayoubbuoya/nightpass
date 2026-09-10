// SPDX-License-Identifier: Apache-2.0

import type {
  Contract,
  NightPassPrivateState,
  Witnesses,
} from "@nightpass/contract";
import type { FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";

export const nightPassPrivateStateId = "nightPassPrivateState" as const;
export type NightPassPrivateStateId = typeof nightPassPrivateStateId;

export type NightPassContract = Contract<
  NightPassPrivateState,
  Witnesses<NightPassPrivateState>
>;

export type NightPassCircuitId = Exclude<
  keyof NightPassContract["impureCircuits"],
  number | symbol
>;

export type NightPassProviders = MidnightProviders<
  NightPassCircuitId,
  NightPassPrivateStateId,
  NightPassPrivateState
>;

export type DeployedNightPassContract = FoundContract<NightPassContract>;

// The published plan policy. Wave 1 collects no payment: the price is policy
// the issuer commits to publicly, not a settled charge.
export type PlanPolicy = Readonly<{
  name: string;
  priceMicroNight: bigint;
  durationSeconds: bigint;
}>;

// Everything a third party can read from the contract. Deliberately mirrors the
// public ledger one-for-one so the UI cannot imply more privacy than exists.
export type NightPassPublicState = Readonly<{
  plan: PlanPolicy;
  issuerCommitment: string;
  membershipCount: bigint;
  accessRecordCount: bigint;
}>;

// One public access receipt, as a protected service reads it.
export type AccessReceipt = Readonly<{
  audience: Uint8Array;
  pseudonym: Uint8Array;
  expiresAt: bigint;
}>;

export type TransactionSummary = Readonly<{
  txHash: string;
  blockHeight: number;
}>;
