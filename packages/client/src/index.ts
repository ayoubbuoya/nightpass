// SPDX-License-Identifier: Apache-2.0

import {
  CompiledNightPassContract,
  ledger,
  pureCircuits,
  type Ledger,
  type NightPassPrivateState,
} from "@nightpass/contract";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import type { ContractAddress } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { map, type Observable } from "rxjs";
import {
  decodeLabel,
  encodeLabel,
  type MemberCredential,
} from "./credential.js";
import { MembershipNotRegisteredError } from "./errors.js";
import {
  nightPassPrivateStateId,
  type AccessReceipt,
  type DeployedNightPassContract,
  type NightPassProviders,
  type NightPassPublicState,
  type PlanPolicy,
  type TransactionSummary,
} from "./types.js";

const readPublicState = (state: Ledger): NightPassPublicState => ({
  plan: {
    name: decodeLabel(state.planName),
    priceMicroNight: state.planPriceMicroNight,
    durationSeconds: state.planDurationSeconds,
  },
  issuerCommitment: toHex(state.issuerCommitment),
  membershipCount: state.memberships.firstFree(),
  accessRecordCount: state.accessLog.size(),
});

export class NightPassClient {
  readonly contractAddress: ContractAddress;
  readonly publicState$: Observable<NightPassPublicState>;

  private constructor(
    readonly deployedContract: DeployedNightPassContract,
    private readonly providers: NightPassProviders,
  ) {
    this.contractAddress = deployedContract.deployTxData.public.contractAddress;
    this.providers.privateStateProvider.setContractAddress(this.contractAddress);
    this.publicState$ = providers.publicDataProvider
      .contractStateObservable(this.contractAddress, { type: "latest" })
      .pipe(map((contractState) => readPublicState(ledger(contractState.data))));
  }

  static async deploy(
    providers: NightPassProviders,
    initialPrivateState: NightPassPrivateState,
    plan: PlanPolicy,
  ): Promise<NightPassClient> {
    const deployedContract = await deployContract(providers, {
      compiledContract: CompiledNightPassContract,
      privateStateId: nightPassPrivateStateId,
      initialPrivateState,
      args: [
        encodeLabel(plan.name),
        plan.priceMicroNight,
        plan.durationSeconds,
      ],
    });
    return new NightPassClient(deployedContract, providers);
  }

  static async join(
    providers: NightPassProviders,
    contractAddress: ContractAddress,
    initialPrivateState: NightPassPrivateState,
  ): Promise<NightPassClient> {
    const deployedContract = await findDeployedContract(providers, {
      contractAddress,
      compiledContract: CompiledNightPassContract,
      privateStateId: nightPassPrivateStateId,
      initialPrivateState,
    });
    return new NightPassClient(deployedContract, providers);
  }

  // Reads the current public ledger. Used both for display and to rebuild a
  // member's opening path.
  async currentPublicLedger(): Promise<Ledger> {
    const contractState = await this.providers.publicDataProvider.queryContractState(
      this.contractAddress,
    );
    if (!contractState) {
      throw new Error("The contract state is not available from the indexer");
    }
    return ledger(contractState.data);
  }

  async currentPublicState(): Promise<NightPassPublicState> {
    return readPublicState(await this.currentPublicLedger());
  }

  async setPrivateState(privateState: NightPassPrivateState): Promise<void> {
    this.providers.privateStateProvider.setContractAddress(this.contractAddress);
    await this.providers.privateStateProvider.set(
      nightPassPrivateStateId,
      privateState,
    );
  }

  async issueMembership(
    commitment: Uint8Array,
    expiresAt: bigint,
  ): Promise<TransactionSummary> {
    const result = await this.deployedContract.callTx.issueMembership(
      commitment,
      expiresAt,
    );
    return {
      txHash: result.public.txHash,
      blockHeight: result.public.blockHeight,
    };
  }

  // Locates the member's leaf in the public membership tree and stores the
  // opening path in private state. The path is derived entirely from public
  // data, but it is kept private so that proving never reveals which leaf --
  // and therefore which member -- is being used.
  //
  // Throws MembershipNotRegisteredError when the issuer has not yet registered
  // this credential, or has registered it with a different expiry.
  async locateMembership(
    privateState: NightPassPrivateState,
    credential: MemberCredential,
    expiresAt: bigint,
  ): Promise<NightPassPrivateState> {
    const state = await this.currentPublicLedger();
    const membershipPath = state.memberships.findPathForLeaf({
      commitment: credential.commitment,
      expiresAt,
    });
    if (!membershipPath) {
      throw new MembershipNotRegisteredError();
    }

    const located: NightPassPrivateState = { ...privateState, membershipPath };
    await this.setPrivateState(located);
    return located;
  }

  // Proves membership to one audience against one challenge. The audience and
  // challenge become public; the credential and the leaf do not.
  async proveAccess(
    audience: Uint8Array,
    challenge: Uint8Array,
  ): Promise<TransactionSummary> {
    const result = await this.deployedContract.callTx.proveAccess(
      audience,
      challenge,
    );
    return {
      txHash: result.public.txHash,
      blockHeight: result.public.blockHeight,
    };
  }

  // Reads the public access receipt a protected service would look up. Returns
  // undefined when no proof has been recorded for this (audience, challenge).
  async readAccessReceipt(
    audience: Uint8Array,
    challenge: Uint8Array,
  ): Promise<AccessReceipt | undefined> {
    const state = await this.currentPublicLedger();
    const sessionKey = pureCircuits.deriveSessionKey(audience, challenge);
    if (!state.accessLog.member(sessionKey)) return undefined;
    return state.accessLog.lookup(sessionKey);
  }

  // Same read, but tolerant of indexer lag between a finalized transaction and
  // the indexer serving the state it produced. A verifier polling for a proof
  // it expects must not conclude "no proof" from a single early read.
  //
  // Returns undefined once the attempts are exhausted, which is the correct
  // answer when no proof was ever submitted.
  async waitForAccessReceipt(
    audience: Uint8Array,
    challenge: Uint8Array,
    { attempts = 6, delayMs = 500 }: { attempts?: number; delayMs?: number } = {},
  ): Promise<AccessReceipt | undefined> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const receipt = await this.readAccessReceipt(audience, challenge);
      if (receipt) return receipt;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return undefined;
  }
}

export * from "./credential.js";
export * from "./errors.js";
export * from "./types.js";
