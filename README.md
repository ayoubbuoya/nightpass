# NightPass

**Privacy-preserving membership and access control for Midnight.**

Prove you hold a valid membership without exposing a public membership NFT, a
reusable wallet identity, your payment history, or your activity across
unrelated services.

This repository contains the Wave 1 vertical slice: a creator publishes a plan,
a member receives a credential that never leaves their browser, an issuer
registers only a commitment, and a protected service opens a session from an
on-chain proof bound to that one service and one fresh challenge.

Early prototype. Simulator-tested and browser-build-tested; not deployed to a
public network in this repository, and not production-secure.

---

## The problem

Every membership in use today leaks. A membership NFT is a public badge in a
public wallet: anyone can see who holds it, what they paid, and where else that
wallet goes. A centralised subscription database moves the leak rather than
removing it — the operator sees every login, and so does anyone who breaches
them. A wallet-signature login hands every service the same reusable
identifier.

The common failure is that **the thing you present is the thing that identifies
you.** NightPass separates proving entitlement from revealing identity.

## Why Midnight is necessary

Three things have to be true at once, and Midnight is where they coexist:

- **Private witness state.** The member's secret and their Merkle opening path
  are witnesses. They enter proof generation and never reach the chain.
- **Selective disclosure that can be audited.** Compact forces `disclose()` at
  every boundary, so the privacy boundary is legible in the contract source
  rather than asserted in a README.
- **Public state for the parts that must be public.** Replay protection needs
  shared, tamper-proof state: the `(audience, challenge)` pair is spent on chain.

On a transparent chain, looking a member up in a registry publishes their
identifier on every access — the exact failure this project exists to fix.

## Public, private, and disclosed data

| Data | Where it lives | Who can see it |
|---|---|---|
| Plan name, price, duration | Public ledger | Everyone. Published policy; no payment is collected. |
| Issuer commitment | Public ledger | Everyone. Hash of the private issuer secret. |
| Membership tree root and history | Public ledger | Everyone. Reveals how many memberships exist, not whose. |
| Membership leaf (commitment + expiry) | Public ledger | Everyone, at issuance. Never referenced during access. |
| Access receipt (audience, pseudonym, expiry) | Public ledger | Everyone. Contains no membership commitment. |
| Member secret and salt | Browser page memory | Only the member. |
| Membership opening path | Browser page memory | Only the member. Derived from public data, withheld deliberately. |
| Issuer secret | Browser page memory | Only the issuer. |

**Disclosed when a member accesses a service:** the tree root, the audience, the
challenge, the membership expiry, and a pseudonym derived from the member's
credential and that audience.

**Never disclosed:** the membership commitment, the leaf index, or which of the
registered members is proving.

Full detail, including the cost of each deliberate disclosure:
[docs/privacy-model.md](docs/privacy-model.md).

## Architecture

```
CREATOR                MEMBER                 ISSUER              PROTECTED SERVICE
   │                     │                      │                        │
   │ publish plan        │                      │                        │
   ├────────────────────────── deploy ──────────────────────────────►  contract
   │                     │                      │                        │
   │                     │ generate secret+salt │                        │
   │                     │ (never leaves page)  │                        │
   │                     ├── commitment ───────►│                        │
   │                     │                      ├── issueMembership ──►  contract
   │                     │                      │                        │
   │                     │◄── read public tree, rebuild opening path ────┤
   │                     │    (path kept private)                        │
   │                     │◄──────────── fresh single-use challenge ──────┤
   │                     │                      │                        │
   │                     ├── proveAccess(audience, challenge) ──────►  contract
   │                     │   discloses: root, audience, challenge,       │
   │                     │   expiry, per-service pseudonym               │
   │                     │                      │   read receipt at      │
   │                     │                      │   H(audience,challenge)│
   │                     │◄─────────────── session, keyed by pseudonym ──┤
```

The verifier decides from public chain state alone. It never receives anything
from the member's browser that it has to trust.

| Package | Responsibility |
|---|---|
| `contract/` | Compact source, simulator, and all enforcement |
| `packages/client` | Credential derivation, path reconstruction, transactions, error sanitisation |
| `packages/verifier` | Reference protected-service logic: challenges and session decisions |
| `apps/web` | Creator, member, issuer, and protected-service demo surfaces |

More: [docs/architecture.md](docs/architecture.md) ·
[docs/threat-model.md](docs/threat-model.md)

## Midnight integration

The contract holds one plan policy, a `HistoricMerkleTree<10, MembershipLeaf>`
of memberships, and an access log keyed by `H(audience, challenge)`.

```
issuerCommitment = H("nightpass:issuer:v1",    issuerSecret)
commitment       = H("nightpass:member:v1",    planName, secret, salt)
pseudonym        = H("nightpass:pseudonym:v1", secret, salt, audience)
sessionKey       = H("nightpass:session:v1",   audience, challenge)
```

`issueMembership` proves issuer authority in zero knowledge and inserts a leaf,
refusing any expiry that is in the past or beyond the published plan duration.

`proveAccess` proves the caller knows a credential opening a leaf under a root
the contract has held, and that the leaf has not expired — disclosing the root
but never the leaf. It then spends the `(audience, challenge)` pair, which is
what makes a replay impossible.

The choice of a Merkle tree over a map is the design decision that carries the
privacy claim: a map lookup needs a public key, which would publish the member's
stable commitment on every single access.

## Pinned toolchain

- Node.js `24.20.0` (`.nvmrc`; the package accepts Node 22 or newer)
- npm `11.19.0`
- Compact toolchain `0.31.1` (`.compact-version`)
- Compact language `0.23`, runtime `0.16.0`
- Midnight ledger target `8.0.2`, Midnight.js `4.1.1`
- Midnight proof server image `8.0.3`
- Lace connector API `4.0.1` / compatible wallet API `4.x`

Structure and APIs follow the official
[create-mn-app](https://github.com/midnightntwrk/create-mn-app),
[Counter](https://github.com/midnightntwrk/example-counter), and
[Battleship](https://github.com/midnightntwrk/example-battleship) examples.

## Setup and verification

Prerequisites: Node matching `.nvmrc`, npm matching `packageManager`, and the
Compact compiler `0.31.1` available as `compact`.

```sh
npm ci
npm run verify     # compiles the contract, type-checks, runs all tests
npm run build      # production bundle
```

`npm run verify` compiles the Compact contract first, so a compilation failure
surfaces before anything else. Compact output is generated under
`contract/src/managed/` and is intentionally git-ignored; regenerate it with
`npm run compact`.

## Tests

```sh
npm test
```

**68 tests.**

| Suite | Count | Covers |
|---|---|---|
| `contract/` | 21 | Plan policy, issuance, access, challenge binding, replay, pseudonyms |
| `packages/client` | 16 | Label encoding, credential derivation, pseudonyms, error sanitisation |
| `packages/verifier` | 17 | Challenge lifecycle, grants, six denial reasons, audience isolation |
| `apps/web` | 14 | Workflow utilities, rendered flow, privacy boundary, no secret leakage |

Negative paths covered in the contract suite: issuance by a non-issuer, expiry
in the past, expiry beyond the published duration, a non-member holding a copied
opening path, a wrong secret, a credential from another plan, an unregistered
root, a missing opening path, an expired membership, a replayed challenge, a
replay by a different member, and a proof minted for another audience.

All credentials in tests are deterministic synthetic byte arrays. Never replace
them with wallet seeds or real credential material.

## Judge evaluation path

**Without a wallet — about two minutes, and this covers the technical gate:**

```sh
npm ci
npm run verify
```

This compiles the Compact contract and runs all 68 tests. The contract suite
alone demonstrates the privacy and replay guarantees end to end against the real
compiled circuits.

To read the privacy boundary in the source, see
[`contract/src/nightpass.compact`](contract/src/nightpass.compact) — every
`disclose()` marks a value crossing into public state.

**With a wallet — the full browser demo:**

```sh
npm run proof:up
npm run dev
```

Requires Lace on Preprod, unlocked and funded with test NIGHT and tDUST, and set
to use `http://localhost:6300` as its proof server. Docker is needed for the
pinned local proof server. If port 6300 is taken:

```sh
NIGHTPASS_PROOF_PORT=6301 npm run proof:up
```

For Preview instead of Preprod: `npm run dev:preview --workspace @nightpass/web`.

Then follow [docs/demo-script.md](docs/demo-script.md), which walks the full
sequence including four distinct rejections.

**Contract address and network:** none recorded yet. No public deployment has
been made from this repository; the deployment address and transaction hashes
are listed as pending evidence in
[docs/wave-progress/Wave_1.md](docs/wave-progress/Wave_1.md).

## Demo fixtures

The demo uses one plan, `Builders Pro`, priced at 5.00 test NIGHT for 30 days,
and two service audiences: `builders.nightpass.dev` and
`research.nightpass.dev`. The second exists so that rejecting a proof minted for
the wrong service can be demonstrated rather than merely asserted.

There are no demo accounts and no fixture secrets. Credentials are generated in
the page, live, and are lost on refresh — deliberately, because this repository
does not yet claim safe credential persistence or recovery. Do not use real
secrets.

## Known limitations and non-claims

- **Wallet-level correlation is unsolved.** Issuance and access transactions are
  paid for by a wallet, so an observer correlating addresses, fees, and timing
  may link an access back to an issuance. This is the largest gap between the
  contract's guarantee and an end-to-end privacy guarantee. Fee sponsorship or a
  relayer is required, and is not implemented.
- **Membership expiry is disclosed at access**, so the anonymity set is everyone
  sharing that timestamp, not the whole registry.
- **The verifier runs in the browser page**, not on a server. Its logic is real
  and unit-tested, but the demo's access gate is presentation state and can be
  bypassed with developer tools. It does not protect server-side content.
- **Tree depth 10** caps a contract at 1024 memberships.
- **No payment settlement.** The published price is policy; the issuance circuit
  collects nothing and is labelled a test issuance throughout.
- **No revocation, renewal, recovery, or credential persistence.** Anything that
  reads a member's secret becomes that member, permanently.
- **The proof server sees witness values.** Run the pinned local one; pointing
  Lace at a third-party proof server hands them the member's secret.
- **Not claimed:** off-chain proof verification, purchase privacy, unlinkability
  against wallet-level observers, production security, or regulatory
  suitability.
- Network-level metadata — IP addresses, browser fingerprints, request timing —
  is out of scope.

## Documentation

| Document | Contents |
|---|---|
| [privacy-model.md](docs/privacy-model.md) | Data boundary, per-circuit disclosure, unlinkability limits |
| [architecture.md](docs/architecture.md) | Components, flow, derivations, trust boundaries, on-chain decision |
| [threat-model.md](docs/threat-model.md) | Attacker-by-attacker analysis and what is not addressed |
| [demo-script.md](docs/demo-script.md) | The Wave 1 demo sequence, step by step |
| [wave-1-deck.md](docs/wave-1-deck.md) | Slide deck content |
| [wave-progress/Wave_1.md](docs/wave-progress/Wave_1.md) | What this wave delivers, and what changed |
| [NightPass_Project_Details.md](docs/NightPass_Project_Details.md) | Product and buildathon source of truth |

## License

Apache License 2.0. See [LICENSE](LICENSE).
