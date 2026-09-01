# NightPass

NightPass is privacy-preserving membership and access-control infrastructure for
Midnight. This repository contains the first browser-enabled vertical slice: an
issuer registers a pseudonymous membership commitment, and a member proves
knowledge of its private opening while the contract enforces expiration.

This is an early simulator-tested and browser-build-tested prototype, not a
deployed or production-secure system.

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
- Midnight proof server image `8.0.3`
- Lace connector API `4.0.1` / compatible wallet API `4.x`

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
harness, client and browser app, then runs their tests. Compact output is
generated under `contract/src/managed/` and is intentionally ignored;
regenerate it with `npm run compact`.

## Browser demo

The React app uses the current official Midnight browser architecture: Lace
balances and submits transactions, a proof server generates proofs, the indexer
provides public contract state, and private witness values remain in a
session-only provider inside the page.

Prerequisites for a live Preprod test:

- A compatible Midnight Lace wallet installed, unlocked, and set to Preprod.
- Test NIGHT and generated tDUST for transaction fees.
- Docker if using the repository's pinned local proof server.
- Lace configured to use `http://localhost:6300` as its proof server.

Start the proof server and frontend:

```sh
npm run proof:up
npm run dev
```

Port `6300` is the default. If another Midnight proof server already uses it,
start NightPass on another local port and select that URL in Lace:

```sh
NIGHTPASS_PROOF_PORT=6301 npm run proof:up
```

Open the Vite URL in the browser containing Lace. The default build mode is
Preprod. For Preview instead, run:

```sh
npm run dev:preview --workspace @nightpass/web
```

The demo workflow is:

1. Connect Lace and deploy NightPass, or join an existing contract address.
2. Generate a member credential locally. Only its commitment is shown.
3. As the deployer/issuer, issue the commitment with a public expiry.
4. Prove active membership and wait for transaction confirmation.
5. Repeat from a separate browser profile without the credential to demonstrate
   rejection.

The generated credential exists only in page memory and is lost on refresh.
This is deliberate for the current prototype: the repository does not yet claim
safe persistent credential storage or recovery. Do not use real secrets.

Build the deployable static bundle without connecting a wallet:

```sh
npm run build
```

The build copies generated keys and ZKIR into the ignored frontend `public/`
directory and then into `apps/web/dist/`.

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
pseudonyms, secure credential persistence, or a backend session. The browser's
protected panel is demonstrative and can be bypassed. A successful transaction
is not a reusable off-chain website-login proof.
