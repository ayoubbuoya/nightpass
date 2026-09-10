// SPDX-License-Identifier: Apache-2.0

import type { PlanPolicy } from "@nightpass/client";

// The Wave 1 demo plan. One creator, one plan, one published price and
// duration. The price is policy the issuer commits to publicly; this build
// collects no payment.
export const DEMO_PLAN: PlanPolicy = {
  name: "Builders Pro",
  priceMicroNight: 5_000_000n,
  durationSeconds: 30n * 24n * 60n * 60n,
};

// Two unrelated protected services. Having a second one is what makes the
// wrong-audience rejection demonstrable rather than merely asserted.
export const PRIMARY_AUDIENCE = "builders.nightpass.dev";
export const RIVAL_AUDIENCE = "research.nightpass.dev";

export const expiryToUnixSeconds = (value: string): bigint => {
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) throw new Error("Choose a valid expiry");
  return BigInt(Math.floor(milliseconds / 1_000));
};

// Formats a Unix second count for a `datetime-local` input in local time.
const toLocalInput = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export const defaultExpiryInput = (now = new Date()): string =>
  toLocalInput(new Date(now.getTime() + 60 * 60 * 1_000));

// The latest expiry the contract will accept under the published duration
// policy. Offered in the UI so the issuer cannot accidentally submit a
// transaction the circuit is going to reject.
export const maxExpiryInput = (plan: PlanPolicy, now = new Date()): string =>
  toLocalInput(new Date(now.getTime() + Number(plan.durationSeconds) * 1_000));

export const formatDuration = (seconds: bigint): string => {
  const days = Number(seconds) / 86_400;
  if (days >= 1) return `${days % 1 === 0 ? days : days.toFixed(1)} days`;
  const hours = Number(seconds) / 3_600;
  if (hours >= 1) return `${hours % 1 === 0 ? hours : hours.toFixed(1)} hours`;
  return `${seconds} seconds`;
};

// microNIGHT is 1e-6 NIGHT. Displayed as published policy only.
export const formatPrice = (microNight: bigint): string =>
  `${(Number(microNight) / 1_000_000).toFixed(2)} test NIGHT`;

export const shortHex = (value: string, lead = 10): string =>
  value.length <= lead * 2 ? value : `${value.slice(0, lead)}…${value.slice(-6)}`;

export const formatClockTime = (epochMs: number): string =>
  new Date(epochMs).toLocaleTimeString();
