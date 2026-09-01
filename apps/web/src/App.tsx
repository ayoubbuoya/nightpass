// SPDX-License-Identifier: Apache-2.0

import { isContractAddress, type ContractAddress } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import {
  NightPassClient,
  commitmentHex,
  createIssuerPrivateState,
  createMemberCredential,
  safeErrorMessage,
  withMemberCredential,
  type MemberCredential,
  type NightPassProviders,
  type NightPassPublicState,
} from "@nightpass/client";
import type { NightPassPrivateState } from "@nightpass/contract";
import { useEffect, useMemo, useState } from "react";
import { createBrowserProviders } from "./midnight.js";
import { defaultExpiryInput, expiryToUnixSeconds } from "./workflow.js";

type Activity = Readonly<{
  tone: "idle" | "pending" | "success" | "error";
  message: string;
}>;

const idleActivity: Activity = {
  tone: "idle",
  message: "Connect Lace to begin.",
};

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
  const [activity, setActivity] = useState<Activity>(idleActivity);
  const [accessGranted, setAccessGranted] = useState(false);

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
  const ownCommitment = useMemo(
    () => (credential ? commitmentHex(credential) : undefined),
    [credential],
  );

  const run = async (message: string, operation: () => Promise<string>) => {
    setActivity({ tone: "pending", message });
    try {
      const success = await operation();
      setActivity({ tone: "success", message: success });
    } catch (error: unknown) {
      setActivity({ tone: "error", message: safeErrorMessage(error) });
      throw error;
    }
  };

  const connect = async () => {
    try {
      await run("Waiting for Lace authorization…", async () => {
        setProviders(await createBrowserProviders(networkId));
        return `Lace connected to ${networkId}.`;
      });
    } catch {
      // The status banner already contains the deliberately sanitized error.
    }
  };

  const deploy = async () => {
    if (!providers) return;
    try {
      await run("Generating issuer state and deploying NightPass…", async () => {
        const state = createIssuerPrivateState();
        const deployed = await NightPassClient.deploy(providers, state);
        setPrivateState(state);
        setClient(deployed);
        setCredential(undefined);
        setAccessGranted(false);
        return "NightPass deployed. Save the public contract address.";
      });
    } catch {
      // Sanitized above.
    }
  };

  const join = async () => {
    if (!providers || !isContractAddress(joinAddress)) {
      setActivity({ tone: "error", message: "Enter a valid contract address." });
      return;
    }
    try {
      await run("Joining the NightPass contract…", async () => {
        const state = createIssuerPrivateState();
        const joined = await NightPassClient.join(
          providers,
          joinAddress as ContractAddress,
          state,
        );
        setPrivateState(state);
        setClient(joined);
        setCredential(undefined);
        setAccessGranted(false);
        return "Contract joined. Generate a member credential for this session.";
      });
    } catch {
      // Sanitized above.
    }
  };

  const generateCredential = async () => {
    if (!client || !privateState) return;
    try {
      await run("Generating credential locally…", async () => {
        const nextCredential = createMemberCredential();
        const nextState = withMemberCredential(privateState, nextCredential);
        await client.setPrivateState(nextState);
        setPrivateState(nextState);
        setCredential(nextCredential);
        setIssuanceCommitment(commitmentHex(nextCredential));
        setAccessGranted(false);
        return "Private credential generated in session memory.";
      });
    } catch {
      // Sanitized above.
    }
  };

  const issue = async () => {
    if (!client) return;
    try {
      await run("Generating proof and issuing membership…", async () => {
        if (!/^[0-9a-fA-F]{64}$/.test(issuanceCommitment)) {
          throw new Error("Membership commitment must contain 64 hexadecimal characters");
        }
        const commitment = Uint8Array.from(
          issuanceCommitment.match(/.{2}/g) ?? [],
          (byte) => Number.parseInt(byte, 16),
        );
        const result = await client.issueMembership(
          commitment,
          expiryToUnixSeconds(expiry),
        );
        return `Membership confirmed at block ${result.blockHeight}.`;
      });
    } catch {
      // Sanitized above.
    }
  };

  const authorize = async () => {
    if (!client || !credential) return;
    setAccessGranted(false);
    try {
      await run("Proving active membership…", async () => {
        const result = await client.assertActiveMembership();
        setAccessGranted(true);
        return `Access assertion confirmed at block ${result.blockHeight}.`;
      });
    } catch {
      // Sanitized above.
    }
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setActivity({ tone: "success", message: "Public value copied." });
  };

  return (
    <main className="shell">
      <header className="hero">
        <div className="eyebrow">MIDNIGHT · {networkId.toUpperCase()}</div>
        <h1>Membership without the public identity trail.</h1>
        <p>
          NightPass proves that this browser knows an active membership
          credential. The member secret and salt stay in session memory.
        </p>
        <div className="hero-actions">
          <button className="primary" onClick={connect} disabled={!!providers}>
            {providers ? "Lace connected" : "Connect Lace"}
          </button>
          <span className="network-pill">On-chain demo · test funds only</span>
        </div>
      </header>

      <section className={`status ${activity.tone}`} aria-live="polite">
        <span className="status-dot" />
        {activity.message}
      </section>

      <section className="workflow" aria-label="NightPass workflow">
        <article className="card">
          <span className="step">01 · CONTRACT</span>
          <h2>Deploy or join</h2>
          <p>Create the single-plan demo as issuer, or join its public address.</p>
          <button onClick={deploy} disabled={!providers || activity.tone === "pending"}>
            Deploy NightPass
          </button>
          <div className="divider"><span>or</span></div>
          <label>
            Contract address
            <input
              value={joinAddress}
              onChange={(event) => setJoinAddress(event.target.value.trim())}
              placeholder="0200…"
              spellCheck={false}
            />
          </label>
          <button className="secondary" onClick={join} disabled={!providers || !joinAddress}>
            Join contract
          </button>
          {contractAddress && (
            <div className="public-value">
              <span>Connected contract</span>
              <code>{contractAddress}</code>
              <button className="text-button" onClick={() => copyText(contractAddress)}>
                Copy address
              </button>
            </div>
          )}
        </article>

        <article className="card">
          <span className="step">02 · MEMBER</span>
          <h2>Create credential</h2>
          <p>
            Generate a high-entropy secret and salt locally. Refreshing this
            prototype permanently clears them.
          </p>
          <button onClick={generateCredential} disabled={!client || activity.tone === "pending"}>
            Generate private credential
          </button>
          {ownCommitment && (
            <div className="public-value">
              <span>Public commitment</span>
              <code>{ownCommitment}</code>
              <button className="text-button" onClick={() => copyText(ownCommitment)}>
                Copy commitment
              </button>
            </div>
          )}
          <div className="privacy-note">
            <strong>Stays private</strong>
            <span>Member secret · random salt</span>
          </div>
        </article>

        <article className="card">
          <span className="step">03 · ISSUER</span>
          <h2>Issue membership</h2>
          <p>The issuer registers only the commitment and public expiry.</p>
          <label>
            Membership commitment
            <input
              value={issuanceCommitment}
              onChange={(event) => setIssuanceCommitment(event.target.value.trim())}
              placeholder="64 hexadecimal characters"
              spellCheck={false}
            />
          </label>
          <label>
            Public expiry
            <input
              type="datetime-local"
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
            />
          </label>
          <button onClick={issue} disabled={!client || !issuanceCommitment || activity.tone === "pending"}>
            Issue test membership
          </button>
          <div className="public-stats">
            <span>Public membership count</span>
            <strong>{publicState?.membershipCount.toString() ?? "—"}</strong>
          </div>
        </article>

        <article className="card protected-card">
          <span className="step">04 · ACCESS</span>
          <h2>Prove membership</h2>
          <p>
            Generate an on-chain proof that the session credential opens an
            active registered commitment.
          </p>
          <button onClick={authorize} disabled={!client || !credential || activity.tone === "pending"}>
            Request protected access
          </button>
          <div className={`gate ${accessGranted ? "open" : "closed"}`}>
            <span>{accessGranted ? "ACCESS CONFIRMED" : "PROTECTED"}</span>
            <strong>
              {accessGranted
                ? "Builders Pro · private briefing unlocked"
                : "A confirmed membership assertion is required"}
            </strong>
          </div>
        </article>
      </section>

      <section className="boundary">
        <div>
          <span className="step">PRIVACY BOUNDARY</span>
          <h2>What this demo proves—and what it does not.</h2>
        </div>
        <dl>
          <div><dt>Private</dt><dd>Issuer secret, member secret, member salt</dd></div>
          <div><dt>Public</dt><dd>Commitment, expiry, registry size, transactions</dd></div>
          <div><dt>Not yet included</dt><dd>Audience, challenge, replay protection, backend session</dd></div>
        </dl>
      </section>

      <footer>
        This screen is a contract workflow demonstrator. Frontend gating can be
        bypassed and must not protect real content.
      </footer>
    </main>
  );
};

export default App;
