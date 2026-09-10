// SPDX-License-Identifier: Apache-2.0

import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
  type ChargedState,
  type EncodedZswapLocalState,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type MembershipLeaf,
} from "../managed/nightpass/contract/index.js";
import {
  witnesses,
  type MembershipPath,
  type NightPassPrivateState,
} from "../private-state.js";

export type PlanPolicy = Readonly<{
  name: Uint8Array;
  priceMicroNight: bigint;
  durationSeconds: bigint;
}>;

export class NightPassSimulator {
  readonly contract = new Contract<NightPassPrivateState>(witnesses);

  private contractState: ChargedState;
  private zswapState: EncodedZswapLocalState;

  constructor(issuerPrivateState: NightPassPrivateState, plan: PlanPolicy) {
    const initial = this.contract.initialState(
      createConstructorContext(issuerPrivateState, "0".repeat(64)),
      plan.name,
      plan.priceMicroNight,
      plan.durationSeconds,
    );

    this.contractState = initial.currentContractState.data;
    this.zswapState = initial.currentZswapLocalState;
  }

  getLedger(): Ledger {
    return ledger(this.contractState);
  }

  deriveIssuerCommitment(secret: Uint8Array): Uint8Array {
    return pureCircuits.deriveIssuerCommitment(secret);
  }

  deriveMembershipCommitment(
    plan: Uint8Array,
    secret: Uint8Array,
    salt: Uint8Array,
  ): Uint8Array {
    return pureCircuits.deriveMembershipCommitment(plan, secret, salt);
  }

  deriveSessionKey(audience: Uint8Array, challenge: Uint8Array): Uint8Array {
    return pureCircuits.deriveSessionKey(audience, challenge);
  }

  // Rebuilds a member's opening path from public ledger state, exactly as the
  // browser client does. Returns undefined when the leaf is not registered.
  findMembershipPath(leaf: MembershipLeaf): MembershipPath | undefined {
    return this.getLedger().memberships.findPathForLeaf(leaf);
  }

  issueMembership(
    actor: NightPassPrivateState,
    commitment: Uint8Array,
    expiresAt: bigint,
    blockTime: number,
  ): Ledger {
    const context = this.createContext(actor, blockTime);
    const result = this.contract.impureCircuits.issueMembership(
      context,
      commitment,
      expiresAt,
    );

    this.commit(
      result.context.currentQueryContext.state,
      result.context.currentZswapLocalState,
    );
    return this.getLedger();
  }

  proveAccess(
    actor: NightPassPrivateState,
    audience: Uint8Array,
    challenge: Uint8Array,
    blockTime: number,
  ): Ledger {
    const context = this.createContext(actor, blockTime);
    const result = this.contract.impureCircuits.proveAccess(
      context,
      audience,
      challenge,
    );

    this.commit(
      result.context.currentQueryContext.state,
      result.context.currentZswapLocalState,
    );
    return this.getLedger();
  }

  private createContext(actor: NightPassPrivateState, blockTime: number) {
    return createCircuitContext(
      sampleContractAddress(),
      this.zswapState,
      this.contractState,
      actor,
      undefined,
      undefined,
      blockTime,
    );
  }

  private commit(
    state: ChargedState,
    zswapState: EncodedZswapLocalState,
  ): void {
    this.contractState = state;
    this.zswapState = zswapState;
  }
}
