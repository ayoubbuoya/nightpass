# NightPass — Master Project Pitch Deck

**Privacy-Preserving Membership and Access-Control Infrastructure for Midnight**

*Buildathon Edition: Comprehensive Vision & Wave 1 Delivery*  
*Target Network: Midnight | Pinned Compact Toolchain: 0.31.1 | Pinned Midnight SDK: 4.1.1*

---

## Executive Summary

> **The One-Sentence Pitch:**  
> **NightPass is zero-knowledge access-control infrastructure for Midnight that enables users to prove valid membership and entitlement to any digital service without disclosing their wallet identity, asset portfolio, membership history, or cross-service activity.**

| Attribute | Specification |
|---|---|
| **Core Problem** | Public token gates and centralized subscription databases turn access credentials into global tracking beacons and data honey-pots. |
| **Solution** | Cryptographic separation of *proving entitlement* from *revealing identity* using zero-knowledge private witness state and selective disclosure. |
| **Network Fit** | Built natively on **Midnight**: combines off-chain private witness proofs with on-chain consensus-enforced replay prevention. |
| **Current Milestone** | **Wave 1 Vertical Slice Delivered**: Compiling Compact contract, Merkle tree privacy accumulator, two-tier replay protection, `@nightpass/verifier`, React/Lace demo, and 68 automated tests. |
| **Business Model** | Open-core developer infrastructure: Free self-hosted contract & client SDK; monetized hosted verifier gateways, managed issuance, and enterprise compliance middleware. |

---

## Slide 1: The Problem — Every Membership Today Leaks

### Proving you paid for something shouldn't tell everyone who you are.

Modern digital access control forces users into a false dichotomy: **public blockchain surveillance** or **centralized Web2 surveillance**.

```
TODAY'S BROKEN MODELS:

1. Membership NFTs (Public Web3)
   [ Member Wallet ] ──Public NFT──► [ Protected Service ]
          │                                  │
          └── Public Explorer / Anyone ◄─────┘
              • Sees total wallet wealth & portfolio
              • Correlates activity across every DApp
              • Tracks purchase price & exact transfer history

2. Centralized DBs (Web2 SaaS)
   [ User Login ] ──Email / Static Auth──► [ Company Database ]
                                                   │
                                        Corporate Data Breaches &
                                        Full Login Surveillance Log
```

### The Real Personas Impacted

- **The Security & Tech Researcher:** Subscribes to private vulnerability databases and threat reports. Public NFT gating reveals their research targets to adversaries; centralized databases leak client investigations upon breach.
- **The Web3 Developer & Trader:** Joins private alpha and builder communities. Presenting a public NFT or signing a message links their main cold-storage treasury to an everyday Discord or Telegram handle.
- **The Event Attendee:** Uses a digital pass for an industry conference or summit. An on-chain badge permanently ties their physical real-world location and attendance history to their public wallet.
- **The DAO Contributor:** Votes on confidential operational tools. Gating with public tokens exposes internal coalition memberships and political alignments.

**The Fundamental Flaw:** In today’s systems, **the thing you present to authenticate is the very thing that permanently identifies and tracks you.**

---

## Slide 2: The NightPass Solution — Zero-Knowledge Access Gates

### Decouple entitlement verification from identity disclosure.

NightPass flips the paradigm: **The member proves they meet the criteria, without revealing which member they are.**

```
NIGHTPASS ZERO-KNOWLEDGE MODEL:

[ Member Browser ]                     [ Midnight Ledger ]               [ Protected Service ]
       │                                        │                                   │
  Holds Private                                 │                                   │
  Witness Secret                                │                                   │
  (Never exported)                              │                                   │
       │                                        │                                   │
       ├──── 1. Commitment Registered ─────────►│                                   │
       │     (Hash of secret + salt)            │                                   │
       │                                        │◄──── 2. Service Challenge ────────┤
       │                                        │      (Fresh, single-use)          │
       │                                        │                                   │
       ├──── 3. proveAccess(audience, challenge)►                                  │
       │     • Private witness: secret, salt, Merkle path                           │
       │     • Public output: tree root, audience, expiry, per-service pseudonym    │
       │                                        │                                   │
       │                                        ├───── 4. Read On-Chain Receipt ────┤
       │                                        │      Keyed by H(aud, challenge)   │
       │                                        │                                   │
       │◄─── 5. Open Session (Bound to isolated pseudonym) ─────────────────────────┘
```

### What the Protected Service Learns

When a member accesses a NightPass-enabled service, the service learns **exactly three things**:
1. **Valid Entitlement:** The member proves possession of a valid credential in the active membership tree.
2. **Expiry Window:** The timestamp until which access is authorized.
3. **Domain-Isolated Pseudonym:** A deterministic identifier unique to that specific service, enabling returning-user session recognition **without cross-service tracking**.

---

## Slide 3: Why Midnight is Structurally Essential

NightPass is not an arbitrary Web3 project with privacy bolted on. It **cannot be built safely on transparent blockchains**.

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│  Transparent Chains (Ethereum/Solana)  │            Midnight Network            │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ Public state lookups: querying a       │ Private witness state: member secrets  │
│ registry leaks the member identifier   │ and Merkle paths never leave local     │
│ on every login attempt.                │ browser memory.                        │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ Privacy requires complex, ad-hoc ZK    │ Compact native privacy: `disclose()`   │
│ libraries with high circuit overhead   │ syntax creates auditable, verifiable   │
│ and difficult verification pipelines.  │ boundary gates in source code.         │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ Replay prevention on-chain conflicts   │ Dual-state balance: public ledger for  │
│ with anonymity (nullifiers can link    │ tamper-proof replay protection while   │
│ repeated visits if improperly scoped). │ preserving private witness evaluation. │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

### Three Architectural Pillars Powered by Midnight

1. **Private Witness Execution:** The user's secret, salt, commitment, and Merkle opening path enter local zero-knowledge proof generation and **never reach the network or ledger**.
2. **Explicit Selective Disclosure:** Compact makes data exposure verifiable. Every public boundary is explicitly declared using `disclose()`, ensuring privacy guarantees are readable directly in the contract source code.
3. **Tamper-Proof Public Settlement:** Challenge-response verification requires consensus-enforced replay prevention. The tuple `(audience, challenge)` is spent on-chain in public state, ensuring single-use guarantees even if verifier servers reboot or crash.

---

## Slide 4: System Architecture & Cryptographic Primitives

### Cryptographic Rigor: Domain-Separated Primitives

Every hash and commitment in NightPass carries a dedicated, protocol-level domain separation prefix to eliminate cross-type replay attacks:

```
issuerCommitment = H("nightpass:issuer:v1",    issuerSecret)
commitment       = H("nightpass:member:v1",    planName, secret, salt)
pseudonym        = H("nightpass:pseudonym:v1", secret, salt, audience)
sessionKey       = H("nightpass:session:v1",   audience, challenge)
leaf             = MembershipLeaf { commitment, expiresAt }
```

### Key Technical Architecture Breakthrough: Merkle Tree vs. Map

In our early prototype design, memberships were tracked in an on-chain `Map<Bytes<32>, Uint<64>>`. 

> **Why that failed:** A map lookup requires a public key to verify presence. Publishing that key on every login permanently links all of a user's accesses across the entire internet.

**The Solution:** NightPass implements a `HistoricMerkleTree<10, MembershipLeaf>`:
- The member proves knowledge of an opening path from their private leaf to a valid historic root.
- The leaf position, index, and sibling path remain **private witnesses**.
- The verifier only checks against published tree roots, preserving total anonymity across up to 1,024 members per tree instance.

---

## Slide 5: The Complete 3-Wave Product Roadmap

NightPass is engineered as a robust, phased infrastructure protocol across the Midnight Buildathon waves:

```
                  WAVE 1 (Current)
      Complete Privacy Membership Vertical Slice
      • Compiling Compact Contract (2 circuits)
      • Historic Merkle Tree privacy accumulator
      • Audience & challenge replay rejection
      • @nightpass/verifier & reference service
      • 68 Automated unit & simulator tests
      • React + Lace Preprod/Preview demo
                          │
                          ▼
                  WAVE 2 (Planned)
          Reusable Developer Infrastructure
      • Standalone TypeScript SDK (@nightpass/sdk)
      • Express / Next.js server verification middleware
      • Multi-plan & multi-tier access predicates
      • Credential renewal & secret rotation circuits
      • Off-chain verification spike (gasless logins)
      • Wallet-level fee sponsorship & relayer spike
                          │
                          ▼
                  WAVE 3 (Planned)
             Production Candidate & Pilot
      • Real external community or DApp pilot integration
      • Key recovery & emergency rotation model
      • Production gas & circuit optimizations
      • Independent security & privacy audit review
      • Developer self-serve onboarding portal
```

---

## Slide 6: Deep Dive — Wave 1 Delivery & What Has Been Done

### 1. Delivered Vertical Slice

Wave 1 delivers a complete, functional, end-to-end privacy access slice running on the official Midnight toolchain:

```
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│   contract/src/        │   │   packages/client/     │   │   packages/verifier/   │
│   nightpass.compact    │   │   @nightpass/client    │   │   @nightpass/verifier  │
│                        │   │                        │   │                        │
│ • issueMembership      │   │ • Secret derivation    │   │ • Challenge lifecycle  │
│ • proveAccess          │   │ • Merkle path builder  │   │ • Receipt verification │
│ • HistoricMerkleTree   │   │ • Sanitized errors     │   │ • 6 Denial reasons     │
│ • On-chain access log  │   │ • Preprod/Preview opts │   │ • Session token bounds │
└───────────┬────────────┘   └───────────┬────────────┘   └───────────┬────────────┘
            └─────────────────────────┐ │ ┌───────────────────────────┘
                                      ▼ ▼ ▼
                           ┌────────────────────────┐
                           │      apps/web/         │
                           │   React + Lace App     │
                           │                        │
                           │ • Creator Plan Studio  │
                           │ • Member Pass Vault    │
                           │ • Protected Service UI │
                           │ • Live Attack Suite    │
                           └────────────────────────┘
```

### 2. Pinned & Reproducible Toolchain

Every single tool and runtime version is strictly pinned and tested from clean checkouts:
- **Compact Toolchain:** `0.31.1` (Compact language `0.23`, runtime `0.16.0`)
- **Midnight SDK:** `4.1.1` (Ledger target `8.0.2`)
- **Proof Server Image:** `8.0.3`
- **Lace Connector API:** `4.0.1` / compatible wallet `4.x`
- **Node.js & npm:** `24.20.0` (`.nvmrc`) / npm `11.19.0`

### 3. Circuit Metrics & Complexity (Clean ZKIR Lint)

Measured directly from the compiled circuits using `compact-zkir-lint`:

| Circuit | Purpose | Constraint Power ($k$) | Instruction Count | Proof Payload Size |
|---|---|---|---|---|
| `issueMembership` | Authorized issuer registers member leaf | $k=12$ | 188 instructions | $\sim 192\text{ KB}$ |
| `proveAccess` | Zero-knowledge membership proof | $k=14$ | 228 instructions | $\sim 768\text{ KB}$ |

*Both circuits report clean with zero lint warnings or unconstrained witness vulnerabilities.*

### 4. Comprehensive Testing Rigor: 68 Automated Tests

The codebase enforces strict correctness and negative behavior across 4 distinct test suites:

```
TOTAL VERIFIED TESTS: 68 / 68 PASSING

  contract/ (21 tests)
  ├── Plan configuration policy & duration limits
  ├── Authority checks on membership issuance
  ├── Historic Merkle root validation
  ├── Audience binding & sessionKey isolation
  └── On-chain challenge replay rejection

  packages/client (16 tests)
  ├── Hex and byte label serialization
  ├── Cryptographic credential derivation
  ├── Deterministic pseudonym generation
  └── Error sanitization (zero secret leakage)

  packages/verifier (17 tests)
  ├── Challenge generation & TTL expiration
  ├── Session granting & lifetime capping
  ├── Domain isolation across verifier instances
  └── Six explicit denial states (Wrong Aud, Expired, Replayed, etc.)

  apps/web (14 tests)
  ├── Creator, Member, and Issuer workflow integration
  ├── Privacy boundary assertions
  └── Memory-safe state handling
```

### 5. Live Adversarial Attack Matrix (Tested & Demonstrated)

Wave 1 does not merely demonstrate the "happy path." The demo interface features an interactive adversarial attack suite proving visible rejections:

| Attack Scenario | Adversary Action | Defense Mechanism | System Behavior |
|---|---|---|---|
| **Non-Member Intrusion** | Caller generates random secret & tries to access | Merkle membership proof check | **Rejected:** No valid opening path to active tree root |
| **Path Impersonation** | Non-member steals a valid public path but lacks secret | Witness preimage check | **Rejected:** Leaf commitment hash mismatch in circuit |
| **Wrong Audience Replay** | Member takes valid proof minted for Service A to Service B | Audience binding: `sessionKey = H(aud, chal)` | **Rejected:** Receipt key does not exist under Service B |
| **Replayed Challenge** | Attacker intercepts spent proof & resubmits | Ledger access log insertion check | **Rejected:** Contract throws error on duplicate `sessionKey` |
| **Stale Challenge** | Attacker submits proof after challenge TTL expires | Verifier challenge timestamp window | **Rejected:** Verifier rejects expired challenge before session grant |
| **Expired Membership** | Member attempts access after membership timestamp | Circuit block-time constraint check | **Rejected:** `expiresAt <= currentTime` fails in circuit |
| **Unauthorized Issuance** | Malicious actor attempts to register membership leaf | Issuer commitment opening verification | **Rejected:** Circuit enforces valid `issuerSecret` preimage |

---

## Slide 7: Transparent Non-Claims & Wave 2 Engineering Handoff

In accordance with NightPass engineering principles, we state clearly what is **not** claimed in Wave 1 and how it drives the Wave 2 roadmap:

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│       Wave 1 Reality (Proven)        │       Wave 2 Solution (Planned)      │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ On-chain verification: Proofs are    │ Off-chain proof verification: Spike  │
│ posted on-chain, incurring block     │ client-to-server proof verification  │
│ confirmation latency and gas fees.   │ for instant, gasless session logins. │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ Wallet metadata gap: Gas fees paid   │ Fee sponsorship & relayers: Sponsor  │
│ from a transparent wallet could link │ DUST fees so user wallets never      │
│ issuance and access transactions.    │ touch access transactions.           │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ Single-tree capacity: Depth-10 tree  │ Dynamic tree indexing: Tiered trees  │
│ accommodates 1,024 members.          │ or rollover accumulators for scale.  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ Browser-memory credentials: Secrets  │ Secure credential backup: Encrypted  │
│ are kept in memory and lost on exit. │ passkeys / client storage recovery.  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## Slide 8: Market Opportunity & Target Segments

NightPass addresses the rapidly growing **Confidential Web3 Economy** and privacy-first SaaS landscape:

```
           TOTAL ADDRESSABLE MARKET (TAM)
    Global Privacy & Access Management: $28B+
                       │
                       ▼
       SERVICEABLE ADDRESSABLE MARKET (SAM)
     Web3 Subscriptions & Token Gating: $1.2B
                       │
                       ▼
         SERVICEABLE OBTAINABLE MARKET (SOM)
  High-Privacy Communities, APIs & Midnight DApps: $65M
```

### High-Conviction Beachhead Customers

1. **Confidential Research & Intelligence Portals:** Premium macro, financial, and cybersecurity publications where subscriber identities constitute trade secrets.
2. **Paid AI Agent & Developer APIs:** Services offering tiered API query allowances without exposing customer infrastructure identities or static API keys.
3. **Private Developer & Hacker Houses:** Technical gated communities requiring membership credentials without exposing cold-storage wealth.
4. **Confidential Conference & Hackathon Ticketing:** Verifiable event admissions where physical attendees refuse public on-chain attendance badges.
5. **DAO Working Groups:** Operational governance tools restricted to active contributors without public voter profiling.

---

## Slide 9: Business Model & Monetization Strategy

NightPass adopts a sustainable, **tokenless infrastructure model**:

```
                       NIGHTPASS PLATFORM
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
   FREE & OPEN CORE                               MONETIZED TIERS
• Compact Smart Contracts                     • Hosted Verifier Gateway (SaaS)
• TypeScript Client SDK                       • Zero-Maintenance Indexer RPC
• Local Verifier Package                      • Managed Creator Studio Dashboard
• Developer Documentation                     • Enterprise SLA & Custom Middleware
```

### Revenue Streams

- **Hosted Verification Gateway (API / SaaS):** High-throughput, managed verifier infrastructure for Web2 and Web3 services that do not want to manage node connections or challenge caches.
- **Creator Plan Platform Fee:** Optional micro-fee (0.5% – 1%) on paid membership plan activations processed through the NightPass gateway.
- **Enterprise Middleware & Custom Connectors:** Turnkey integration plugins for Discord, Discourse, Telegram, Shopify, and enterprise SSO providers.

---

## Slide 10: Competitive Advantage & Defensibility

| Feature / Capability | Public NFT Gating (Collab.Land, Tokenproof) | Web2 Centralized Gating (Stripe, Memberful) | EVM ZK Identity (Semaphore, Sismo) | **NightPass on Midnight** |
|---|---|---|---|---|
| **Identity Privacy** | ❌ None (Public Wallet) | ❌ None (Email/Credit Card) | ⚠️ Partial (EVM Address Leaks) | ✅ **Full Zero-Knowledge** |
| **Cross-Service Unlinkability** | ❌ Global Reused Wallet | ❌ Shared SSO / Tracking | ⚠️ Often Reuses Nullifiers | ✅ **Domain-Bound Pseudonyms** |
| **Data Breach Resistance** | ❌ On-chain data is public | ❌ DB holds all credentials | ⚠️ Bridge/Indexer risk | ✅ **Ledger holds only commitments** |
| **Replay Protection** | ⚠️ Signature challenges | ⚠️ Server session cookies | ⚠️ Centralized relays | ✅ **On-Chain spent challenges** |
| **Auditable Language** | ❌ Standard Solidity | ❌ Proprietary closed-source | ⚠️ Complex Circom circuits | ✅ **Native Compact `disclose()`** |
| **Infrastructure Overhead** | Low | High (Compliance/PCI) | High (Custom provers) | ✅ **Standard Midnight SDK** |

---

## Slide 11: Team, Engineering Standards & Execution

### Proven Delivery Discipline

- **Engineered to Production Standards:** Strict zero-warning TypeScript, decoupled packages (`client`, `verifier`, `contract`, `web`), and reproducible lockfiles.
- **Security-First Architecture:** No raw secrets in application state, zero logging of private keys, and automated error sanitization.
- **Transparent Open Source:** Licensed under **Apache 2.0**, fully documented architecture and threat models.

### Evidence Commands for Judges & Evaluators

Run the entire verification suite in under two minutes from a clean checkout:

```sh
# 1. Install pinned dependencies
npm ci

# 2. Compile Compact contracts, type-check, and run all 68 tests
npm run verify

# 3. Verify ZKIR circuit health and constraints
npx --yes compact-zkir-lint -r contract/src/managed/nightpass/zkir

# 4. Build web production bundle
npm run build
```

---

## Slide 12: The Ask & Next Steps

### Partner With NightPass

As we complete Wave 1 and accelerate into Wave 2, we are actively seeking:

1. **Design Partners & Pilot Operators:** Web3 communities, API providers, and technical publication creators looking to eliminate membership surveillance.
2. **Midnight Ecosystem Collaboration:** Technical coordination on fee-sponsorship relayers and off-chain verification standards.
3. **Build Club & Grant Support:** Leveraging Midnight Build Club mentorship to accelerate our Wave 2 SDK and Wave 3 production pilot.

> **NightPass proves you belong — without telling the world who you are.**  
> *Join us in setting the new standard for private access control on Midnight.*
