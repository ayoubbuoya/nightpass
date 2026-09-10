# NightPass — Wave 1 slide deck content

Slide-by-slide content covering the ten sections required by the submission
checklist in `NightPass_Project_Details.md` §31. Build the visual deck from
this; the wording is written to be spoken.

---

## 1. Problem

**Proving you paid for something shouldn't tell everyone who you are.**

Every membership today leaks. A membership NFT is a public badge in a public
wallet — anyone can see who holds it, what they paid, and where else they go. A
centralised subscription database is worse in a different way: the company sees
every login, and so does anyone who breaches it.

Members carry the cost. A researcher's subscriptions reveal their field. A
community member's badge reveals their affiliations. A gamer's season pass ties
their play back to a wallet holding everything else they own.

---

## 2. Why existing approaches fail

| Approach | What it leaks |
|---|---|
| Membership NFT | Public holder, public price, public trading history, correlatable across every service |
| Centralised subscription DB | Full login history to the operator, and to any breach |
| Wallet signature login | A reusable public identifier — the same one everywhere |
| Email + password | Identity by construction, and re-used across services |

The common failure: **the thing you present is the thing that identifies you.**

---

## 3. The NightPass solution

Separate *proving entitlement* from *revealing identity*.

The member holds a secret. The issuer registers only a commitment. To access a
service, the member proves — in zero knowledge — that they hold an unexpired
membership, bound to that one service and one fresh challenge.

The service learns exactly three things: that the member is valid, until when,
and a pseudonym meaningful only to that service.

---

## 4. Why Midnight

This needs three things at once, and Midnight is where they coexist:

- **Private witness state.** The member's secret and their Merkle opening path
  are witnesses. They enter proof generation and never reach the chain.
- **Selective disclosure.** Compact makes disclosure explicit: `disclose()` is
  written at every boundary, so the privacy boundary is auditable in the source.
- **A public ledger for the parts that must be public.** Replay protection needs
  shared, tamper-proof state. The `(audience, challenge)` pair is spent on chain.

On a transparent chain, the membership set lookup would publish the member's
identifier — which is exactly the failure mode we set out to fix.

---

## 5. Product flow

```
Creator publishes plan  →  Member generates secret locally
                        →  Issuer registers commitment only
                        →  Member rebuilds opening path (stays private)
                        →  Service issues single-use challenge
                        →  Member proves on chain
                        →  Service reads receipt, opens session by pseudonym
```

The service never talks to the member's browser about anything it has to trust.
It reads public chain state under a key it computes itself.

---

## 6. Architecture and privacy boundary

**Public:** plan policy, issuer commitment, membership tree root, access
receipts (audience, pseudonym, expiry).

**Private:** member secret, salt, membership commitment, opening path, and which
leaf was used.

**Disclosed at access:** tree root, audience, challenge, expiry, per-service
pseudonym.

The design decision that matters: memberships live in a **Merkle tree**, not a
map. A map lookup needs a public key, which would publish the member's stable
commitment on every access and make all their visits linkable. The tree lets the
opening path stay private, so only the root is compared.

---

## 7. Live implementation evidence

- One Compact contract, compiling on toolchain 0.31.1.
- **68 tests**: 21 contract/simulator, 16 client, 17 verifier, 14 application.
- Negative paths covered: non-member, wrong secret, wrong plan, unknown root,
  expired membership, replayed challenge, wrong audience, issuer policy breach.
- Working React/Lace application with the full flow *and* live cheating attempts.

Demonstrated in the video: valid access, returning-member recognition, and four
distinct rejections.

---

## 8. Market and customer

First customers are operators who already sell access and already feel the
privacy problem:

- **Private developer and research communities** — membership reveals interests.
- **Paid research and data subscriptions** — subscriber lists are competitive
  intelligence.
- **API subscriptions** — usage patterns reveal a customer's roadmap.
- **Conference and event passes** — attendance is a public affiliation signal.
- **DAO and professional associations** — membership is politically sensitive.

The wedge: NightPass is infrastructure, not a destination. Operators keep their
product and their brand; NightPass replaces the login.

---

## 9. Three-wave progress

| Wave | Goal | State |
|---|---|---|
| **1** | Complete privacy membership flow, end to end | **This submission** |
| 2 | Reusable developer product: SDK, middleware, off-chain verification spike | Planned |
| 3 | Production candidate and a real pilot | Planned |

Wave 1 deliberately proves the hard part first — the privacy claim — rather than
building breadth on an unproven core.

---

## 10. Business model and next milestone

**Model:** infrastructure pricing. Free self-hosted contract and SDK; paid
hosted verifier, managed issuance, and support for operators who do not want to
run infrastructure.

**Next milestone (Wave 2):**

1. Resolve wallet-level correlation — fee sponsorship or a relayer. This is the
   largest remaining gap between our contract guarantee and an end-to-end one.
2. Spike off-chain proof verification, so a login costs no transaction.
3. Ship the drop-in SDK and middleware.
4. Land one pilot operator.

---

## Closing note for the presenter

Say what is **not** proven, before a judge asks. Wallet-level correlation is
unsolved. Off-chain verification is unproven. There is no payment settlement, no
revocation, and no recovery. The verifier runs in the page, not on a server.

Every one of those is written into the repository's own documentation. That is
the point: the privacy claims that *are* made each have a test behind them.
