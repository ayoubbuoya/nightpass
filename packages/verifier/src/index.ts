// SPDX-License-Identifier: Apache-2.0

import { encodeLabel, randomBytes } from "@nightpass/client";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import type {
  AccessReceipt,
  Challenge,
  DenialReason,
  ProtectedServiceOptions,
  Session,
  Verdict,
} from "./types.js";

const DEFAULT_CHALLENGE_TTL_MS = 2 * 60 * 1_000;
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1_000;

const DENIAL_MESSAGES: Record<DenialReason, string> = {
  "unknown-challenge": "This service did not issue that challenge",
  "challenge-expired": "The challenge expired before a proof arrived",
  "challenge-consumed": "That challenge was already redeemed",
  "no-proof": "No membership proof was recorded for this challenge",
  "audience-mismatch": "The proof was issued for a different service",
  "membership-expired": "The membership expired before the session was opened",
};

const equalBytes = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length && left.every((byte, i) => byte === right[i]);

/**
 * The NightPass reference verifier: the logic a protected service runs to turn
 * an on-chain membership proof into a session.
 *
 * It never sees a member secret, a membership commitment, or a wallet address.
 * The only member-linked value it learns is a pseudonym derived from the
 * member's credential and this service's own audience, so two services running
 * this code cannot correlate their users by comparing what they stored.
 *
 * Trust boundary: this class owns the challenge lifecycle (freshness and
 * single use). The contract independently enforces that a given
 * (audience, challenge) pair is spendable exactly once on chain, so a replay
 * fails even against a verifier that forgot its own state.
 */
export class ProtectedService {
  readonly audience: string;
  readonly audienceBytes: Uint8Array;

  private readonly challengeTtlMs: number;
  private readonly sessionTtlMs: number;
  private readonly now: () => number;
  private readonly cryptoSource?: Pick<Crypto, "getRandomValues">;

  // Challenges this service minted and has not yet redeemed, keyed by hex.
  private readonly pending = new Map<string, Challenge>();
  // Challenges already redeemed here, kept so a second attempt can be told
  // apart from a challenge this service never minted.
  private readonly consumed = new Set<string>();
  // Pseudonyms seen before, so a returning member can be recognized.
  private readonly known = new Set<string>();

  constructor(options: ProtectedServiceOptions) {
    this.audience = options.audience;
    this.audienceBytes = encodeLabel(options.audience);
    this.challengeTtlMs = options.challengeTtlMs ?? DEFAULT_CHALLENGE_TTL_MS;
    this.sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    this.now = options.now ?? (() => Date.now());
    this.cryptoSource = options.cryptoSource;
  }

  // Mints a fresh single-use challenge. A member must bind their proof to this
  // exact value, so a proof captured from an earlier login cannot be reused.
  issueChallenge(): Challenge {
    const issuedAt = this.now();
    const challenge: Challenge = {
      value: randomBytes(this.cryptoSource),
      issuedAt,
      expiresAt: issuedAt + this.challengeTtlMs,
    };
    this.pending.set(toHex(challenge.value), challenge);
    return challenge;
  }

  // True while the challenge is still redeemable at this service.
  isPending(challenge: Uint8Array): boolean {
    const held = this.pending.get(toHex(challenge));
    return !!held && this.now() <= held.expiresAt;
  }

  /**
   * Decides a login attempt.
   *
   * `receipt` is the public access record read from the contract under
   * H(audience, challenge), or undefined when the contract holds none. Passing
   * it in keeps this decision pure and testable, and keeps the verifier's trust
   * anchored on public chain state rather than on anything the member says.
   */
  redeem(challenge: Uint8Array, receipt: AccessReceipt | undefined): Verdict {
    const key = toHex(challenge);
    const held = this.pending.get(key);

    if (!held) {
      // Either never minted here, or already redeemed and discarded.
      return this.deny(
        this.consumed.has(key) ? "challenge-consumed" : "unknown-challenge",
      );
    }

    const at = this.now();
    if (at > held.expiresAt) {
      this.pending.delete(key);
      return this.deny("challenge-expired");
    }

    if (!receipt) return this.deny("no-proof");

    // Defence in depth: the session key already binds the audience, so a
    // mismatch here would mean the contract or the lookup disagreed with us.
    if (!equalBytes(receipt.audience, this.audienceBytes)) {
      return this.deny("audience-mismatch");
    }

    // The contract enforces expiry against trusted block time at proof time.
    // This second check bounds the session the service is about to open.
    const membershipExpiresAtMs = Number(receipt.expiresAt) * 1_000;
    if (membershipExpiresAtMs < at) return this.deny("membership-expired");

    // Consume the challenge before granting, so a duplicate submission of the
    // same challenge is refused even if the caller retries immediately.
    this.pending.delete(key);
    this.consumed.add(key);

    const pseudonym = toHex(receipt.pseudonym);
    const returning = this.known.has(pseudonym);
    this.known.add(pseudonym);

    const session: Session = {
      pseudonym,
      audience: this.audience,
      grantedAt: at,
      expiresAt: Math.min(at + this.sessionTtlMs, membershipExpiresAtMs),
      returning,
    };
    return { outcome: "granted", session };
  }

  private deny(reason: DenialReason): Verdict {
    return { outcome: "denied", reason, message: DENIAL_MESSAGES[reason] };
  }
}

export * from "./types.js";
