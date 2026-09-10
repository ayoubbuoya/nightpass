// SPDX-License-Identifier: Apache-2.0

import {
  isContractAddress,
  type ContractAddress,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import {
  NightPassClient,
  commitmentHex,
  createIssuerPrivateState,
  createMemberCredential,
  encodeLabel,
  safeErrorMessage,
  servicePseudonym,
  withMemberCredential,
  type MemberCredential,
  type NightPassProviders,
  type NightPassPublicState,
} from "@nightpass/client";
import type { NightPassPrivateState } from "@nightpass/contract";
import {
  ProtectedService,
  type Challenge,
  type Verdict,
} from "@nightpass/verifier";
import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserProviders } from "./midnight.js";
import {
  DEMO_PLAN,
  PRIMARY_AUDIENCE,
  RIVAL_AUDIENCE,
  defaultExpiryInput,
  expiryToUnixSeconds,
  formatDuration,
  formatPrice,
  maxExpiryInput,
  shortHex,
} from "./workflow.js";

type Activity = Readonly<{
  tone: "idle" | "pending" | "success" | "error";
  message: string;
}>;

const idleActivity: Activity = {
  tone: "idle",
  message: "Connect Lace to begin.",
};

// A short-lived pass, used to demonstrate expiry rejection inside a demo or
// video without waiting for a realistic membership term to lapse.
const SHORT_LIVED_SECONDS = 60n;

const PublicValue = ({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) => (
  <div className="public-value">
    <span>{label}</span>
    <code title={value}>{shortHex(value, 14)}</code>
    {onCopy && (
      <button className="text-button" onClick={onCopy}>
        Copy
      </button>
    )}
  </div>
);

const App = () => {
  const networkId = import.meta.env.VITE_NETWORK_ID;

  const [providers, setProviders] = useState<NightPassProviders>();
  const [client, setClient] = useState<NightPassClient>();
  const [privateState, setPrivateState] = useState<NightPassPrivateState>();
  const [credential, setCredential] = useState<MemberCredential>();
  const [publicState, setPublicState] = useState<NightPassPublicState>();
  const [joinAddress, setJoinAddress] = useState("");

  const [issuanceCommitment, setIssuanceCommitment] = useState("");
  const [expiry, setExpiry] = useState(() => defaultExpiryInput());
  // The exact expiry the issuer registered. Required to locate the member's
  // leaf, because the leaf hashes the commitment together with its expiry.
  const [issuedExpiry, setIssuedExpiry] = useState<bigint>();
  const [activated, setActivated] = useState(false);

  const [challenge, setChallenge] = useState<Challenge>();
  const [verdict, setVerdict] = useState<Verdict>();
  const [lastProvenChallenge, setLastProvenChallenge] = useState<Uint8Array>();
  const [rivalProofNote, setRivalProofNote] = useState<string>();
  const [activity, setActivity] = useState<Activity>(idleActivity);

  // The protected reference service, and an unrelated second service used only
  // to demonstrate that a proof minted elsewhere is worthless here.
  const service = useRef(
    new ProtectedService({ audience: PRIMARY_AUDIENCE }),
  ).current;
  const rivalAudience = useMemo(() => encodeLabel(RIVAL_AUDIENCE), []);

  useEffect(() => {
    if (!client) return undefined;
    const subscription = client.publicState$.subscribe({
      next: setPublicState,
      error: () =>
        setActivity({
          tone: "error",
          message: "Could not read the latest public contract state.",
        }),
    });
    return () => subscription.unsubscribe();
  }, [client]);

  const contractAddress = client?.contractAddress;
  const busy = activity.tone === "pending";
  const ownCommitment = useMemo(
    () => (credential ? commitmentHex(credential) : undefined),
    [credential],
  );
  // What this specific service will learn about this member, computed locally
  // before anything is submitted.
  const expectedPseudonym = useMemo(
    () =>
      credential
        ? toHex(servicePseudonym(credential, service.audienceBytes))
        : undefined,
    [credential, service],
  );

  const run = async (message: string, operation: () => Promise<string>) => {
    setActivity({ tone: "pending", message });
    try {
      setActivity({ tone: "success", message: await operation() });
    } catch (error: unknown) {
      // Only allow-listed messages reach the UI; see @nightpass/client errors.
      setActivity({ tone: "error", message: safeErrorMessage(error) });
    }
  };

  const connect = () =>
    run("Waiting for Lace authorization…", async () => {
      setProviders(await createBrowserProviders(networkId));
      return `Lace connected to ${networkId}.`;
    });

  const resetMemberState = () => {
    setCredential(undefined);
    setIssuedExpiry(undefined);
    setActivated(false);
    setChallenge(undefined);
    setVerdict(undefined);
    setLastProvenChallenge(undefined);
    setRivalProofNote(undefined);
  };

  const publishPlan = () =>
    run(`Publishing ${DEMO_PLAN.name} and deploying NightPass…`, async () => {
      if (!providers) throw new Error("Connect Lace first");
      const state = createIssuerPrivateState();
      const deployed = await NightPassClient.deploy(providers, state, DEMO_PLAN);
      setPrivateState(state);
      setClient(deployed);
      resetMemberState();
      return `${DEMO_PLAN.name} published. Share the public contract address.`;
    });

  const join = () => {
    if (!providers || !isContractAddress(joinAddress)) {
      setActivity({ tone: "error", message: "Enter a valid contract address." });
      return;
    }
    return run("Joining the NightPass contract…", async () => {
      const state = createIssuerPrivateState();
      const joined = await NightPassClient.join(
        providers,
        joinAddress as ContractAddress,
        state,
      );
      setPrivateState(state);
      setClient(joined);
      resetMemberState();
      return "Contract joined. Generate a member credential for this session.";
    });
  };

  const generateCredential = () =>
    run("Generating credential locally…", async () => {
      if (!client || !privateState) throw new Error("Connect a contract first");
      const planName = publicState?.plan.name ?? DEMO_PLAN.name;
      const next = createMemberCredential(encodeLabel(planName));
      const nextState = withMemberCredential(privateState, next);
      await client.setPrivateState(nextState);

      setPrivateState(nextState);
      setCredential(next);
      setIssuanceCommitment(commitmentHex(next));
      setIssuedExpiry(undefined);
      setActivated(false);
      setVerdict(undefined);
      return "Private credential generated in session memory.";
    });

  const issueWith = (expiresAt: bigint) =>
    run("Generating proof and issuing membership…", async () => {
      if (!client) throw new Error("Connect a contract first");
      if (!/^[0-9a-fA-F]{64}$/.test(issuanceCommitment)) {
        throw new Error(
          "Membership commitment must contain 64 hexadecimal characters",
        );
      }
      const commitment = Uint8Array.from(
        issuanceCommitment.match(/.{2}/g) ?? [],
        (byte) => Number.parseInt(byte, 16),
      );
      const result = await client.issueMembership(commitment, expiresAt);
      setIssuedExpiry(expiresAt);
      setActivated(false);
      return `Membership registered at block ${result.blockHeight}.`;
    });

  const issue = () => issueWith(expiryToUnixSeconds(expiry));

  const issueShortLived = () =>
    issueWith(BigInt(Math.floor(Date.now() / 1_000)) + SHORT_LIVED_SECONDS);

  // Rebuilds the member's opening path from public ledger state and keeps it in
  // private state. Nothing here is submitted on chain.
  const activate = () =>
    run("Locating the membership in the public tree…", async () => {
      if (!client || !privateState || !credential || issuedExpiry === undefined) {
        throw new Error("Issue the membership first");
      }
      const located = await client.locateMembership(
        privateState,
        credential,
        issuedExpiry,
      );
      setPrivateState(located);
      setActivated(true);
      return "Membership activated. The opening path stays private.";
    });

  const requestChallenge = () => {
    const next = service.issueChallenge();
    setChallenge(next);
    setVerdict(undefined);
    setRivalProofNote(undefined);
    setActivity({
      tone: "success",
      message: `${PRIMARY_AUDIENCE} issued a single-use challenge.`,
    });
  };

  // The honest path: prove to this service against its own fresh challenge,
  // then let the service decide from public chain state alone.
  const signIn = () =>
    run("Proving membership and opening a session…", async () => {
      if (!client || !challenge) throw new Error("Request a challenge first");
      await client.proveAccess(service.audienceBytes, challenge.value);
      setLastProvenChallenge(challenge.value);

      // The transaction is finalized, so the receipt is expected: poll briefly
      // rather than mistaking indexer lag for a missing proof.
      const receipt = await client.waitForAccessReceipt(
        service.audienceBytes,
        challenge.value,
      );
      const decision = service.redeem(challenge.value, receipt);
      setVerdict(decision);
      return decision.outcome === "granted"
        ? `${PRIMARY_AUDIENCE} opened a session.`
        : `${PRIMARY_AUDIENCE} refused access: ${decision.message}.`;
    });

  // Attack 1: resubmit a challenge that has already been spent on chain.
  const attackReplay = () =>
    run("Replaying a spent challenge…", async () => {
      if (!client || !lastProvenChallenge) {
        throw new Error("Complete one successful sign-in first");
      }
      await client.proveAccess(service.audienceBytes, lastProvenChallenge);
      return "Replay was accepted — this must never happen.";
    });

  // Attack 2: prove to an unrelated service using this service's challenge,
  // then try to redeem it here.
  const attackWrongAudience = () =>
    run("Proving to a different service…", async () => {
      if (!client) throw new Error("Connect a contract first");
      const fresh = service.issueChallenge();
      setChallenge(fresh);

      await client.proveAccess(rivalAudience, fresh.value);
      const rivalReceipt = await client.waitForAccessReceipt(
        rivalAudience,
        fresh.value,
      );
      setRivalProofNote(
        rivalReceipt
          ? `The proof exists on chain, but only under ${RIVAL_AUDIENCE}'s session key.`
          : undefined,
      );

      // Deliberately a single read: no proof was minted for this audience, so
      // polling would only add delay before the expected refusal.
      const hereReceipt = await client.readAccessReceipt(
        service.audienceBytes,
        fresh.value,
      );
      const decision = service.redeem(fresh.value, hereReceipt);
      setVerdict(decision);
      return decision.outcome === "granted"
        ? "A foreign proof was accepted — this must never happen."
        : `${PRIMARY_AUDIENCE} refused access: ${decision.message}.`;
    });

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setActivity({ tone: "success", message: "Public value copied." });
  };

  const plan = publicState?.plan ?? DEMO_PLAN;
  const session = verdict?.outcome === "granted" ? verdict.session : undefined;

  return (
    <main className="shell">
      <header className="hero">
        <div className="eyebrow">MIDNIGHT · {networkId.toUpperCase()}</div>
        <h1>Prove you belong. Reveal nothing else.</h1>
        <p>
          NightPass proves an active membership to one named service, against
          one fresh challenge, without publishing a membership NFT, a reusable
          wallet identity, or any value that links your visits across services.
        </p>
        <div className="hero-actions">
          <button className="primary" onClick={connect} disabled={!!providers}>
            {providers ? "Lace connected" : "Connect Lace"}
          </button>
          <span className="network-pill">Test funds only · no payment taken</span>
        </div>
      </header>

      <section className={`status ${activity.tone}`} aria-live="polite">
        <span className="status-dot" />
        {activity.message}
      </section>

      <section className="workflow" aria-label="NightPass workflow">
        <article className="card">
          <span className="step">01 · CREATOR</span>
          <h2>Publish the plan</h2>
          <p>
            Deploys the contract with one plan and its public price and duration
            policy. The circuit refuses to register a pass that outlives it.
          </p>
          <dl className="policy">
            <div>
              <dt>Plan</dt>
              <dd>{plan.name}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{formatPrice(plan.priceMicroNight)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(plan.durationSeconds)}</dd>
            </div>
          </dl>
          <button onClick={publishPlan} disabled={!providers || busy}>
            Publish {DEMO_PLAN.name}
          </button>
          <div className="divider">
            <span>or</span>
          </div>
          <label>
            Contract address
            <input
              value={joinAddress}
              onChange={(event) => setJoinAddress(event.target.value.trim())}
              placeholder="0200…"
              spellCheck={false}
            />
          </label>
          <button
            className="secondary"
            onClick={join}
            disabled={!providers || !joinAddress || busy}
          >
            Join contract
          </button>
          {contractAddress && (
            <PublicValue
              label="Connected contract"
              value={contractAddress}
              onCopy={() => copyText(contractAddress)}
            />
          )}
        </article>

        <article className="card">
          <span className="step">02 · MEMBER</span>
          <h2>Create a credential</h2>
          <p>
            A secret and salt are generated in this page and never leave it.
            Only the commitment is shown, and only the commitment is shared with
            the issuer.
          </p>
          <button onClick={generateCredential} disabled={!client || busy}>
            Generate private credential
          </button>
          {ownCommitment && (
            <PublicValue
              label="Public commitment"
              value={ownCommitment}
              onCopy={() => copyText(ownCommitment)}
            />
          )}
          {expectedPseudonym && (
            <PublicValue
              label={`Pseudonym at ${PRIMARY_AUDIENCE}`}
              value={expectedPseudonym}
            />
          )}
          <div className="privacy-note">
            <strong>Never leaves this page</strong>
            <span>Member secret · random salt · membership opening path</span>
          </div>
        </article>

        <article className="card">
          <span className="step">03 · ISSUER</span>
          <h2>Register the membership</h2>
          <p>
            The issuer proves issuer authority and inserts a leaf holding the
            commitment and its expiry. This is a labelled test issuance and
            takes no payment.
          </p>
          <label>
            Membership commitment
            <input
              value={issuanceCommitment}
              onChange={(event) =>
                setIssuanceCommitment(event.target.value.trim())
              }
              placeholder="64 hexadecimal characters"
              spellCheck={false}
            />
          </label>
          <label>
            Public expiry
            <input
              type="datetime-local"
              value={expiry}
              max={maxExpiryInput(plan)}
              onChange={(event) => setExpiry(event.target.value)}
            />
          </label>
          <button onClick={issue} disabled={!client || !issuanceCommitment || busy}>
            Issue test membership
          </button>
          <button
            className="secondary"
            onClick={issueShortLived}
            disabled={!client || !issuanceCommitment || busy}
            title="Issues a pass that lapses in one minute, so expiry rejection can be demonstrated live"
          >
            Issue a 60-second pass
          </button>
        </article>

        <article className="card">
          <span className="step">04 · MEMBER</span>
          <h2>Activate</h2>
          <p>
            Rebuilds the opening path into the public membership tree from
            public data, then keeps it private. Proving later reveals the tree
            root, never which leaf was used.
          </p>
          <button
            onClick={activate}
            disabled={!client || !credential || issuedExpiry === undefined || busy}
          >
            Activate membership
          </button>
          <div className={`gate ${activated ? "open" : "closed"}`}>
            <span>{activated ? "READY TO PROVE" : "NOT ACTIVATED"}</span>
            <strong>
              {activated
                ? "The opening path is held in session memory"
                : "Issue the membership, then activate it"}
            </strong>
          </div>
        </article>
      </section>

      <section className="service" aria-label="Protected reference service">
        <div className="service-head">
          <span className="step">05 · PROTECTED SERVICE</span>
          <h2>{PRIMARY_AUDIENCE}</h2>
          <p>
            This service issues a single-use challenge, then decides purely from
            public chain state. It never sees a secret, a commitment, or a
            wallet address.
          </p>
        </div>

        <div className="service-grid">
          <div className="service-panel">
            <h3>Sign in with NightPass</h3>
            <button onClick={requestChallenge} disabled={!client || busy}>
              Request challenge
            </button>
            {challenge && (
              <PublicValue label="Challenge" value={toHex(challenge.value)} />
            )}
            <button
              className="primary"
              onClick={signIn}
              disabled={!client || !activated || !challenge || busy}
            >
              Prove membership
            </button>
          </div>

          <div className="service-panel">
            <h3>Service decision</h3>
            {!verdict && <p className="muted">No attempt yet.</p>}
            {verdict?.outcome === "denied" && (
              <div className="verdict denied">
                <span>ACCESS DENIED</span>
                <strong>{verdict.message}</strong>
                <code>{verdict.reason}</code>
              </div>
            )}
            {session && (
              <div className="verdict granted">
                <span>SESSION OPEN</span>
                <strong>Builders Pro · private briefing unlocked</strong>
                <dl>
                  <div>
                    <dt>Known as</dt>
                    <dd>
                      <code>{shortHex(session.pseudonym, 12)}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Visitor</dt>
                    <dd>{session.returning ? "Returning" : "First visit"}</dd>
                  </div>
                  <div>
                    <dt>Session ends</dt>
                    <dd>{new Date(session.expiresAt).toLocaleTimeString()}</dd>
                  </div>
                </dl>
              </div>
            )}
            {rivalProofNote && <p className="muted">{rivalProofNote}</p>}
          </div>

          <div className="service-panel attacks">
            <h3>Try to cheat</h3>
            <p className="muted">
              Each attempt is refused by the contract or by the service, and the
              banner above shows which one refused it.
            </p>
            <button
              className="danger"
              onClick={attackReplay}
              disabled={!client || !lastProvenChallenge || busy}
            >
              Replay a spent challenge
            </button>
            <button
              className="danger"
              onClick={attackWrongAudience}
              disabled={!client || !activated || busy}
            >
              Reuse a proof from {RIVAL_AUDIENCE}
            </button>
            <p className="muted">
              For expiry: issue a 60-second pass, activate it, wait for it to
              lapse, then prove.
            </p>
          </div>
        </div>
      </section>

      <section className="boundary">
        <div>
          <span className="step">PRIVACY BOUNDARY</span>
          <h2>Exactly what the ledger holds.</h2>
          <p>
            Read live from the indexer, so the claim on the left can be checked
            against the numbers on the right.
          </p>
        </div>
        <dl>
          <div>
            <dt>Public</dt>
            <dd>
              Plan policy, issuer commitment, membership tree root, access
              receipts (audience, per-service pseudonym, expiry)
            </dd>
          </div>
          <div>
            <dt>Private</dt>
            <dd>
              Member secret, salt, membership commitment, opening path, which
              leaf was used
            </dd>
          </div>
          <div>
            <dt>Disclosed on access</dt>
            <dd>
              Tree root, audience, challenge, membership expiry, per-service
              pseudonym
            </dd>
          </div>
          <div>
            <dt>Not yet built</dt>
            <dd>
              Payment settlement, revocation, recovery, credential persistence,
              multiple plans, off-chain proof verification
            </dd>
          </div>
        </dl>
        <div className="public-stats">
          <div>
            <span>Registered memberships</span>
            <strong>{publicState?.membershipCount.toString() ?? "—"}</strong>
          </div>
          <div>
            <span>Public access receipts</span>
            <strong>{publicState?.accessRecordCount.toString() ?? "—"}</strong>
          </div>
          <div>
            <span>Issuer commitment</span>
            <strong>
              <code>
                {publicState ? shortHex(publicState.issuerCommitment, 8) : "—"}
              </code>
            </strong>
          </div>
        </div>
      </section>

      <footer>
        Prototype. The membership tree holds at most 1024 members, credentials
        are lost on refresh, and the verifier runs in this page rather than on a
        server. Do not use real secrets.
      </footer>
    </main>
  );
};

export default App;
