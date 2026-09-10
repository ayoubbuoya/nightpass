# NightPass Wave 1 demo script

Follows the demo sequence in `NightPass_Project_Details.md` §23. Every step is
performed in the running application against a live network, except where
labelled.

## Before recording

```sh
npm ci
npm run verify          # 68 tests; compiles the contract first
npm run proof:up        # local proof server on :6300
npm run dev
```

Requirements: Lace on Preprod, unlocked, funded with test NIGHT and tDUST, and
configured to use `http://localhost:6300` as its proof server.

Have a second browser profile ready for the non-member.

## Sequence

### 1. The creator publishes a plan

Connect Lace. Press **Publish Builders Pro**.

Point out the published policy: name, price, and 30-day duration. Say plainly
that the price is policy the issuer commits to publicly, and that this build
takes no payment.

Copy the contract address.

### 2. Alice receives a private credential

Press **Generate private credential**.

Show that only the commitment is displayed. Read the "Never leaves this page"
note aloud: secret, salt, and opening path stay in the tab.

Show the pseudonym the protected service will see — computed locally, before
anything is submitted, so Alice knows exactly what she is about to reveal.

### 3. The issuer registers the membership

The commitment field is already filled. Press **Issue test membership**.

While the proof generates, note that the issuer proves issuer authority in zero
knowledge — the issuer secret is never published, only its commitment was, at
deployment.

### 4. Alice activates

Press **Activate membership**.

Explain what just happened: the browser read the public membership tree, found
Alice's leaf, and kept the opening path private. Nothing was submitted.

### 5. Alice accesses the protected service

At `builders.nightpass.dev`, press **Request challenge**, then **Prove
membership**.

Show the granted session: Alice is known only as a pseudonym, marked as a first
visit, with the session capped by her membership expiry.

Press request-and-prove a second time. The service now marks her as
**Returning** — recognised without ever being identified.

### 6. Bob, a non-member, is rejected

In the second browser profile, join the same contract address, generate a
credential, and try to activate.

Refused: `Membership is not registered`. Bob was never issued, so he has no leaf
and no path.

### 7. A proof for the wrong audience is rejected

Back in Alice's tab, press **Reuse a proof from research.nightpass.dev**.

Alice really does produce a valid proof — but bound to the other service's
audience. `builders.nightpass.dev` looks under its own session key and finds
nothing. The panel says so explicitly: the proof exists on chain, but only under
the other service's key.

### 8. A replayed challenge is rejected

Press **Replay a spent challenge**.

Refused by the contract: `Access challenge was already used`. Emphasise that
this is the *contract* refusing, not the web page — a captured transaction
cannot be resubmitted even against a verifier that lost its state.

### 9. An expired credential is rejected

Generate a fresh credential, press **Issue a 60-second pass**, activate, wait
for it to lapse, then request a challenge and prove.

Refused by the contract against trusted block time: `Membership has expired`.

### 10. Show the ledger

Scroll to the privacy boundary section. Read the live numbers.

Say the specific thing that makes this work: the access receipts contain an
audience, a pseudonym, and an expiry — and no membership commitment. The
membership tree published a root, never which leaf Alice used.

Then state the limitation honestly: the transaction was still paid for by
Alice's wallet, so wallet-level correlation is not solved. That is Wave 2.

### 11. Show the evidence

```sh
npm run verify
```

68 tests: 21 contract, 16 client, 17 verifier, 14 application.

## Timing note

Proof generation takes noticeably longer than a normal web request. Either keep
talking through it or cut in the edit — but do not misrepresent the latency, and
do not cut in a way that implies a login is instant.
