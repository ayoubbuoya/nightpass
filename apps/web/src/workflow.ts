// SPDX-License-Identifier: Apache-2.0

export const expiryToUnixSeconds = (value: string): bigint => {
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) throw new Error("Choose a valid expiry");
  return BigInt(Math.floor(milliseconds / 1_000));
};

export const defaultExpiryInput = (now = new Date()): string => {
  const expires = new Date(now.getTime() + 60 * 60 * 1_000);
  const local = new Date(expires.getTime() - expires.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};
