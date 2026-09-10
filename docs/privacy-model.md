# NightPass privacy model

Status: simulator-tested and browser-build-tested Wave 1 prototype. No public
deployment is recorded yet. Every claim below is backed by a test in
`contract/src/test/` or `packages/verifier/src/test/`; anything not backed by a
test is listed under known limitations.

## The claim

A member can prove to one named service, against one fresh challenge, that they
hold an unexpired membership, without revealing:

- which membership in the registry is theirs;
- their membership commitment;
- any identifier that another service could use to recognise the same person.

## Data boundary

| Data | Location | Privacy property |
|---|---|---|
| Plan name, price, duration | Public ledger | Published policy. The price is policy only; no payment is collected. |
| Issuer commitment | Public ledger | Domain-separated hash of the private issuer secret. |
| Membership tree root and root history | Public ledger | Reveals how many memberships exist, not which member is which. |
| Membership leaf (commitment + expiry) | Public ledger | Written at issuance. Never referenced by index or contents during access. |
| Access receipt (audience, pseudonym, expiry) | Public ledger | Keyed by `H(audience, challenge)`. The pseudonym is per-service. |
| Issuer secret | Wallet-local private state | Read by a witness; never disclosed or logged. |
| Member secret and salt | Wallet-local private state | Read by witnesses; never disclosed or logged. |
| Membership opening path | Wallet-local private state | Derived from public data but withheld, so access does not reveal the leaf. |
| Browser credential state | Page memory | Cleared on refresh; never written to URLs, storage, logs, or analytics. |

## What each circuit discloses

### `issueMembership`

Proves the caller's private issuer secret hashes to the sealed public issuer
commitment, then inserts a leaf.

Discloses: the membership commitment, its expiry, and the fact that the issuer
acted. The issuing transaction is linkable to the submitting wallet.

Enforces: issuer authority; expiry strictly in the future; expiry no later than
the published plan duration from the current block time.

### `proveAccess`

Proves the caller knows a secret and salt whose plan-bound commitment opens a
leaf under a root the contract has held, and that the leaf's expiry has not
passed.

Discloses: the membership tree root, the audience, the challenge, the
membership expiry, and a pseudonym derived from the member's credential and
that audience. It does **not** disclose the commitment, the leaf index, or
which of the registered members is proving.

Enforces: knowledge of the opening; membership in a known root; inclusive
expiry against trusted block time; single use of the `(audience, challenge)`
pair.

## Why the commitment stays hidden

An earlier revision stored memberships in a `Map<Bytes<32>, Uint<64>>`. A map
lookup needs a public key, so every access published the member's stable
commitment — making all of one member's visits publicly linkable, across every
service. That defeated the product's central claim.

The membership set is now a `HistoricMerkleTree`. The opening path is a private
witness, so only the root is compared on chain. Historic roots are retained so a
member's path keeps verifying as later members are inserted.

## Deliberate disclosures and their cost

**Membership expiry is public at access time.** The circuit compares expiry
against trusted block time, and that comparison takes a disclosed value. So a
member's anonymity set is not the whole registry but everyone sharing their
exact expiry timestamp. Issuing on coarse boundaries — the same expiry second
for everyone issued that day — widens that set. The demo does not do this; a
production issuer should.

**Audience and challenge are public.** They must be, so the verifier can find
the receipt without scanning. They reveal that *someone* holding a membership
authenticated to that service at that time.

**The access transaction is linkable to the submitting wallet.** Wave 1 has no
fee sponsorship or relayer, so network-level metadata still ties a proof to the
wallet that paid for it. This is the largest remaining gap between the contract
guarantee and an end-to-end privacy guarantee.

## Unlinkability, precisely

- Two accesses by the same member at the **same** service share a pseudonym.
  This is intentional: it lets a service recognise a returning member without
  learning who they are.
- Two accesses by the same member at **different** services have unrelated
  pseudonyms. Two services comparing their full access logs cannot tell whether
  they share a member. Covered by tests in both the contract and verifier
  suites.
- Neither pseudonym can be linked back to the membership leaf or commitment
  without the member's secret.

The qualifier: this is unlinkability of the *values the contract publishes*. It
is not unlinkability against an observer correlating wallet addresses, fee
payments, IP addresses, or timing.

## Known privacy and security limitations

- Wallet-level linkage of issuance and access transactions is not addressed.
  Purchase privacy is not implemented or claimed.
- Expiry disclosure narrows the anonymity set, as described above.
- The membership tree has depth 10, capping a contract at 1024 memberships.
- Revocation, renewal, recovery, payment settlement, and fee sponsorship are
  not implemented.
- The verifier runs in the browser page for the demo rather than on a server.
  Its logic is real and unit-tested, but a page can be tampered with; the
  contract's guarantees hold regardless, the verifier's session policy does not.
- The protected panel in the demo is presentation state and can be bypassed with
  developer tools. It does not protect server-side content.
- Simulator tests validate contract semantics, not deployment, wallet storage,
  proving performance, side-channel resistance, or production security.
- The app serves proving keys and ZKIR publicly. These are generated circuit
  artifacts, not member secrets.
- No third-party fonts, analytics, or error reporting are used. Wallet, proof
  server, and indexer endpoints still observe normal request metadata.

## Not claimed

Off-chain proof verification, purchase privacy, recovery, fee sponsorship,
production security, and regulatory suitability. See
[threat-model.md](threat-model.md) for the attacker-by-attacker breakdown.
