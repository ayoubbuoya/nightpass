# NightPass architecture

## Components

| Component | Package | Responsibility |
|---|---|---|
| Compact contract | `contract/` | Plan policy, membership tree, access log, all enforcement. |
| Client SDK | `packages/client` | Credential derivation, path reconstruction, transaction calls, error sanitisation. |
| Reference verifier | `packages/verifier` | Challenge lifecycle and the session decision a protected service makes. |
| Demo application | `apps/web` | Creator, member, issuer, and protected-service surfaces in one page. |

## End-to-end flow

```
CREATOR                MEMBER                 ISSUER              PROTECTED SERVICE
   │                     │                      │                        │
   │ publish plan        │                      │                        │
   ├────────────────────────── deploy ──────────────────────────────►  contract
   │                     │                      │                        │
   │                     │ generate secret+salt │                        │
   │                     │ (never leaves page)  │                        │
   │                     │                      │                        │
   │                     ├── commitment ───────►│                        │
   │                     │                      ├── issueMembership ──►  contract
   │                     │                      │   (leaf: commitment,   │
   │                     │                      │    expiry)             │
   │                     │                      │                        │
   │                     │◄── read public tree, rebuild opening path ────┤
   │                     │    (path kept private)                        │
   │                     │                      │                        │
   │                     │◄──────────── fresh single-use challenge ──────┤
   │                     │                      │                        │
   │                     ├── proveAccess(audience, challenge) ──────►  contract
   │                     │   discloses: root, audience, challenge,       │
   │                     │   expiry, per-service pseudonym               │
   │                     │                      │                        │
   │                     │                      │   read receipt at      │
   │                     │                      │   H(audience,challenge)│
   │                     │                      │   ◄────────────────────┤
   │                     │◄─────────────── session, keyed by pseudonym ──┤
```

The verifier's decision depends only on public chain state. It never receives
anything from the member's browser that it has to trust.

## Contract state

```
sealed planName            Bytes<32>     published policy
sealed planPriceMicroNight Uint<64>      published policy (no payment taken)
sealed planDurationSeconds Uint<64>      enforced ceiling on issued expiry
sealed issuerCommitment    Bytes<32>     H("nightpass:issuer:v1", issuerSecret)

memberships  HistoricMerkleTree<10, MembershipLeaf>   depth 10 → 1024 members
accessLog    Map<Bytes<32>, AccessRecord>             H(audience, challenge) → receipt
```

## Derivations

Every derivation carries a distinct domain-separation tag, so a value produced
for one purpose cannot be replayed as a value for another.

```
issuerCommitment = H("nightpass:issuer:v1",     issuerSecret)
commitment       = H("nightpass:member:v1",     planName, secret, salt)
pseudonym        = H("nightpass:pseudonym:v1",  secret, salt, audience)
sessionKey       = H("nightpass:session:v1",    audience, challenge)
leaf             = MembershipLeaf{ commitment, expiresAt }
```

`commitment` binds the plan, so a credential cannot open a leaf registered under
another plan. `pseudonym` binds the audience, so services cannot correlate.
`sessionKey` binds both audience and challenge, so a proof minted for one
service and one login attempt is worthless anywhere else.

## Where each guarantee is enforced

| Guarantee | Enforced by | Evidence |
|---|---|---|
| Only the issuer registers memberships | Contract | `rejects issuance by an actor without the issuer secret` |
| Issued expiry respects published duration | Contract | `rejects an expiry beyond the published plan duration` |
| Caller knows the credential opening | Contract | `rejects a non-member holding a copied opening path` |
| Membership is in a known root | Contract | `rejects an opening path whose root was never registered` |
| Membership has not expired | Contract, block time | `rejects a membership after its expiry` |
| A challenge is spendable once | Contract | `rejects a replayed challenge at the same audience` |
| A proof is worthless at another service | Contract, via `sessionKey` | `makes a proof minted for another audience invisible to this one` |
| Services cannot correlate members | Contract, via `pseudonym` | `issues unlinkable pseudonyms to unrelated services` |
| Challenges are fresh and single-use | Verifier | `refuses a challenge that has expired`, `refuses a replayed challenge` |
| Sessions are bounded by membership expiry | Verifier | `caps the session at the membership expiry` |

Replay is refused twice over: the verifier drops its own spent challenge, and
the contract refuses the insert. The contract check is the one that matters,
because it holds even against a verifier that has lost its state.

## Feasibility decision: on-chain verification

Wave 1 verifies **on chain**. The member submits `proveAccess`; the contract
records a receipt; the verifier reads public state under a key it can compute
itself, and never scans or trusts the client.

Chosen because it needs no new trusted component, and because the replay
guarantee lands in the contract rather than in the verifier's memory. The costs
are real and should not be glossed: every login is a transaction, so it carries
a fee, block-confirmation latency, and wallet-level metadata.

Off-chain verification — where the member hands a proof directly to the service
and the service verifies it without a transaction — remains unproven here. It
is the natural Wave 2 investigation.

## Trust boundaries

| Party | Trusted for | Not trusted for |
|---|---|---|
| Contract | All access enforcement | Nothing; it is the root of trust |
| Proof server | Proof generation | It sees witness values — run it locally |
| Indexer | Public state availability | Correctness beyond what the contract wrote |
| Wallet | Balancing, submitting, key custody | Access decisions |
| Verifier | Challenge freshness, session policy | Membership validity — the contract decides that |
| Browser page | Nothing security-relevant | It is the demo surface, and is bypassable |

The proof server deserves emphasis: it receives witness material during proof
generation. The repository pins a local Docker proof server for exactly this
reason. Pointing Lace at a third-party proof server would hand that party the
member's secret.
