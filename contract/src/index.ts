// SPDX-License-Identifier: Apache-2.0

import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { Contract } from "./managed/nightpass/contract/index.js";
import { witnesses, type NightPassPrivateState } from "./private-state.js";

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type Witnesses,
} from "./managed/nightpass/contract/index.js";
export {
  createPrivateState,
  witnesses,
  type NightPassPrivateState,
} from "./private-state.js";

export const CompiledNightPassContract = CompiledContract.make<
  Contract<NightPassPrivateState>
>("NightPass", Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets("./managed/nightpass"),
);
