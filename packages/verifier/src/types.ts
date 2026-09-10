// SPDX-License-Identifier: Apache-2.0

import type { AccessReceipt } from "@nightpass/client";

export type { AccessReceipt };

// A challenge the protected service minted for one login attempt. `value` is
// the 32-byte nonce the member binds their proof to; it is public by design.
export type Challenge = Readonly<{
  value: Uint8Array;
  issuedAt: number;
  expiresAt: number;
}>;

// Why a login attempt was refused. Each reason maps to exactly one check, so a
// demo can show which specific guarantee rejected the attempt.
export type DenialReason =
  | "unknown-challenge"
  | "challenge-expired"
  | "challenge-consumed"
  | "no-proof"
  | "audience-mismatch"
  | "membership-expired";

// A session the protected service opens for a member it knows only by their
// per-service pseudonym.
export type Session = Readonly<{
  pseudonym: string;
  audience: string;
  grantedAt: number;
  expiresAt: number;
  // True when this pseudonym has been seen before at this service. Lets a
  // service recognize a returning member without ever learning who they are.
  returning: boolean;
}>;

export type Verdict =
  | Readonly<{ outcome: "granted"; session: Session }>
  | Readonly<{ outcome: "denied"; reason: DenialReason; message: string }>;

export type ProtectedServiceOptions = Readonly<{
  // The service's own name. Bound into every proof, so a proof minted for one
  // service is meaningless at another.
  audience: string;
  // How long a minted challenge stays redeemable.
  challengeTtlMs?: number;
  // How long a granted session lasts, capped by the membership expiry.
  sessionTtlMs?: number;
  now?: () => number;
  cryptoSource?: Pick<Crypto, "getRandomValues">;
}>;
