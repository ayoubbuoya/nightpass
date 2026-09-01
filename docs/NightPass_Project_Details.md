# NightPass - Project and Buildathon Details

**Document status:** Initial team source of truth  
**Prepared:** September 1, 2026  
**Project:** NightPass  
**Target network:** Midnight  
**Program:** Midnight Buildathon on AKINDO

> **One-line product definition:** NightPass is privacy-preserving membership and access-control infrastructure that lets a person prove they hold a valid membership without exposing a public membership NFT, reusable wallet identity, complete payment history, or activity across unrelated services.

---

## 1. Why this document exists

This document hands the agreed product direction to everyone who will help build, test, design, document, present, or commercialize NightPass. It consolidates:

- The product goal and buildathon objective.
- The buildathon rules and submission requirements currently known.
- The judging criteria from the AKINDO page and the separately obtained Word rubric.
- The reason NightPass should be built on Midnight.
- The product actors, data boundaries, system flows, and real user examples.
- The proposed contract, application, SDK, security, and testing scope.
- A three-wave path from prototype to a credible production pilot.
- Risks, unresolved technical questions, and decisions the team must not hide or overclaim.

This is a working source of truth, not a replacement for the official contest rules or current Midnight documentation. The team must update it when organizers clarify conflicting rules or when technical experiments invalidate an assumption.

---

## 2. Official links and working resources

### Buildathon

- [AKINDO Midnight Buildathon overview](https://app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG?tab=overview)
- [Official Midnight Buildathon page](https://midnight.network/hackathon/buildathon)
- [Midnight Buildathon kickoff page](https://luma.com/midnight-buildathon)
- [Kickoff recording](https://www.youtube.com/watch?v=_zT--UCqxh8)
- [Midnight Buildathon Discord](https://discord.gg/SUZNRF6fu)
- [Midnight Buildathon Official Rules PDF](https://drive.google.com/file/d/1YKXtsw5nghcEBEW0BFrLn-U34AfH_MF4/view?usp=sharing)
- [Online judging rubric linked from AKINDO](https://docs.google.com/document/d/1-dDTqWa2CcfnSEvgXq83La2M8zAxi4jtVtKpMJRm3Oo/edit?usp=sharing)
- Additional local reference reviewed for this handoff: `Midnight Hackathon Judging Rubric.docx`

### Midnight network and development

- [Midnight network](https://midnight.network/)
- [Midnight developer documentation](https://docs.midnight.network/)
- [Midnight GitHub organization](https://github.com/midnightntwrk)
- [Official Private Party example](https://github.com/midnightntwrk/example-private-party)
- [Official application scaffolding and examples](https://github.com/midnightntwrk/create-mn-app)
- [Midnight local development network](https://github.com/midnightntwrk/midnight-local-dev)

The team must pin exact compiler, SDK, wallet, proof-server, indexer, and network versions in the repository. Midnight tooling is evolving, so unpinned setup instructions are a reproducibility risk.

---

## 3. Buildathon objective

The goal is not to submit a temporary hackathon mockup or a speculative token project. The goal is to:

1. Enter as early as practical and participate across all three waves.
2. Deliver a working Compact contract and end-to-end application in Wave 1.
3. use judging feedback to produce meaningful, documented improvements in Waves 2 and 3.
4. Finish Wave 3 with a production candidate and at least one real pilot or external integration.
5. Demonstrate Midnight's private-state and public-verification capabilities in a way that is essential to the product, not decorative.
6. Maximize grant eligibility and selection potential while remaining honest about technical and production readiness.

The expected end state after Wave 3 is **a tested public pilot**, not an unsupported claim that a new privacy protocol is fully production-secure or suitable for regulated deployment.

---

## 4. Buildathon structure and prizes

The current public overview describes three connected waves:

| Wave | Build period | Judging period | Grant pool |
|---|---|---|---:|
| Wave 1 | Aug 27-Sep 16, 2026 | Sep 16-Sep 27, 2026 | 3,500 USDT |
| Wave 2 | Sep 27-Oct 17, 2026 | Oct 17-Oct 27, 2026 | 4,000 USDT |
| Wave 3 | Oct 27-Nov 16, 2026 | Nov 16-Nov 27, 2026 | 5,000 USDT |
| **Total** |  |  | **12,500 USDT** |

The exact submission time for each wave must be taken from the AKINDO countdown and confirmed with organizers. Do not rely only on calendar dates copied into this document.

The grant pool is described as being distributed among eligible submissions in proportion to judging points. No fixed number of paid winners has been published. Payment is shown as USDT distributed through Ethereum and remains subject to eligibility, compliance, funding availability, and taxes.

Strong teams may also be selected for Midnight Build Club, an eight-week part-time program that provides technical, business, and marketing support and may lead to an investor-network pitch opportunity. No fixed Build Club cohort size is stated.

---

## 5. Rules and submission requirements

### 5.1 Technical gate

Every submitted wave must include at least one Compact contract that compiles successfully. Failure to satisfy this requirement results in automatic disqualification for that wave.

The project must demonstrate meaningful Midnight functionality. A frontend mockup, token-only integration, superficial fork, or architecture slide without working privacy logic is insufficient.

### 5.2 Required submission package

By the applicable deadline, the team should expect to provide:

- A publicly accessible GitHub repository.
- The relevant Compact contract and supporting application code.
- A clear README covering the problem, solution, setup, architecture, Midnight integration, test procedure, and evaluation steps.
- The `midnightntwrk` GitHub label/topic as required by the program page.
- Apache License 2.0 coverage for Midnight-related code newly developed or materially extended for the buildathon.
- A slide deck.
- A demo video or video pitch.
- A description of progress completed during the current wave.
- For Wave 2 and Wave 3, an explicit change log explaining what was added or improved since the preceding submission.
- Participation in a live presentation or interview if requested.

### 5.3 Team and eligibility

- Maximum team size: five registered members.
- Every team member must register individually on AKINDO.
- Entrants must be at least 18 years old.
- Sanctions, jurisdiction, sponsor-employee, privileged-role, and other exclusions apply; every member must review the official rules personally.
- Internal grant allocation is the team's responsibility unless the final rules state otherwise.

### 5.4 Material rules conflict requiring written clarification

The AKINDO overview and linked Official Rules PDF have conflicting statements:

- The overview says the program runs Aug 27-Nov 27, 2026; the PDF inspected earlier states Aug 13-Nov 13, 2026.
- The overview says existing products and codebases may be used when Midnight functionality is newly developed or materially extended; the PDF states that projects must be net-new as of Aug 5 and that no pre-existing projects are eligible.

The rules PDF says it prevails when discrepancies exist, but its dates appear stale. Before reusing substantial pre-existing code, the team must obtain written clarification in the official Discord and preserve a screenshot or link to the response.

Until clarified, the safest course is:

- Develop NightPass-specific Compact logic during the buildathon.
- Clearly identify any template, library, or pre-existing component.
- Maintain a dated commit history showing exactly what the team built in each wave.
- Avoid presenting an imported template or example as original work.

---

## 6. How judging should influence implementation

### 6.1 Public AKINDO weighting

The current buildathon overview states:

| Criterion | Weight |
|---|---:|
| Engineering and Implementation | 40% |
| Quality Assurance and Reliability | 15% |
| Product and Vision | 15% |
| User Experience and Design | 15% |
| Communication | 10% |
| Business Development and Viability | 5% |

The engineering criterion explicitly mentions a compiling Compact contract, private-state management, understanding of Midnight's dual-ledger model, repository organization, and README quality.

### 6.2 Detailed Word rubric weighting

The separately reviewed `Midnight Hackathon Judging Rubric.docx` uses a different 100-point distribution:

| Domain | Points |
|---|---:|
| Product Leadership | 20 |
| Backend Engineering | 20 |
| Frontend and User Experience | 15 |
| Quality Assurance | 15 |
| Communication and Marketing | 15 |
| Business Development and Viability | 15 |

This detailed rubric awards points for:

- A clearly defined real problem.
- Inspiring, ecosystem-aligned vision.
- Planning, milestones, and coordination.
- Deep use of privacy, ZK, selective disclosure, and data protection.
- Real backend logic, code structure, decentralized integration, reliability, and reproducibility.
- A polished, intuitive, responsive interface with excellent error feedback.
- Stability, complete core features, testing evidence, demo readiness, and organized version control.
- Instantly clear messaging, confident pitch, professional assets, community engagement, and educational value.
- Market understanding, practical adoption, ecosystem partnerships, sustainability, and scale.

### 6.3 Originality conclusion

Originality receives no explicit points in the detailed Word rubric and is not a named criterion in the public AKINDO weighting. Therefore, the team should not sacrifice execution to chase a concept nobody has seen before.

Originality can still influence vision, memorability, ecosystem value, and competitive comparison. The correct strategy is to use a comprehensible product category and make the Midnight implementation unusually complete, reliable, easy to integrate, and easy to demonstrate.

### 6.4 Strategy for the conflicting rubrics

Because the two weightings conflict, NightPass must optimize for both:

1. Treat engineering as 40% and make the Compact implementation the center of the product.
2. Build a real end-to-end UI rather than a command-line-only proof.
3. Make tests and attack cases visible in the demo and repository.
4. Deliver SDK-quality documentation and reproducible setup.
5. Validate the customer and obtain a pilot so the detailed business rubric is also covered.

---

## 7. Product definition

### 7.1 Product statement

NightPass is a privacy-preserving membership and access-control protocol, developer SDK, and reference application on Midnight.

It allows a creator, community, business, event, game, DAO, or API provider to issue paid or free memberships. A member can later prove that the membership is valid without exposing a reusable global identifier, public membership NFT, full wallet history, or activity at unrelated services.

### 7.2 Positioning

Useful shorthand for the team and pitch:

> **NightPass is Clerk or Patreon for private memberships on Midnight.**

Alternative message:

> **Subscriptions without surveillance.**

The first statement explains the product category. The second explains the privacy value.

### 7.3 Core promise

A verifier should learn only the minimum required result, such as:

- The user holds an active membership in plan X.
- The membership meets tier Y or higher.
- The credential is not expired or revoked.
- This one-time benefit has not already been claimed.
- The proof is intended for this verifier and this fresh challenge.

The verifier should not automatically learn:

- The member's real-world identity.
- The member's primary wallet history.
- All other NightPass memberships.
- A reusable identifier shared across unrelated services.
- The complete purchase and usage history.
- Private credential material.

---

## 8. Why Midnight is essential

### 8.1 The failure of a public membership NFT

A conventional membership NFT exposes ownership and transaction history. When the same wallet is used across services, observers can correlate communities, assets, payments, and activity.

### 8.2 The limitation of a private centralized database

A conventional subscription database avoids public exposure but requires users and creators to trust the platform operator. The operator can inspect membership activity, change records, create unauthorized access, censor members, or suffer a database breach.

### 8.3 NightPass on Midnight

NightPass uses Midnight's privacy model to combine:

- Private member secrets and wallet-local private state.
- Public, verifiable plan rules and contract state.
- Commitments that bind a credential without revealing it.
- Zero-knowledge circuits that prove predicates over private inputs.
- Nullifiers or replay controls for one-time actions.
- Selective disclosure of only the attributes needed by a verifier.
- Publicly reproducible contract logic.

The product is only compelling if the privacy boundary is real and demonstrable. The team must always be able to answer:

1. What remains private?
2. What becomes public?
3. What is selectively disclosed?
4. Who must be trusted?
5. What does the Compact circuit prove?

---

## 9. Product actors

### 9.1 Creator or organization

Creates and manages membership plans. Examples include a content creator, professional association, developer community, conference, API provider, DAO, game studio, or enterprise.

### 9.2 Member

Purchases or receives a membership and retains private credential material in a wallet or local secure store.

### 9.3 Verifier or protected service

Requests proof of membership before granting access. Examples include a website, Discord bot, API gateway, event check-in application, governance application, download portal, or game server.

### 9.4 Issuer

Authorizes membership issuance. In the simplest product, the creator and issuer are the same entity. Future versions may allow delegated issuers.

### 9.5 Midnight contract and network services

Maintain public plan and credential state, execute Compact logic, verify transaction proofs, and expose state through network/indexer interfaces.

### 9.6 Optional fee sponsor or relayer

Pays DUST transaction fees without learning or controlling the member's private witness. Fee sponsorship is important for users who are not already Midnight users.

---

## 10. Public, private, and disclosed data

| Data | Intended location | Notes |
|---|---|---|
| Plan ID and plan status | Public ledger | Needed for verifiability and discovery. |
| Creator/issuer public key | Public ledger | Authorizes plan administration and issuance. |
| Price and duration policy | Public or selectively disclosed | MVP can keep these public for simplicity. |
| Membership commitment | Public ledger | Must not contain guessable personal data. |
| Revocation state/root | Public ledger | Designed to avoid publishing member identity. |
| One-time claim nullifier | Public ledger | Prevents replay; scope it narrowly to avoid correlation. |
| Member secret | Wallet-local private state | Never log, transmit, or store in analytics. |
| Credential serial and salt | Wallet-local private state | Used to construct and prove the commitment. |
| Exact activity history | Private by default | Some public transaction metadata may still exist. |
| Valid/invalid proof result | Verifier | Minimum result needed to grant or deny access. |
| Service-specific pseudonym | Verifier | Different services should receive different values. |
| Recovery key/code | Member-controlled secure storage | Must not be stored as plaintext by NightPass. |

No implementation should be approved until the team has reviewed the actual generated circuit disclosure behavior and confirmed that no private witness is implicitly disclosed.

---

## 11. Core cryptographic concepts

The exact types and functions must follow the current Compact compiler and Midnight SDK documentation. The following is a conceptual model, not ready-to-copy contract code.

### 11.1 Membership secret

Random private data generated on the member's device. It must have sufficient entropy and must never be derived from an email address, username, wallet address, or other guessable value.

### 11.2 Membership commitment

A conceptual commitment could be:

```text
C = Commit(
  planId,
  memberSecret,
  credentialSerial,
  expiry,
  tier,
  salt
)
```

The public contract registers `C`. A zero-knowledge circuit later proves knowledge of values that correctly open `C` and satisfy the plan rules.

### 11.3 Service-specific pseudonym

```text
servicePseudonym = Hash(memberSecret, serviceDomain, planId)
```

The objective is for the same member to have a stable identifier inside one service while receiving unrelated identifiers at other services.

Domain separation is mandatory. A generic hash of only `memberSecret` would create a global tracking identifier and defeat a major privacy goal.

### 11.4 Challenge binding

Every login proof should be bound to a fresh verifier challenge, intended audience, plan, and time window. This prevents an intercepted proof from being replayed at another service or later date.

### 11.5 Nullifier

A conceptual one-time-claim nullifier could be:

```text
claimNullifier = Hash(memberSecret, planId, benefitId, verifierDomain)
```

Nullifiers must be scoped to the minimum necessary context. A universal nullifier would allow unrelated services to correlate a member.

---

## 12. Membership plan registration flow

1. Creator connects the supported Midnight wallet or administrative client.
2. Creator enters plan metadata:
   - Name and description.
   - Price.
   - Duration.
   - Available tiers.
   - Renewal and revocation rules.
   - Optional membership limit.
   - Approved verifier domains or applications.
3. Client validates inputs and shows which values will be public.
4. Creator signs the deployment or plan-creation transaction.
5. Compact contract stores the plan's public configuration and issuer authority.
6. Application waits for confirmation and displays the plan ID and contract address.
7. Creator receives integration instructions for the protected service.

MVP recommendation: support one plan type with a public price, public duration, and one issuer. Do not create a generalized billing language in Wave 1.

---

## 13. Membership purchase and issuance flow

### 13.1 Member-side preparation

1. Member chooses a plan.
2. Client generates a high-entropy `memberSecret`, credential serial, and random salt locally.
3. Client computes a membership commitment.
4. Client clearly tells the member what must be backed up and what happens if it is lost.

### 13.2 Payment and issuance

1. Member authorizes the required payment or test payment.
2. Contract validates the plan, price, status, and issuance rules.
3. Contract registers the membership commitment or updates an authenticated commitment set.
4. Creator becomes entitled to the payment according to the plan rules.
5. Member stores the private credential package locally.
6. Application confirms issuance without printing private values to logs or telemetry.

### 13.3 Privacy warning

If the member pays from a publicly attributable address, an observer may link the purchase transaction to that address and the newly registered commitment. NightPass must not claim that purchase privacy is complete until shielded payment, relaying, separation of payment and activation, or an equivalent reviewed mechanism is working.

Wave 1 may focus on private credential use while documenting purchase-linkability as an explicit limitation.

---

## 14. Membership proof and login flow

### 14.1 Challenge

The protected service creates a fresh request containing:

```text
requiredPlan
requiredTierOrPredicate
serviceDomain/audience
challengeNonce
validityWindow or epoch
contract/network reference
```

### 14.2 Proof construction

The member client uses private credential material to prove that:

- It knows a valid opening of a registered membership commitment.
- The commitment belongs to the required plan.
- The membership satisfies the expiry and tier policy.
- The credential is not revoked.
- The proof is bound to the verifier's domain and fresh challenge.
- Any required one-time action has not been used previously.

### 14.3 Verification

The service validates the proof or confirmed contract result, challenge, audience, plan, network, and replay state. If valid, it issues a short-lived application session.

### 14.4 Session

The service uses the service-specific pseudonym as the local subject identifier. The session must be short-lived and scoped only to the protected application.

### 14.5 Critical feasibility spike

The team must confirm early whether the current Midnight toolchain supports the desired reusable/off-chain verification artifact for website login. Compact normally compiles circuits into transaction-oriented proof flows; a generic website-login proof must not be assumed without testing.

Two acceptable architectures should be investigated:

1. **Off-chain verification mode:** member generates a proof that middleware can verify against a current on-chain root without submitting every login on-chain.
2. **On-chain authorization mode:** member submits a privacy-preserving contract call; the gateway observes confirmed authorization state and then issues a conventional short-lived session.

If off-chain verification is unavailable or unsafe, Wave 1 must implement the on-chain mode honestly. Session caching can avoid a transaction for every page request.

---

## 15. One-time benefit and claim flow

Use cases such as a report download, event entry, reward, or tournament ticket require one-time redemption.

1. Verifier defines a `benefitId`.
2. Member proves a valid membership.
3. Circuit derives a benefit-scoped nullifier.
4. Contract or verifier checks that the nullifier is unused.
5. On success, the nullifier is recorded as used.
6. Service delivers the benefit.
7. Reuse of the same credential for the same benefit is rejected.

The same membership may still be valid for other benefits because each benefit uses a distinct, domain-separated nullifier.

---

## 16. Renewal flow

1. Member proves ownership of a current or recently expired credential.
2. Member authorizes renewal payment.
3. Client generates a fresh salt and preferably rotates the private secret.
4. Contract supersedes the old commitment or records a new valid commitment according to the chosen state model.
5. Old proof material is no longer accepted for new sessions.
6. Member receives the updated private credential package.

Renewal design must balance privacy with state complexity. A public chain of old-to-new commitments can create linkability. The contract design review must document whether renewals are publicly linkable and why.

---

## 17. Revocation and recovery flows

### 17.1 Revocation reasons

- Refund or charge reversal.
- Credential compromise.
- Violation of plan terms.
- Incorrect issuance.
- Lost device or secret rotation.

### 17.2 Revocation

1. Authorized issuer or recovery flow derives the credential's revocation handle.
2. Contract updates a revocation set or root.
3. Future membership proofs must establish non-revocation.
4. Public revocation information must not expose member identity or create unnecessary cross-service correlation.

### 17.3 Recovery

1. Member proves control of a separately protected recovery key or code.
2. Existing credential is revoked.
3. New private secret and commitment are created.
4. Remaining entitlement transfers according to the plan's recovery policy.

Recovery is not a Wave 1 requirement. The Wave 1 interface must still explain that losing an unrecoverable secret means losing access.

---

## 18. Fee sponsorship flow

NightPass should eventually allow a creator or service to pay DUST fees for a member who has none.

The security requirement is:

- The member constructs and proves their own transaction.
- The sponsor may attach the fee contribution.
- The sponsor must not learn the member's secret or obtain the ability to act as the member.

The official Midnight Private Party example includes a fee-sponsorship pattern and should be studied rather than recreated from memory.

---

## 19. Real use cases and user stories

### 19.1 Private premium developer community

**User:** A developer who wants access to a paid technical community without exposing their main wallet and complete on-chain portfolio.

**Flow:**

1. Developer buys `Builders Pro` membership.
2. Wallet stores the private credential.
3. Discord bot or community portal sends a challenge.
4. Developer proves active membership.
5. Bot grants a role or portal session using a service-specific pseudonym.
6. The developer can later renew or revoke the credential.

**Value:** Membership access without publishing a globally trackable membership NFT.

### 19.2 Paid research subscription

**User:** An analyst accessing premium market or industry reports.

**Flow:**

1. Organization purchases a plan or receives a group entitlement.
2. Authorized analyst proves membership in the licensed group.
3. Report portal verifies the required tier.
4. A benefit-specific nullifier prevents downloading a limited report more than allowed.
5. Publisher sees a valid subscriber and permitted use, not the analyst's complete wallet history.

**Value:** Commercial access control with reduced identity collection and reduced cross-service tracking.

### 19.3 API subscription

**User:** A developer or AI agent accessing a paid API.

**Flow:**

1. Developer subscribes to `Data Pro`.
2. Client proves active tier to the API gateway.
3. Gateway maps the service-specific pseudonym to a local quota bucket.
4. Gateway returns data while the proof/session is valid.
5. Credential rotation replaces a leaked credential without changing unrelated memberships.

**Value:** A privacy-preserving alternative to permanent API keys. NightPass must not claim to solve all credential sharing; device binding, rate limits, and key security remain necessary.

### 19.4 Conference or recurring event pass

**User:** An attendee at a security, medical, political, or professional event who does not want an on-chain attendance history.

**Flow:**

1. Attendee obtains an event membership.
2. Check-in device presents a fresh QR challenge.
3. Attendee creates a one-time proof.
4. Check-in application validates the event, date, and unused nullifier.
5. Entry is granted without requiring the attendee's main wallet address in the attendance database.

**Value:** Verifiable single-use admission with less unnecessary identity exposure. It does not prevent cameras, physical observation, or voluntary identity collection.

### 19.5 DAO or professional association access

**User:** A contributor or association member accessing private tools and discussions.

**Flow:**

1. DAO or association issues a membership credential.
2. Member proves current status to an internal application.
3. Application grants access under a service-specific pseudonym.
4. High-value actions use on-chain authorization and one-time nullifiers.
5. Legal identity is disclosed separately only if a particular workflow requires it.

**Value:** Access based on verified membership rather than globally exposing every member's activity.

### 19.6 Game season pass

**User:** A player proving ownership of premium content or tournament eligibility.

**Flow:**

1. Player buys or earns a season pass.
2. Game verifies membership before opening premium content.
3. Player claims a season reward using a reward-specific nullifier.
4. Contract rejects a duplicate claim.
5. Player's unrelated assets and memberships remain outside the game's access decision.

**Value:** Private entitlement verification and verifiable one-time rewards.

---

## 20. Proposed product surfaces

### 20.1 Creator dashboard

- Create and pause plans.
- Configure price, duration, tier, renewal, and recovery rules.
- Register approved verifier applications.
- Issue complimentary memberships.
- Initiate authorized revocation.
- View privacy-preserving aggregate metrics.
- Withdraw or manage collected funds.
- Copy SDK integration instructions.

The dashboard must not become a surveillance console showing every service visited by every member.

### 20.2 Member application

- Discover or open a membership plan.
- Review public/private data disclosure before joining.
- Generate and back up private credential material.
- Pay and activate membership.
- View status and expiration information locally.
- Respond to proof challenges.
- Renew, rotate, or recover credentials when supported.
- Understand errors without exposing secrets in logs.

### 20.3 Protected reference application

- Request a NightPass proof.
- Validate plan, tier, audience, challenge, network, and replay state.
- Grant a short-lived session.
- Show meaningful failure states such as expired, revoked, wrong plan, invalid proof, replay, wrong audience, and network mismatch.

### 20.4 Developer SDK and middleware

Proposed packages or modules:

- Contract/client bindings.
- Proof-request builder.
- Verification middleware.
- Session-token adapter.
- React components/hooks.
- Next.js or Express example.
- Example protected API.
- Test helpers and local-network fixtures.

Conceptual integration:

```ts
const result = await nightpass.verify({
  proofOrAuthorization,
  requiredPlan: "builders-pro",
  audience: "premium.example",
  challenge,
});

if (!result.valid) {
  return new Response("Membership required", { status: 403 });
}
```

This interface is illustrative. The actual API must reflect what the current Midnight proof and transaction model safely supports.

---

## 21. Proposed contract responsibilities

The contract should be as small and auditable as possible.

### Candidate public state

- Plan configuration and status.
- Issuer/administrator authority.
- Valid membership commitments or authenticated set root.
- Revocation set or root.
- Used one-time-claim nullifiers.
- Creator withdrawal/accounting state.
- Version and migration information.

### Candidate circuits/actions

- Create plan.
- Pause/unpause plan.
- Issue or activate membership.
- Prove membership predicate or request access authorization.
- Redeem one-time benefit.
- Renew/rotate membership.
- Revoke credential.
- Claim creator funds.

Wave 1 should implement only the minimum circuits needed for one complete flow. More circuits increase audit surface and proof-generation cost.

---

## 22. Recommended repository structure

```text
nightpass/
  contract/
    src/
    tests/
    managed/              # generated artifacts as required
  packages/
    core/
    verifier/
    react/
  apps/
    creator-dashboard/
    member-app/
    protected-demo/
  docs/
    architecture.md
    privacy-model.md
    threat-model.md
    test-plan.md
    wave-progress/
  scripts/
  README.md
  LICENSE
```

The final layout should follow current Midnight templates and package expectations. Generated artifacts must be handled consistently and documented.

---

## 23. Wave 1 scope - complete privacy membership flow

### Goal

Prove that NightPass works end to end with a compiling Compact contract, private credential state, a usable interface, and robust negative tests.

### Required implementation

- One creator/issuer.
- One membership plan type.
- One public price and duration policy.
- Local generation of member secret and commitment.
- Payment or clearly labeled test-payment flow.
- Membership activation.
- One protected reference application.
- Valid membership proof/authorization.
- Expired or invalid credential rejection.
- Challenge and replay protection.
- Clear success/failure UI.
- Compact simulator tests.
- Reproducible local setup.
- Feasibility decision on off-chain versus on-chain login verification.

### Wave 1 demo script

1. Creator creates `Builders Pro`.
2. Alice joins and receives a private credential.
3. Alice accesses the protected application.
4. Bob, who is not a member, is rejected.
5. Alice attempts to use the proof at the wrong audience and is rejected.
6. A replayed challenge is rejected.
7. An expired credential is rejected.
8. The team shows what the public ledger contains and what remains private.
9. Tests and contract compilation are shown or linked clearly.

### Wave 1 non-goals

- Multi-chain settlement.
- Full subscription billing engine.
- Enterprise identity integration.
- Recovery and transferable memberships.
- Multiple membership types.
- Production security claim.
- Hiding IP addresses or browser fingerprints.

---

## 24. Wave 2 scope - reusable developer product

### Goal

Turn the working reference implementation into infrastructure another developer can integrate.

### Candidate additions

- Multiple creators and plans.
- Tier predicates.
- Renewal and credential rotation.
- Revocation mechanism.
- Service-specific pseudonyms.
- TypeScript SDK.
- Next.js/Express middleware example.
- One-time benefit claims.
- Fee sponsorship.
- Midnight preprod deployment.
- Mobile-responsive user experience.
- Threat model and property/negative tests.
- First external developer integration test.

### Required change evidence

Wave 2 submission must include a specific `Wave 2 Delta` section listing the new circuits, tests, UI improvements, deployment evidence, user feedback, and documentation added after Wave 1.

---

## 25. Wave 3 scope - production candidate and pilot

### Goal

Operate NightPass with a real external community, application, API, event, or game and address the operational problems discovered in that pilot.

### Candidate additions

- Recovery and credential rotation.
- Organization/team plans.
- Creator administration hardening.
- Monitoring and failure recovery.
- Versioned contracts and migration strategy.
- Security review and disclosure report.
- Stable SDK documentation.
- Pilot onboarding and support materials.
- Production-like deployment configuration.
- Adoption and usage metrics.
- Clear limitations and incident-response plan.

### Wave 3 success signal

At least one external project or community should use NightPass to protect real content, an application route, an API, an event, or a member benefit.

---

## 26. Quality assurance plan

### Contract and simulator tests

- Valid issuance.
- Invalid price or inactive plan.
- Unauthorized plan modification.
- Correct commitment opening.
- Incorrect member secret.
- Wrong plan.
- Wrong tier.
- Expired membership.
- Revoked membership.
- Wrong verifier audience.
- Stale or reused challenge.
- Reused claim nullifier.
- Renewal edge cases.
- Overflow/boundary values.
- Unauthorized withdrawal.
- State migration/version mismatch when introduced.

### Application tests

- Wallet connection and rejection states.
- Proof-server unavailable.
- Indexer/node unavailable or stale.
- Network mismatch.
- Slow proof generation.
- Duplicate clicks/submissions.
- Page refresh during confirmation.
- Lost local private state.
- User cancellation.
- Accessible keyboard and mobile flows.
- No private secret in console logs, error reports, analytics, or URLs.

### Demo reliability

- Provide a deterministic local demo path.
- Prepare pre-funded/faucet-tested test accounts where rules allow.
- Document expected proof-generation and confirmation times.
- Prepare screenshots or recorded backup only as resilience; the live system must still work.
- Run the exact judge setup steps on a clean machine or clean environment.

### Version control evidence

- Small, descriptive commits.
- Wave tags/releases.
- Pull requests or review records where practical.
- Changelog per wave.
- No generated secrets or wallet seeds committed.

---

## 27. Threat model and privacy boundaries

### Threats to address

- Guessable or low-entropy secrets.
- Credential theft and sharing.
- Proof replay.
- Cross-service pseudonym correlation.
- Universal or poorly scoped nullifiers.
- Commitment linkage to public payment address.
- Malicious verifier challenges.
- Issuer abuse and unauthorized revocation.
- Secret leakage through logs, analytics, crash reporting, URLs, or screenshots.
- Stale ledger roots or network mismatch.
- Compromised frontend or dependency supply chain.
- Contract upgrade or administrator-key abuse.
- Lost local private state.

### Explicit non-claims

NightPass does not automatically hide or solve:

- IP addresses or network metadata.
- Browser and device fingerprinting.
- Emails or personal data voluntarily given to a service.
- Public payment history when transparent payment paths are used.
- Physical identity at an in-person event.
- A member voluntarily sharing a credential secret.
- The truth of an externally issued professional or organizational credential.
- Legal compliance for every membership use case.

NightPass provides **cryptographic membership privacy and minimal disclosure**, not total anonymity.

---

## 28. Product and business model

### Initial customers

Prioritize customers with a clear privacy reason and technically simple integration:

1. Midnight developer communities and tools.
2. Paid creator or research portals.
3. API providers.
4. Online games and tournament platforms.
5. Events and professional associations.

Do not begin with regulated healthcare, government identity, or high-stakes financial access. Those markets create legal and integration burdens that can prevent a Wave 3 pilot.

### Potential sustainability models

- Small protocol/platform fee on paid memberships.
- Hosted verification gateway.
- Paid creator administration features.
- Enterprise SDK and support.
- White-label deployments.
- Open-source self-hosted core with paid managed services.

No token is required for the product thesis. Do not invent a NightPass token merely to appear more blockchain-native.

### Pilot acquisition

The business contributor should start in Wave 1:

- Interview at least five potential creators/developers.
- Ask how they currently grant membership access.
- Document privacy, onboarding, and billing objections.
- Recruit one design partner before Wave 2 judging.
- Integrate with that partner before Wave 3 judging.

---

## 29. Suggested team responsibilities

With up to five people:

1. **Product/Team Lead** - scope, organizer communication, roadmap, customer interviews, and submission ownership.
2. **Compact/Backend Engineer** - contract, private-state design, proof flows, simulator tests, and network deployment.
3. **Application/SDK Engineer** - Midnight.js integration, verifier middleware, session handling, and developer API.
4. **Frontend/Product Designer** - creator, member, and protected-service experiences; accessibility and visual cohesion.
5. **QA/Communication/Business** - automated and manual QA, clean-environment reproduction, documentation, community updates, deck, demo, and pilot acquisition.

If the team is smaller, assign these responsibilities explicitly rather than leaving them implicit.

---

## 30. Judge-facing evidence matrix

| Judge concern | NightPass evidence |
|---|---|
| Real problem | Public wallet memberships leak identity and cross-service activity; centralized subscriptions require operator trust. |
| Midnight fit | Private credentials, commitments, nullifiers, selective disclosure, and public plan rules are central to access. |
| Functional depth | Compiling Compact contract, payment/issuance, proof/authorization flow, verifier middleware, and session issuance. |
| Reliability | Boundary, replay, expiry, revocation, audience, network, and failure-mode tests. |
| UX | Three coherent surfaces with explicit privacy explanations and useful errors. |
| Reproducibility | Pinned versions, clean setup, scripts, fixtures, and judge evaluation guide. |
| Communication | “Prove you are subscribed without revealing who you are.” |
| Educational value | Demo visibly contrasts public plan state, private wallet state, and selectively disclosed proof output. |
| Business viability | SDK plus hosted verification, clear customers, real design partner, and Wave 3 pilot. |
| Ecosystem contribution | Reusable access-control infrastructure for other Midnight DApps. |

---

## 31. Submission and presentation checklist

### Repository

- [ ] Public GitHub repository.
- [ ] `midnightntwrk` topic/label.
- [ ] Apache License 2.0 applied where required.
- [ ] Compact contract compiles from documented commands.
- [ ] Tests pass from documented commands.
- [ ] No secrets, wallet seeds, or private credentials committed.
- [ ] Exact dependency and tool versions pinned.
- [ ] Architecture and privacy-boundary documentation.
- [ ] Threat model and known limitations.
- [ ] Wave-specific changelog.

### README

- [ ] One-paragraph problem and product explanation.
- [ ] Why Midnight is necessary.
- [ ] Public/private/disclosed data table.
- [ ] Architecture diagram.
- [ ] Setup and run instructions.
- [ ] Test instructions.
- [ ] Demo accounts/fixtures without secret leakage.
- [ ] Contract address and network when deployed.
- [ ] Judge evaluation path requiring minimal setup.
- [ ] Known limitations and non-claims.

### Demo video

- [ ] Product explained within the opening 15-20 seconds.
- [ ] Creator creates a plan.
- [ ] Member obtains a private credential.
- [ ] Valid access succeeds.
- [ ] At least two cheating/failure attempts are rejected.
- [ ] Public versus private data is shown clearly.
- [ ] Contract/tests/preprod evidence is visible.
- [ ] Current wave improvements are summarized.
- [ ] Pilot or customer evidence is included when available.

### Slide deck

- [ ] Problem.
- [ ] Why existing approaches fail.
- [ ] NightPass solution.
- [ ] Why Midnight.
- [ ] Product flow.
- [ ] Architecture and privacy boundary.
- [ ] Live implementation evidence.
- [ ] Market and customer.
- [ ] Three-wave progress.
- [ ] Business model and next milestone.

---

## 32. Metrics to collect

### Engineering

- Contract compilation status and compiler version.
- Test count and pass rate.
- Proof-generation time.
- Transaction confirmation time.
- Clean setup success rate.
- Critical and high-severity open defects.

### Product

- Membership-issuance completion rate.
- Proof/login completion rate.
- Median time from challenge to access.
- Failure reasons and recovery rate.
- Number of external integrations.

### Business

- Customer interviews.
- Design partners.
- Pilot users.
- Active memberships in pilot.
- Successful verifications.
- Developer time required to integrate the SDK.

Never collect member secrets or unnecessary cross-service activity to produce analytics.

---

## 33. Open questions requiring early decisions

### Organizer/rules

- Which schedule and pre-existing-code rule is authoritative?
- Which weighting will judges use: AKINDO summary or the detailed Word rubric?
- Is the `midnightntwrk` requirement a GitHub topic, label, or both?
- What exact submission deadline timezone applies?
- Are there minimum scores or limits on grant recipients?

### Midnight feasibility

- Can the current toolchain produce and verify the desired reusable off-chain access proof, or must each authorization be an on-chain call?
- Which current APIs support shielded NIGHT payment for this flow?
- Which fee-sponsorship implementation is stable on the chosen network?
- Which time primitive should enforce membership expiration?
- What are realistic proof-generation times for the proposed membership circuit?
- How should membership commitments and revocation state scale?
- Which wallet/private-state provider gives the best judge onboarding experience?

### Product

- Is Wave 1 membership paid, free-issued, or both?
- Is the first protected integration a website, API, Discord bot, game, or event check-in?
- Should service-specific pseudonyms remain stable indefinitely or rotate by epoch?
- What recovery policy is acceptable without introducing central identity collection?
- Which Wave 3 design partner can commit to a real pilot?

Resolve these questions with written architecture decisions and link them from the repository.

---

## 34. Immediate next actions

1. Register every team member on AKINDO and confirm eligibility.
2. Ask organizers in Discord for written clarification of the date, code-reuse, and rubric conflicts.
3. Create the public repository with the required license/topic and pinned toolchain.
4. Run the official Midnight examples and record exact working versions.
5. Perform the access-proof architecture spike before building the full UI.
6. Write the smallest compiling membership contract and simulator tests.
7. Build one protected web route as the reference verifier.
8. Run five customer interviews and recruit a potential pilot.
9. Draft the Wave 1 demo around successful access plus rejected attacks.
10. Maintain a wave-by-wave changelog from the first commit.

---

## 35. Final working principle

NightPass should be evaluated by one question:

> Can a service verify that someone is entitled to access, while learning materially less about that person than current blockchain membership systems reveal?

If the answer is demonstrated by a compiling Compact contract, a reliable end-to-end application, reproducible tests, a clean integration story, and a real pilot, NightPass will match both the technical and product intent of the Midnight Buildathon.

