// SPDX-License-Identifier: Apache-2.0

import type {
  ContractAddress,
  SigningKey,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import type {
  ExportPrivateStatesOptions,
  ExportSigningKeysOptions,
  ImportPrivateStatesOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysOptions,
  ImportSigningKeysResult,
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from "@midnight-ntwrk/midnight-js-types";

export const sessionPrivateStateProvider = <
  PSI extends PrivateStateId,
  PS,
>(): PrivateStateProvider<PSI, PS> => {
  const states = new Map<ContractAddress, Map<PSI, PS>>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  let activeAddress: ContractAddress | undefined;

  const requireAddress = (): ContractAddress => {
    if (!activeAddress) throw new Error("Contract address is not selected");
    return activeAddress;
  };

  const statesFor = (address: ContractAddress): Map<PSI, PS> => {
    const existing = states.get(address);
    if (existing) return existing;
    const created = new Map<PSI, PS>();
    states.set(address, created);
    return created;
  };

  const unsupported = (): never => {
    throw new Error("Credential import and export are not available in this demo");
  };

  return {
    setContractAddress(address): void {
      activeAddress = address;
    },
    async set(key, value): Promise<void> {
      statesFor(requireAddress()).set(key, value);
    },
    async get(key): Promise<PS | null> {
      return statesFor(requireAddress()).get(key) ?? null;
    },
    async remove(key): Promise<void> {
      statesFor(requireAddress()).delete(key);
    },
    async clear(): Promise<void> {
      states.delete(requireAddress());
    },
    async setSigningKey(address, signingKey): Promise<void> {
      signingKeys.set(address, signingKey);
    },
    async getSigningKey(address): Promise<SigningKey | null> {
      return signingKeys.get(address) ?? null;
    },
    async removeSigningKey(address): Promise<void> {
      signingKeys.delete(address);
    },
    async clearSigningKeys(): Promise<void> {
      signingKeys.clear();
    },
    async exportPrivateStates(
      _options?: ExportPrivateStatesOptions,
    ): Promise<PrivateStateExport> {
      return unsupported();
    },
    async importPrivateStates(
      _data: PrivateStateExport,
      _options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> {
      return unsupported();
    },
    async exportSigningKeys(
      _options?: ExportSigningKeysOptions,
    ): Promise<SigningKeyExport> {
      return unsupported();
    },
    async importSigningKeys(
      _data: SigningKeyExport,
      _options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> {
      return unsupported();
    },
  };
};
