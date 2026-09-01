// SPDX-License-Identifier: Apache-2.0

import "@midnight-ntwrk/dapp-connector-api";
import type {
  ConnectedAPI,
  InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { fromHex, toHex } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import {
  Binding,
  Proof,
  SignatureEnabled,
  Transaction,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import type {
  FinalizedTransaction,
  TransactionId,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import type { UnboundTransaction } from "@midnight-ntwrk/midnight-js-types";
import type {
  NightPassCircuitId,
  NightPassProviders,
} from "@nightpass/client";
import type { NightPassPrivateState } from "@nightpass/contract";
import semver from "semver";
import { sessionPrivateStateProvider } from "./private-state-provider.js";

const CONNECTOR_RANGE = "4.x";

const findCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === "object" &&
      "apiVersion" in wallet &&
      semver.satisfies(wallet.apiVersion, CONNECTOR_RANGE),
  );
};

const waitForWallet = async (): Promise<InitialAPI> => {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const wallet = findCompatibleWallet();
    if (wallet) return wallet;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
  }
  throw new Error("Compatible Midnight Lace wallet was not found");
};

const connectWallet = async (networkId: string): Promise<ConnectedAPI> => {
  const wallet = await waitForWallet();
  return wallet.connect(networkId);
};

export const createBrowserProviders = async (
  networkId: string,
): Promise<NightPassProviders> => {
  const connected = await connectWallet(networkId);
  const config = await connected.getConfiguration();
  if (!config.proverServerUri) {
    throw new Error("The wallet has no proof server configured");
  }

  const zkConfigProvider = new FetchZkConfigProvider<NightPassCircuitId>(
    window.location.origin,
    fetch.bind(window),
  );
  const shieldedAddresses = await connected.getShieldedAddresses();

  return {
    privateStateProvider: sessionPrivateStateProvider<
      "nightPassPrivateState",
      NightPassPrivateState
    >(),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      config.proverServerUri,
      zkConfigProvider,
    ),
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
      window.WebSocket,
    ),
    walletProvider: {
      getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () =>
        shieldedAddresses.shieldedEncryptionPublicKey,
      balanceTx: async (
        transaction: UnboundTransaction,
        _ttl?: Date,
      ): Promise<FinalizedTransaction> => {
        const balanced = await connected.balanceUnsealedTransaction(
          toHex(transaction.serialize()),
        );
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          "signature",
          "proof",
          "binding",
          fromHex(balanced.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (
        transaction: FinalizedTransaction,
      ): Promise<TransactionId> => {
        await connected.submitTransaction(toHex(transaction.serialize()));
        const [transactionId] = transaction.identifiers();
        if (!transactionId) throw new Error("Wallet returned no transaction ID");
        return transactionId;
      },
    },
  };
};
