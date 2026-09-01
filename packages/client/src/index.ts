// SPDX-License-Identifier: Apache-2.0

import {
  CompiledNightPassContract,
  ledger,
  pureCircuits,
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
  nightPassPrivateStateId,
  type DeployedNightPassContract,
  type NightPassProviders,
  type NightPassPublicState,
  type TransactionSummary,
} from "./types.js";

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
      .pipe(
        map((contractState) => {
          const state = ledger(contractState.data);
          return {
            issuerCommitment: toHex(state.issuerCommitment),
            membershipCount: state.memberships.size(),
          };
        }),
      );
  }

  static async deploy(
    providers: NightPassProviders,
    initialPrivateState: NightPassPrivateState,
  ): Promise<NightPassClient> {
    const deployedContract = await deployContract(providers, {
      compiledContract: CompiledNightPassContract,
      privateStateId: nightPassPrivateStateId,
      initialPrivateState,
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

  deriveMembershipCommitment(secret: Uint8Array, salt: Uint8Array): Uint8Array {
    return pureCircuits.deriveMembershipCommitment(secret, salt);
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

  async assertActiveMembership(): Promise<TransactionSummary> {
    const result = await this.deployedContract.callTx.assertActiveMembership();
    return {
      txHash: result.public.txHash,
      blockHeight: result.public.blockHeight,
    };
  }
}

export * from "./credential.js";
export * from "./errors.js";
export * from "./types.js";
