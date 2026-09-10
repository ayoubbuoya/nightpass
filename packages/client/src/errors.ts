// SPDX-License-Identifier: Apache-2.0

// Raised when a credential has no leaf in the public membership tree. Carries
// no credential material, so it is safe to surface directly to the user.
export class MembershipNotRegisteredError extends Error {
  constructor() {
    super("Membership is not registered");
    this.name = "MembershipNotRegisteredError";
  }
}

// Assertion messages the contract itself produces, plus the small set of
// client-side validation messages. Only these are ever shown verbatim; any
// other failure is mapped to a generic message so that stack traces, witness
// values, and provider internals cannot reach the UI or a screenshot.
const SAFE_MESSAGES = [
  "Only the issuer can issue a membership",
  "Membership expiry must be in the future",
  "Membership expiry exceeds the published plan duration",
  "Membership is not registered",
  "Membership has expired",
  "Credential does not open the membership record",
  "Access challenge was already used",
  "Membership commitment must contain 64 hexadecimal characters",
  "Choose a valid expiry",
  "The contract state is not available from the indexer",
] as const;

export const safeErrorMessage = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error);
  const contractMessage = SAFE_MESSAGES.find((message) => raw.includes(message));
  if (contractMessage) return contractMessage;

  if (/reject|denied|authoriz/i.test(raw)) return "Wallet request was rejected";
  if (/sync/i.test(raw)) return "Wallet is still syncing; try again shortly";
  if (/proof|prover/i.test(raw))
    return "Proof generation failed; check the proof server";
  if (/balance|dust|fund/i.test(raw))
    return "Wallet needs sufficient test funds and tDUST";

  return "The Midnight transaction could not be completed";
};
