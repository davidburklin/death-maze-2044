# Death Maze 2044 Implementation Plan

Last updated: 2026-04-17

## 1) Current Direction

The current branch target is `feature/chasing-mvp-1`.

MVP-1 is not the full first-playable loop from the original plan. It is a narrower proof of the multiplayer spine:

- Authenticated players enter the lobby.
- Ready players move to character creation.
- Character creation validates the entrant's starting attributes and survival-bias choice.
- A valid entrant can enter an active maze run.
- If no active run has capacity, entering the maze creates a new empty maze.
- There is no minimum party size; solo entrants can enter immediately.
- Up to 5 players can enter the same maze before it is full.
- Each entrant is randomly assigned to one of 5 one-way entry points into a macro cell.
- Players can move through an empty maze.
- Server-side movement validation proves one-way and two-way macro-cell passages work as expected.

Explicitly out of MVP-1:

- Item drops, splice-module discovery, inventory progression, or graft-port reconfiguration.
- Enemies, encounter spawning, combat instances, combat UI, rewards, or balance tuning.
- Nexus-core completion, signal-fragment objectives, final-exit victory, or run win/loss state.
- Phaser production rendering, sprite atlases, telemetry, moderation, and reconnect polish.

## 2) Repo Baseline

The repo is already past the original Phase 0/1 planning state.

Implemented or scaffolded:

- Nuxt 4 app shell and Death Maze branding.
- Baseline scripts for `dev`, `build`, `generate`, `preview`, `lint`, `typecheck`, and `test`.
- Vitest configuration and deterministic shared-game tests.
- CI workflow for install, lint, typecheck, test, and build.
- Convex scaffold, auth config, generated API files, and initial schema.
- Google identity flow and Convex player bootstrap.
- Lobby profile setup, lobby chat, active member list, typing indicator, and ready/unready state.
- Shared deterministic RNG, world generation, world validation, objective state primitives, and combat turn primitives.
- Dedicated MVP character creation route with survival-bias validation and story material.
- Convex character mutations/queries for the MVP creation contract.
- Run and run-member tables for active empty-maze runs.
- Five one-way run entry points generated per run.
- `enterMaze` mutation that creates or joins an open run and assigns an unused entry point.
- Authoritative movement mutation that validates current position, directed connections, and one-way entry doors.
- `/run/:runId` exploration page for inspecting current run state, party positions, legal exits, and movement results.

Not yet implemented for MVP-1:

- Manual two-client smoke notes for the completed empty-maze movement proof.
- Optional airlock or wait-screen polish, without adding a minimum party size.

## 3) Legacy Behavior To Port

Legacy gameplay behavior exists in an external repo that is not part of this workspace.

Porting rules:

- Do not rely on local absolute file links in planning docs.
- Before porting a subsystem, capture its expected inputs, outputs, invariants, and renamed terminology in this repo.
- Once local contract tests exist, those tests become the normative reference for future refactors.
- Record intentional deviations in [docs/legacy-port-notes.md](./legacy-port-notes.md).

Already ported or captured locally:

- World generation and topology.
- Deterministic RNG helpers.
- World validity and run-complete checks.
- Objective progression state updates.
- Combat initiative ordering and round advancement primitives.

MVP-1 additions to define locally:

- Five one-way run entry points.
- Active-run capacity and run-membership rules.
- Authoritative macro-cell movement through directed connections.

Build new in this repo after MVP-1:

- Encounter spawning.
- Enemy AI behaviors.
- Itemization and status effects.
- Multiplayer combat orchestration and anti-cheat validation.
- Graphics and rendering pipeline.

## 4) Genre Migration Rules

Legacy fantasy labels are replaced with 2044 sci-fi domain language.

Core renames:

- relic -> nexusCore
- clue -> signalFragment
- mastery -> override
- keyed gate -> credentialGate
- puzzle gate -> networkLock
- manipulation gate -> sequenceGate

Rule:

- No medieval nomenclature survives in gameplay data models or UI copy.

## 5) Runtime Architecture

Primary stack:

- Nuxt 4 + Vue 3 + TypeScript for the client.
- Pinia for client orchestration only.
- Convex for authoritative game state and real-time sync.
- Vercel for frontend deployment.

Code placement:

- Shared deterministic domain rules live in `shared/game/*`.
- Convex imports and executes shared rules for authoritative outcomes.
- The Nuxt client may import shared modules only for rendering support, previews, and debug views.
- Domain types belong in `shared/game/*`; app-local view models stay under `app/` only when they are UI-specific.

Authoritative boundary:

- All game-truth mutations run in Convex.
- Client sends intents only, such as enter maze and move through a connection.
- Client never resolves movement legality locally.
- Client never commits authoritative state transitions from shared helpers.

MVP-1 loop:

- Lobby.
- Character creation.
- Empty maze exploration for up to 5 players.
- Directed movement through one-way and two-way macro-cell passages.

Post-MVP target loop:

- Real-time party exploration.
- Encounter trigger creates a combat instance.
- Initiative rounds execute only inside that combat instance.
- On resolution, players return to exploration state.

## 6) Graphics Delivery Decision

MVP-1 renderer:

- Use a low-fidelity tactical/debug renderer first.
- Prioritize readable topology, current position, party positions, and legal exits.
- Clearly distinguish one-way and two-way passages.
- Do not block MVP-1 on Phaser, sprite atlases, animation, or production asset delivery.

Post-MVP production direction:

- Phaser 3 remains the preferred production renderer.
- Keep a fallback tactical renderer for debugging and low-end devices.

Asset delivery approach for later milestones:

- Versioned sprite atlases and UI icon sheets in static hosting.
- Hashed file names for cache busting.
- CDN caching headers with immutable assets.
- Asset manifest file mapping logical ids to versioned URLs.

## 7) MVP-1 Execution Plan

### Step 1: Planning Alignment

- Update planning docs to describe the narrowed MVP-1 scope.
- Mark combat, itemization, enemies, and graphics production as deferred.
- Update handoff notes so future sessions start from character creation and run entry, not Phase 0.

Exit criteria:

- Planning docs describe `lobby -> character creation -> empty maze exploration`.
- Remaining tasks map directly to the MVP-1 acceptance tests.

### Step 2: Character Creation Contract

- Add an MVP character-creation route or screen reached after readying up.
- Preserve the existing `Unready` behavior as an exit back to the lobby.
- Add `Enter Maze`, disabled until the character is valid.
- Implement survival-bias selection: base `1` in every attribute, plus `1` to exactly one selected attribute.
- Include the implant and survival-bias story material in the UI copy.
- Store only the MVP character state needed to enter the maze.

Exit criteria:

- Ready players reach character creation.
- Invalid characters cannot enter the maze.
- Unready returns the player to the lobby and clears ready state.

### Step 3: Active Run Data Model

Status: complete for MVP-1 run entry.

- Add Convex tables and indexes for runs and run members.
- Cap each run at 5 players.
- Store the generated world seed or serialized topology needed for movement validation.
- Store five entry points, each representing a one-way entrance into a macro cell.
- Track each run member's character, assigned entry point, and current macro-cell position.

Exit criteria:

- Convex schema supports active empty-maze runs.
- A run can represent up to 5 entrants and reject or avoid over-capacity membership.

### Step 4: Enter Maze Mutation

Status: complete for MVP-1 run entry.

- Implement `enterMaze` as the authoritative transition from character creation to run.
- Require authentication, lobby membership or current ready state, and a valid character.
- If the player already has an active run membership, return that run.
- If an open active run exists with fewer than 5 players, join it.
- If no open active run exists, generate a new maze and create a run.
- Randomly assign one unused entry point to the player.
- Route the client to `/run/:runId`.

Exit criteria:

- First entrant creates a run.
- Entrants 2 through 5 join the same open run.
- No run exceeds 5 active players.
- Repeated `Enter Maze` submissions are idempotent for the same player.

### Step 5: Authoritative Exploration Movement

Status: complete for MVP-1 movement proof.

- Implement movement as a Convex mutation that accepts an intent to traverse a specific passage.
- Validate that the player belongs to the run.
- Validate that the passage begins at the player's current macro cell.
- Allow movement through two-way passages in either represented direction.
- Allow movement through one-way passages only in the stored direction.
- Reject reverse movement through one-way entry points and one-way macro-cell passages.
- Update the player's current macro-cell position on valid movement.

Exit criteria:

- Invalid movement intents are rejected server-side.
- One-way passages cannot be traversed backward.
- Two-way passages can be traversed in both directions.
- Multiple clients observe synchronized player positions.

### Step 6: Empty Maze Run UI

Status: complete for MVP-1 movement proof.

- Add `/run/:runId`.
- Render the current macro-cell, available exits, and party positions.
- Show movement controls based on server-provided legal exits.
- Distinguish one-way and two-way passages in the UI.
- Avoid enemies, inventory, combat controls, and objective panels for MVP-1.

Exit criteria:

- A player can enter a run and move through the generated maze.
- Two clients in the same run can observe each other's movement state.
- The UI makes directed passage behavior understandable enough to test.

### Step 7: Verification

- Add deterministic tests for entry-point generation and movement rules.
- Add Convex tests for `enterMaze`, run capacity, and movement rejection.
- Run the standard verification suite.

Exit criteria:

- `bun run lint` passes.
- `bun run typecheck` passes.
- `bun run test` passes.
- `bun run build` passes.

## 8) Post-MVP Roadmap

After MVP-1, resume the broader first-playable plan in this order:

1. Reconnect and active-run resume behavior.
2. Objective progression: signal fragments, nexus core, and final exit.
3. Itemization and splice-module graft-port progression.
4. Encounter spawning and enemy behavior.
5. Combat instance lifecycle and combat UI.
6. Phaser renderer and production asset pipeline.
7. Telemetry, moderation, and live-readiness hardening.

## 9) Risks And Mitigations

Risk:

- Deterministic drift between environments.

Mitigation:

- Centralize all authoritative RNG-driven decisions in Convex and verify them with seed and movement tests over `shared/game`.

Risk:

- Run creation or entry assignment races overfill a maze.

Mitigation:

- Keep capacity checks and run-member insertion in a single Convex mutation, and make repeated entry attempts idempotent for each player.

Risk:

- One-way semantics become ambiguous between entry points and normal macro-cell passages.

Mitigation:

- Model entry points explicitly and test them separately from normal generated connections.

Risk:

- Auth or profile scope expands before the movement proof is playable.

Mitigation:

- Keep Google as the only provider, keep lobby profile fields minimal, and defer account linking until after MVP-1.

## 10) Homepage And Entry Flow

Base URL behavior:

- `/` is a marketing-forward home page with game premise and a clear play funnel.
- Primary CTA routes authenticated users toward `/lobby`.
- Anonymous users are prompted to sign in before entering the lobby.

Navigation states:

- Anonymous: Home, Lore, How It Works, Sign In.
- Authenticated: Home, Lobby, Profile, Sign Out.

MVP-1 routing outline:

- `/` home and acquisition.
- `/lobby` party staging, profile setup, chat, and ready state.
- Character creation screen or route reached from ready state.
- `/run/:runId` active empty-maze exploration.
- `/profile` player identity and progression summary, after MVP-1 if it is not needed for the playtest.

## 11) Authentication And Character Strategy

Decision:

- Use OAuth and OpenID providers for authentication.
- Do not store passwords in project infrastructure.
- Ship with Google only for MVP-1.
- Evaluate Discord only after the first closed playtest.
- Do not add a third provider until usage data shows clear need.

Identity model:

- External providers authenticate the user.
- Convex validates provider identity and maps it to an internal player id.
- Gameplay tables reference the internal player id only.

Data to store in Convex:

- `players`: displayName, avatarUrl, createdAt, lastSeenAt.
- `identities`: playerId, provider, providerSubject, tokenIdentifier, email, linkedAt.
- `characters`: playerId, slotIndex, archetype or entrant profile, attributes, inventory placeholder, progression placeholder.
- `lobbyMembers`: lobby membership, ready state, and selected character when applicable.
- `runs`: active maze state and capacity.
- `runMembers`: active run participation, assigned entry point, and current macro-cell position.

Character attributes for MVP-1:

- All characters start with a base value of `1` in each attribute.
- At character creation, the Regime allows the entrant to choose one survival bias configuration, increasing exactly one attribute by `1`.
- Each character carries a standard cyber implant with four graft ports as story material.
- Graft ports exist in the fiction for MVP-1, but no splice modules are found, installed, removed, or reconfigured yet.
- `strength`, `perception`, `agility`, and `intelligence` are stored and displayed.
- Attribute bonuses may be described for flavor, but no combat, item, trap, or puzzle systems consume them in MVP-1.

Post-MVP character progression:

- Splice modules can be found in the Maze.
- Installing a splice module into a graft port increases one chosen attribute by `1`.
- Graft ports may all be committed to one attribute or split across multiple attributes in any combination.
- This creates a practical attribute maximum of `6`: base `1`, one survival bias bonus, and four installed splice modules.
- Installed splice modules occupy their graft ports, but no removal or reconfiguration mechanic is defined yet.

Account linking rules:

- Multi-provider linking is not required for MVP-1.
- If linking is added later, one player may connect multiple providers.
- Provider-specific identity remains isolated in `identities`, never in `players`.

Compliance and operational notes:

- Publish privacy policy and terms pages before launch.
- Request only minimal scopes such as `openid`, `profile`, and `email`.
- Implement safe sign-out and token expiry handling.
