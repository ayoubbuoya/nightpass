// SPDX-License-Identifier: Apache-2.0

import { pureCircuits, type NightPassPrivateState } from "@nightpass/contract";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";

const FIELD_BYTES = 32;

// A member credential. `secret` and `salt` are the private opening; only
// `commitment` may ever leave the device, and only to the issuer.
export type MemberCredential = Readonly<{
  secret: Uint8Array;
  salt: Uint8Array;
  commitment: Uint8Array;
}>;

export const randomBytes = (
  cryptoSource: Pick<Crypto, "getRandomValues"> = globalThis.crypto,
): Uint8Array => cryptoSource.getRandomValues(new Uint8Array(FIELD_BYTES));

// Encodes a human-readable label as the fixed-width bytes the contract stores.
// Used for both plan names and protected-service audiences so that the value a
// judge reads in the UI is exactly the value the circuit binds to.
export const encodeLabel = (label: string): Uint8Array => {
  const encoded = new TextEncoder().encode(label);
  if (encoded.length > FIELD_BYTES) {
    throw new Error(`Label must encode to at most ${FIELD_BYTES} bytes`);
  }
  const padded = new Uint8Array(FIELD_BYTES);
  padded.set(encoded);
  return padded;
};

export const decodeLabel = (value: Uint8Array): string =>
  new TextDecoder().decode(value).replace(/\0+$/, "");

// A credential is bound to one plan: it cannot open a membership registered
// under a different plan name.
export const createMemberCredential = (
  planName: Uint8Array,
  cryptoSource?: Pick<Crypto, "getRandomValues">,
): MemberCredential => {
  const secret = randomBytes(cryptoSource);
  const salt = randomBytes(cryptoSource);
  return {
    secret,
    salt,
    commitment: pureCircuits.deriveMembershipCommitment(planName, secret, salt),
  };
};

export const createIssuerPrivateState = (
  cryptoSource?: Pick<Crypto, "getRandomValues">,
): NightPassPrivateState => ({
  issuerSecret: randomBytes(cryptoSource),
  memberSecret: randomBytes(cryptoSource),
  memberSalt: randomBytes(cryptoSource),
});

export const withMemberCredential = (
  current: NightPassPrivateState,
  credential: MemberCredential,
): NightPassPrivateState => ({
  ...current,
  memberSecret: credential.secret,
  memberSalt: credential.salt,
  // Any previously located opening path belongs to the old credential.
  membershipPath: undefined,
});

export const commitmentHex = (credential: MemberCredential): string =>
  toHex(credential.commitment);

// The pseudonym a given protected service will see for this credential.
// Computed locally so the member can check, before proving, exactly which
// identifier that service is about to learn.
export const servicePseudonym = (
  credential: MemberCredential,
  audience: Uint8Array,
): Uint8Array =>
  pureCircuits.deriveServicePseudonym(
    credential.secret,
    credential.salt,
    audience,
  );
