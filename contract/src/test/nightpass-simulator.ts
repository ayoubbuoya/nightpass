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
} from "../managed/nightpass/contract/index.js";
import {
  witnesses,
  type NightPassPrivateState,
} from "../private-state.js";

export class NightPassSimulator {
  readonly contract = new Contract<NightPassPrivateState>(witnesses);

  private contractState: ChargedState;
  private zswapState: EncodedZswapLocalState;

  constructor(issuerPrivateState: NightPassPrivateState) {
    const initial = this.contract.initialState(
      createConstructorContext(issuerPrivateState, "0".repeat(64)),
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
    secret: Uint8Array,
    salt: Uint8Array,
  ): Uint8Array {
    return pureCircuits.deriveMembershipCommitment(secret, salt);
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

    this.commit(result.context.currentQueryContext.state, result.context.currentZswapLocalState);
    return this.getLedger();
  }

  assertActiveMembership(
    actor: NightPassPrivateState,
    blockTime: number,
  ): Ledger {
    const context = this.createContext(actor, blockTime);
    const result = this.contract.impureCircuits.assertActiveMembership(context);

    this.commit(result.context.currentQueryContext.state, result.context.currentZswapLocalState);
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
