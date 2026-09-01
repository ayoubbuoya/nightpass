# NightPass

NightPass is privacy-preserving membership and access-control infrastructure for
Midnight. This repository currently contains the first contract-only vertical
slice: an issuer registers a pseudonymous membership commitment, and a member
proves knowledge of its private opening while the contract enforces expiration.

This is an early simulator-tested prototype, not a deployed or production-secure
system.

## Implemented contract flow

1. The deployer provides an issuer secret from local private state.
2. The constructor stores only a domain-separated issuer commitment publicly.
3. The member derives a commitment from a private secret and salt locally.
4. The issuer registers that commitment with a public expiration timestamp.
5. The member calls `assertActiveMembership` with the private opening supplied by
   local witnesses.
6. The circuit checks that the derived commitment is registered and that the
   trusted Midnight block time has not passed the inclusive expiration boundary.

Issuance is a clearly labeled test-issuance flow. It does not collect payment.

## Pinned toolchain

The initial implementation was verified with:

- Node.js `24.20.0` (`.nvmrc`; the package accepts Node 22 or newer)
- npm `11.19.0`
- Compact toolchain `0.31.1` (`.compact-version`)
- Compact language `0.23`
- Compact runtime `0.16.0`
- Midnight ledger target `8.0.2`
- Midnight.js network ID package `4.1.1`

The structure and APIs are based on the official
[create-mn-app](https://github.com/midnightntwrk/create-mn-app),
[Counter](https://github.com/midnightntwrk/example-counter), and
[Battleship](https://github.com/midnightntwrk/example-battleship) examples.

## Setup and verification

Prerequisites:

- Node.js matching `.nvmrc`
- npm matching the root `packageManager` field
- Compact compiler `0.31.1` available as `compact`

From a clean checkout:

```sh
npm ci
npm run verify
npm run build
```

`npm run verify` compiles the Compact contract, type-checks the TypeScript
harness, and runs the simulator tests. Compact output is generated under
`contract/src/managed/` and is intentionally ignored; regenerate it with
`npm run compact`.

## Current tests

The simulator suite covers:

- deterministic issuer initialization;
- authorized membership issuance;
- unauthorized issuance rejection;
- duplicate commitment rejection;
- non-future expiry rejection;
- access before and exactly at expiration;
- incorrect-secret rejection;
- unregistered-member rejection; and
- expired-membership rejection.

All credentials in the tests are deterministic synthetic byte arrays. Never
replace them with wallet seeds or real credential material.

## Privacy boundary and limitations

See [docs/privacy-model.md](docs/privacy-model.md) for the explicit public,
private, and disclosed data boundary.

This version does not yet implement plan IDs, payments, revocation, audience or
network binding, verifier challenges, replay protection, service-specific
pseudonyms, a web application, or deployment. A successful simulator assertion
is not yet a reusable off-chain website-login proof.
