# Wave 1 progress

## What this wave delivers

A complete privacy membership flow: a creator publishes a plan, a member
receives a credential that never leaves their browser, an issuer registers only
a commitment, and a protected service grants a session from an on-chain proof
that is bound to that one service and one fresh challenge.

## Vertical slice

- Compact toolchain 0.31.1 pinned and verified.
- One Compact contract, two circuits: `issueMembership` and `proveAccess`.
- Memberships held in a `HistoricMerkleTree<10, MembershipLeaf>`; the opening
  path is a private witness, so access never discloses which membership is used.
- Audience binding, single-use challenges, and on-chain replay rejection through
  an access log keyed by `H(audience, challenge)`.
- Per-service pseudonyms: a service recognises a returning member without
  learning who they are, and two services cannot correlate their members.
- Published plan policy — name, price, duration — with the duration enforced
  against block time at issuance.
- `@nightpass/verifier`: the reference protected-service logic, with challenge
  TTL, single use, session capping, and six distinct denial reasons.
- React/Lace application covering the full demo script, including live
  cheating attempts that are visibly rejected.
- 68 tests: 21 contract/simulator, 16 client, 17 verifier, 14 application.

## Change from the previous revision

The first revision stored memberships in `Map<Bytes<32>, Uint<64>>` and proved
access with `assertActiveMembership`. A map lookup requires a public key, so
every access disclosed the member's stable commitment — making all of one
member's accesses publicly linkable across every service, which is precisely
what NightPass exists to prevent.

That revision also had no audience binding, no challenge, and no replay
protection, so demo steps 1, 5, and 6 could not be performed.

Replaced with the Merkle design described above. This is a breaking change to
the contract, the client, and the application.

## Evidence commands

```sh
npm ci
npm run verify
npm run build
npx --yes compact-zkir-lint -r contract/src/managed/nightpass/zkir
```

Circuit cost, from the ZKIR lint on the pinned toolchain:

| Circuit | k | Instructions | Proof payload |
|---|---|---|---|
| `issueMembership` | 12 | 188 | ~192 KB |
| `proveAccess` | 14 | 228 | ~768 KB |

Both report clean. `proveAccess` is the larger circuit because it verifies a
depth-10 Merkle path; expect its proof generation to dominate the demo's
perceived latency.

## Demonstrated versus pending

Demonstrated locally and reproducibly:

- Contract compilation on the pinned toolchain.
- Issuer authority, and the published-duration policy ceiling.
- Access by a valid member; rejection of a non-member, a wrong secret, a wrong
  plan, an unknown root, an expired membership, a replayed challenge, and a
  proof minted for another audience.
- Unlinkable pseudonyms across services, and stable pseudonyms within one.
- Verifier challenge freshness, single use, and session capping.
- Secret-free application errors and session-only private state.
- Preprod/Preview production bundle generation.

Pending manual evidence — requires a funded wallet, which this environment does
not have:

- Lace connection and user authorization.
- Preprod deployment address and transaction hashes for issuance and access.
- Rejection of invalid, wrong-audience, replayed, and expired attempts observed
  through the browser against a live network.
- Proof-generation and confirmation timing.

## Architecture decision: on-chain verification

Wave 1 verifies on chain. The member submits `proveAccess`; the contract writes
a receipt; the verifier reads it under a key it computes itself.

Chosen because it introduces no new trusted component and puts the replay
guarantee in the contract rather than in the verifier's memory. The costs are
real: every login is a transaction, carrying a fee, confirmation latency, and
wallet-level metadata.

Off-chain proof verification remains unproven and is the natural Wave 2
investigation. See [architecture.md](../architecture.md).

## Known gaps carried into Wave 2

- Wallet-level correlation of issuance and access transactions is unsolved, and
  is the largest remaining gap between the contract guarantee and an end-to-end
  privacy guarantee.
- Membership expiry is disclosed at access, narrowing the anonymity set to
  everyone sharing that timestamp.
- No payment settlement, revocation, renewal, recovery, or credential
  persistence.
- Tree depth 10 caps a contract at 1024 memberships.
- The verifier runs in the browser page rather than on a server.
