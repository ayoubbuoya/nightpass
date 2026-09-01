// SPDX-License-Identifier: Apache-2.0

const SAFE_MESSAGES = [
  "Only the issuer can issue a membership",
  "Membership already exists",
  "Membership expiry must be in the future",
  "Membership is not registered",
  "Membership has expired",
  "Membership commitment must contain 64 hexadecimal characters",
  "Choose a valid expiry",
] as const;

export const safeErrorMessage = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error);
  const contractMessage = SAFE_MESSAGES.find((message) => raw.includes(message));
  if (contractMessage) return contractMessage;

  if (/reject|denied|authoriz/i.test(raw)) return "Wallet request was rejected";
  if (/sync/i.test(raw)) return "Wallet is still syncing; try again shortly";
  if (/proof|prover/i.test(raw)) return "Proof generation failed; check the proof server";
  if (/balance|dust|fund/i.test(raw)) return "Wallet needs sufficient test funds and tDUST";

  return "The Midnight transaction could not be completed";
};
