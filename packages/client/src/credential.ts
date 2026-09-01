// SPDX-License-Identifier: Apache-2.0

import { pureCircuits, type NightPassPrivateState } from "@nightpass/contract";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";

const SECRET_BYTES = 32;

export type MemberCredential = Readonly<{
  secret: Uint8Array;
  salt: Uint8Array;
  commitment: Uint8Array;
}>;

export const randomBytes = (
  cryptoSource: Pick<Crypto, "getRandomValues"> = globalThis.crypto,
): Uint8Array => cryptoSource.getRandomValues(new Uint8Array(SECRET_BYTES));

export const createMemberCredential = (
  cryptoSource?: Pick<Crypto, "getRandomValues">,
): MemberCredential => {
  const secret = randomBytes(cryptoSource);
  const salt = randomBytes(cryptoSource);
  return {
    secret,
    salt,
    commitment: pureCircuits.deriveMembershipCommitment(secret, salt),
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
});

export const commitmentHex = (credential: MemberCredential): string =>
  toHex(credential.commitment);
