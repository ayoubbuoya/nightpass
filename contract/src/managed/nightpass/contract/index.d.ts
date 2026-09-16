import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type MembershipLeaf = { commitment: Uint8Array; expiresAt: bigint };

export type AccessRecord = { audience: Uint8Array;
                             pseudonym: Uint8Array;
                             expiresAt: bigint
                           };

export type Witnesses<PS> = {
  localIssuerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localMemberSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localMemberSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localMembershipPath(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { leaf: MembershipLeaf,
                                                                                    path: { sibling: { field: bigint
                                                                                                     },
                                                                                            goes_left: boolean
                                                                                          }[]
                                                                                  }];
}

export type ImpureCircuits<PS> = {
  issueMembership(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveAccess(context: __compactRuntime.CircuitContext<PS>,
              audience_0: Uint8Array,
              challenge_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  issueMembership(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveAccess(context: __compactRuntime.CircuitContext<PS>,
              audience_0: Uint8Array,
              challenge_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  deriveIssuerCommitment(secret_0: Uint8Array): Uint8Array;
  deriveMembershipCommitment(plan_0: Uint8Array,
                             secret_0: Uint8Array,
                             salt_0: Uint8Array): Uint8Array;
  deriveServicePseudonym(secret_0: Uint8Array,
                         salt_0: Uint8Array,
                         audience_0: Uint8Array): Uint8Array;
  deriveSessionKey(audience_0: Uint8Array, challenge_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  deriveIssuerCommitment(context: __compactRuntime.CircuitContext<PS>,
                         secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveMembershipCommitment(context: __compactRuntime.CircuitContext<PS>,
                             plan_0: Uint8Array,
                             secret_0: Uint8Array,
                             salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveServicePseudonym(context: __compactRuntime.CircuitContext<PS>,
                         secret_0: Uint8Array,
                         salt_0: Uint8Array,
                         audience_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveSessionKey(context: __compactRuntime.CircuitContext<PS>,
                   audience_0: Uint8Array,
                   challenge_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  issueMembership(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveAccess(context: __compactRuntime.CircuitContext<PS>,
              audience_0: Uint8Array,
              challenge_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly planName: Uint8Array;
  readonly planPriceMicroNight: bigint;
  readonly planDurationSeconds: bigint;
  readonly issuerCommitment: Uint8Array;
  memberships: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: MembershipLeaf): __compactRuntime.MerkleTreePath<MembershipLeaf>;
    findPathForLeaf(leaf_0: MembershipLeaf): __compactRuntime.MerkleTreePath<MembershipLeaf> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  accessLog: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): AccessRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, AccessRecord]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               name_0: Uint8Array,
               priceMicroNight_0: bigint,
               durationSeconds_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
