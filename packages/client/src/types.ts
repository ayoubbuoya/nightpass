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

export type NightPassPublicState = Readonly<{
  issuerCommitment: string;
  membershipCount: bigint;
}>;

export type TransactionSummary = Readonly<{
  txHash: string;
  blockHeight: number;
}>;
