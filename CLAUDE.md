# NightPass Repository Guidance

## Project

NightPass is privacy-preserving membership and access-control infrastructure for Midnight. A user should be able to prove a valid membership without exposing a public membership NFT, a reusable wallet identity, their full payment history, or activity across unrelated services.

The repository is currently in its planning/bootstrap phase. The working product and buildathon source of truth is `docs/NightPass_Project_Details.md`. Read the relevant sections before making architecture, privacy, scope, or submission decisions. Update the document when experiments or organizer clarifications invalidate an assumption.

## Current priorities

Work toward the Wave 1 vertical slice before expanding the product:

1. Pin and document a working Midnight toolchain.
2. Prove the access-authorization architecture with the current Compact and Midnight SDK capabilities.
3. Implement the smallest compiling Compact membership contract and simulator tests.
4. Build one end-to-end creator, member, and protected-service flow.
5. Demonstrate valid access plus rejection of invalid, expired, wrong-audience, and replayed authorization attempts.
6. Make local setup and judge evaluation reproducible.

Treat the proposed layout in the project details as guidance, not as a requirement that overrides current Midnight templates or package conventions.

## Non-negotiable product boundaries

- Privacy is a functional requirement, not a marketing layer. Document what is public, private, and selectively disclosed for every flow.
- Never log, commit, place in URLs, or add to analytics any member secret, wallet seed, private credential, or other sensitive witness material.
- Scope challenges, pseudonyms, and nullifiers narrowly enough to prevent replay and unnecessary cross-service correlation.
- Do not claim that purchase privacy, unlinkability, recovery, fee sponsorship, off-chain verification, production security, or regulatory suitability works until the repository contains evidence for that exact claim.
- Keep the Compact contract and public state as small and auditable as the current milestone permits.
- Clearly label test payments, mock services, simulator-only behavior, and other demo substitutions.
- Preserve explicit known limitations and privacy tradeoffs in code comments and documentation.

## Architecture and implementation

- Follow the exact APIs and types of the pinned Compact compiler and Midnight SDK. Conceptual formulas and sample APIs in the planning document are not ready-to-copy implementation code.
- Prefer a complete, thin vertical slice over broad scaffolding or speculative abstractions.
- Separate contract/public-ledger state, wallet-local private state, disclosed proof outputs, and conventional application/session state.
- Keep verifier decisions bound to the expected plan, tier when applicable, audience, fresh challenge, network, expiration, and replay state.
- Isolate generated bindings and managed artifacts from handwritten source. Document whether generated files are committed and how to regenerate them.
- Introduce SDK abstractions only after the underlying contract and authorization flow are demonstrated.
- Record material architecture and privacy decisions in `docs/` and link them from the main README once it exists.

## Repository layout

The intended high-level areas are:

- `contract/`: Compact source, managed/generated artifacts, and contract/simulator tests.
- `packages/`: reusable core client, verifier, and React integration packages.
- `apps/`: creator dashboard, member app, and protected reference application.
- `docs/`: architecture, privacy model, threat model, test plan, decisions, and wave progress.
- `scripts/`: repeatable setup, generation, deployment, and demo helpers.

Do not create empty packages merely to match this outline. Add each area when its first working slice is implemented.

## Commands and dependencies

No application toolchain has been committed yet. When bootstrapping it:

- Pin the package manager, runtime, Compact compiler, Midnight SDK, wallet/private-state provider, proof server, indexer, node, and target network versions.
- Add canonical build, contract-compile, generate, lint, typecheck, test, and end-to-end commands to the root README and package scripts.
- Use the repository's pinned package manager and lockfile consistently after they are established.
- Prefer documented, non-interactive commands that work from a clean checkout.
- Do not invent fallback commands when a required tool is unavailable; report the missing dependency and the exact failed command.

## Testing and verification

Run the smallest relevant checks during iteration and the full documented verification suite before declaring a change complete. At minimum, cover behavior changed by the patch.

Contract and authorization work should test successful issuance/access and the applicable negative cases, including unauthorized changes, incorrect secrets, wrong plan or audience, expiration, revocation, stale or reused challenges, reused nullifiers, network mismatch, and boundary values.

Application work should cover wallet rejection, unavailable or stale network services, slow proof generation, duplicate submission, refresh during confirmation, cancellation, lost local state, accessible keyboard/mobile flows, and secret-free error handling where relevant.

For privacy-sensitive changes, inspect logs, URLs, browser storage, analytics/error payloads, fixtures, screenshots, and committed files for unintended disclosure. Never use real secrets in tests or examples.

## Documentation and submission evidence

- Keep setup, architecture, Midnight integration, test instructions, demo steps, known limitations, and public/private/disclosed data accurate as implementation changes.
- Maintain small, descriptive commits and wave-specific changelogs or progress notes.
- Preserve reproducible evidence of the compiler/SDK versions, contract compilation, tests, deployments, and meaningful changes made in each wave.
- Do not commit buildathon credentials, funded account secrets, wallet seeds, private credentials, or local environment files.
- Before a wave submission, verify the repository checklist in `docs/NightPass_Project_Details.md`, including license, GitHub topic/label, pinned versions, README, demo, and change evidence.

## Planning and user approval

- Before implementing, editing, generating, deleting, or otherwise changing project files, explain the full proposed plan to the user.
- The plan must identify the intended outcome, files or areas expected to change, implementation approach, validation steps, and material risks or tradeoffs.
- Wait for the user's explicit approval of the plan before making project changes. Do not interpret silence as approval.
- Read-only inspection and planning may be performed before approval when needed to produce an accurate plan, but must not modify repository state.
- If new information would materially change an approved plan, stop, explain the revised plan, and request approval again before continuing.

## Response format

End every implementation or task-completion response with these sections, in this order:

### Summary

State what was completed or determined.

### Files changed

List every changed file, or state `None`.

### Testing steps

List checks performed and their results, plus any checks the user should run. If no tests apply, state that clearly.

### Remaining risks

List unresolved risks, assumptions, limitations, or blockers. If none are known, state `None known`.

### Next steps

State the most useful next actions. Always include this section.

For requests that are only questions, explanations, or other non-task conversation, answer naturally without requiring the full structure. Still finish with a clearly labeled `Next steps` statement, even if the next step is that none is required.

## Working conventions

- Inspect existing code, manifests, generated-file policies, and nearby tests before editing.
- Keep changes focused; avoid unrelated refactors during feature or bug-fix work.
- Preserve user-authored changes in a dirty worktree.
- Prefer explicit errors and actionable user recovery states over silent fallback behavior.
- Comment decisions and privacy invariants, not obvious syntax.
- If current Midnight behavior is uncertain, verify it against pinned official documentation or a minimal executable spike and record the result.
- When an unresolved choice materially changes privacy, security, or architecture, document the options and tradeoffs rather than silently choosing one.

## Definition of done

A change is complete when its intended path works, relevant negative paths are covered, required commands pass, sensitive data is not exposed, and the documentation accurately describes the resulting behavior and limitations.
