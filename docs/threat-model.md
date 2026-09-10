# NightPass threat model

Scope: the Wave 1 vertical slice — one contract, one plan, one reference
verifier, one demo page. Everything here is stated against what the repository
actually contains.

## Assets

| Asset | Held by | Compromise means |
|---|---|---|
| Member secret and salt | Member's browser | Attacker can impersonate the member indefinitely |
| Issuer secret | Issuer's browser | Attacker can mint memberships |
| Membership opening path | Member's browser | Reveals which leaf is the member's; not sufficient to access |
| Session at a protected service | Verifier | Attacker gets the member's access, not their identity |
| Member's cross-service activity graph | Nobody, by design | Correlation of a member across unrelated services |

## Attackers and outcomes

### Non-member with no credential

Attempts `proveAccess` with an invented secret. Cannot produce an opening whose
commitment matches a registered leaf.

**Refused by the contract**: `Credential does not open the membership record`.
Test: `rejects a non-member holding a copied opening path`.

### Observer who scrapes public ledger state

Reads every leaf, every root, every access receipt. Can learn: how many
memberships exist, the plan policy, when accesses happened, at which audiences,
and the expiry attached to each.

Cannot learn: which leaf any receipt corresponds to, any member's commitment
from a receipt, or whether two receipts at different services are the same
person.

**Bounded by design.** Test: `issues unlinkable pseudonyms to unrelated
services`.

### Attacker who captures a valid access transaction

Resubmits it verbatim, or replays the `(audience, challenge)` pair.

**Refused by the contract**: `Access challenge was already used`. The insert
into `accessLog` under `H(audience, challenge)` is the guard, so it holds even
if the verifier has forgotten the challenge. Tests: `rejects a replayed
challenge at the same audience`, `rejects a replay attempted by a different
member`.

### Malicious protected service

Issues a challenge, collects a valid proof, then tries to reuse that proof to
authenticate as the member somewhere else.

The proof is bound to the malicious service's own audience. At any other
service, the receipt lives under a different session key and is simply absent.

**Refused by the contract's key derivation.** Test: `makes a proof minted for
another audience invisible to this one`.

### Two colluding protected services

Compare their full access logs to determine shared members. Every value they
hold is either public policy or a per-audience pseudonym; pseudonyms for the
same member are unrelated across audiences.

**Refused by pseudonym derivation.** Test: `issues unlinkable pseudonyms to
unrelated services`.

### Issuer exceeding its published policy

Registers a membership lasting longer than the duration it advertised.

**Refused by the contract**: `Membership expiry exceeds the published plan
duration`. Test: `rejects an expiry beyond the published plan duration`.

### Member using an expired membership

**Refused by the contract** against trusted block time, inclusive at the expiry
second. Tests: `rejects a membership after its expiry`, `authorizes before and
exactly at the inclusive expiry boundary`.

### Member replaying a stale challenge at the verifier

The verifier drops challenges past their TTL before consulting the chain.

**Refused by the verifier**: `challenge-expired`. Test: `refuses a challenge
that has expired`.

## Threats NOT addressed in Wave 1

These are real, and none of them is mitigated here.

### Wallet-level correlation

Issuance and access transactions are submitted and paid for by a wallet. An
observer correlating wallet addresses, fee payments, and timing can often link a
member's access to their issuance, and thereby to their commitment — defeating
the on-chain unlinkability the contract provides.

This is the single largest gap between the contract guarantee and an end-to-end
privacy guarantee. Fee sponsorship or a relayer is required. Not implemented.

### Expiry as a distinguisher

Access discloses the membership expiry, so the anonymity set is everyone sharing
that exact timestamp, not the full registry. An issuer registering passes at
coarse boundaries widens the set; the demo does not.

### Credential theft and recovery

Anything that reads the member's secret — malware, a hostile extension, a
compromised page — becomes the member permanently. There is no revocation, no
rotation, and no recovery. Not implemented.

### Hostile proof server

The proof server sees witness values during proof generation. Pointing Lace at a
third party hands them the member's secret. The repository pins a local Docker
proof server; nothing enforces its use.

### Compromised verifier page

The demo verifier runs in the browser. A tampered page can display a granted
session that no proof supports. The contract's guarantees are unaffected — no
membership is actually opened — but the demo's gate is presentation only, and is
labelled as such in the UI.

### Denial of service and tree exhaustion

Tree depth 10 caps a contract at 1024 memberships; the 1025th issuance fails.
There is no eviction. Fees and block latency also make every login cost money
and time.

### Network-level metadata

IP addresses, browser fingerprints, and request timing at the wallet, proof
server, and indexer are out of scope and explicitly not claimed.

## Explicit non-claims

NightPass does **not** currently claim: off-chain proof verification, purchase
privacy, unlinkability against wallet-level observers, credential recovery, fee
sponsorship, revocation, production security, or regulatory suitability.
