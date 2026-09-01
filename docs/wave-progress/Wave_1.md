# Wave 1 progress

## Current vertical slice

- Compact toolchain 0.31.1 pinned and verified.
- Two Compact circuits compile: `issueMembership` and
  `assertActiveMembership`.
- Nine simulator tests cover issuance, authorization, expiry, incorrect secrets,
  duplicate commitments, and unauthorized issuance.
- Typed Midnight.js client supports deploy, join, issue, public-state observation,
  and active-membership assertion.
- React/Lace frontend implements the creator/member/access demo flow for Preprod
  and Preview builds.
- Generated keys and ZKIR are copied reproducibly into the static frontend
  bundle and remain uncommitted.

## Evidence commands

```sh
npm ci
npm run verify
npm run build
npx --yes compact-zkir-lint -r contract/src/managed/nightpass/zkir
```

## Demonstrated versus pending

Demonstrated locally:

- Contract compilation.
- Simulator behavior and negative paths.
- Client and frontend type safety.
- Preprod/Preview production bundle generation.
- Secret-free application errors and session-only private state.

Pending manual evidence:

- Lace connection and user authorization.
- Preprod deployment address and transaction hash.
- Valid issuance and access transaction hashes.
- Invalid and expired access rejection through the browser.
- Proof-generation and confirmation timing.

## Architecture decision

The first browser slice uses on-chain authorization: a member submits
`assertActiveMembership`, waits for confirmation, and the browser displays the
result. This is a feasibility/demo decision, not the final website-login design.
Off-chain proof verification remains unproven. Audience binding, fresh
challenges, replay prevention, and a backend-issued short-lived session are
required before NightPass can claim secure protected-service authorization.
