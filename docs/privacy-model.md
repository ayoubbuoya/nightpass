# NightPass minimal contract privacy model

Status: simulator-tested, browser-build-tested Wave 1 prototype. No public
deployment is recorded yet.

## Data boundary

| Data | Location | Privacy property |
|---|---|---|
| Issuer commitment | Public ledger | Domain-separated hash of the private issuer secret. |
| Membership commitment | Public ledger | Domain-separated hash of the member secret and salt. |
| Membership expiration | Public ledger | Visible and associated with the membership commitment. |
| Membership count and issuance timing | Publicly inferable | The registry size and transaction metadata can reveal adoption and timing. |
| Issuer secret | Wallet-local private state | Read by a witness; never disclosed or logged. |
| Member secret and salt | Wallet-local private state | Read by witnesses; never disclosed or logged. |
| Authorization outcome | Contract caller/network | The call succeeds or fails; no personal identity is intentionally disclosed. |
| Browser credential state | Page memory | Cleared on refresh; never written to URLs, local storage, logs, or analytics. |

## Circuit statements

`issueMembership` proves that the caller's private issuer secret hashes to the
sealed public issuer commitment. It rejects duplicate commitments and expiration
timestamps that are not strictly later than the Midnight block time.

`assertActiveMembership` proves that the caller knows a member secret and salt
whose domain-separated hash is present in the public membership registry. It
also checks the trusted block time against the public expiration. Membership is
valid at the exact expiration second and invalid afterward.

## Known privacy and security limitations

- The public registry exposes each commitment, its expiration, registry size,
  and observable transaction timing.
- The issuance transaction may link a commitment to the submitting wallet or
  other network metadata. Purchase privacy is not implemented or claimed.
- The commitment does not yet bind a plan, tier, contract/network identifier,
  or credential serial. This contract therefore supports only one implicit plan.
- Authorization is not bound to an audience, fresh challenge, or replay state.
  It is not yet safe to treat the assertion as a website login artifact.
- Revocation, renewal, recovery, payment, fee sponsorship, nullifiers, and
  service-specific pseudonyms are not implemented.
- Simulator tests validate contract semantics, not deployment, wallet storage,
  proving performance, side-channel resistance, or production security.
- The frontend unlock is local presentation state and can be bypassed with
  browser developer tools. It does not protect server-side content.
- The browser app serves the proving keys and ZKIR publicly. These are generated
  circuit artifacts, not member secrets.
- The current app uses no third-party fonts, analytics, or error-reporting
  service. Wallet and Midnight network endpoints still observe normal request
  and transaction metadata.

The next contract milestone must add narrowly scoped audience and challenge
binding, plus replay protection, before a protected-service integration can
claim secure authorization.
