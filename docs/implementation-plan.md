# Death Maze 2044 Implementation Plan

Last updated: 2026-03-27

## 1) Legacy Behavior To Port

Legacy gameplay behavior exists in an external repo that is not part of this workspace.

Porting rules:
- Do not rely on local absolute file links in planning docs.
- Before porting a subsystem, capture its expected inputs, outputs, invariants, and renamed terminology in this repo.
- Once local contract tests exist, those tests become the normative reference for future refactors.
- Record intentional deviations in [docs/legacy-port-notes.md](./legacy-port-notes.md).

Initial subsystems to port by behavior:
- World generation and topology
- Deterministic RNG helpers
- World validity and run-complete checks
- Objective progression state updates
- Combat initiative ordering and round advancement primitives

Build new in this repo:
- Encounter spawning
- Enemy AI behaviors
- Itemization and status effects
- Multiplayer session orchestration and anti-cheat validation
- Graphics and rendering pipeline

## 2) Genre Migration Rules

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

## 3) Target Runtime Architecture

Primary stack:
- Nuxt 4 + Vue 3 + TypeScript for the client
- Pinia for client orchestration only
- Convex for authoritative game state and real-time sync
- Vercel for frontend deployment

Code placement:
- Shared deterministic domain rules live in `shared/game/*`.
- Convex imports and executes those shared rules for authoritative outcomes.
- The Nuxt client may import shared modules only for rendering support, previews, and debug views.
- Domain types belong in `shared/game/types.ts`; app-local view models stay under `app/` only when they are UI-specific.

Authoritative boundary:
- All game-truth mutations run in Convex.
- Client sends intents only such as move, interact, and combat action.
- Client never resolves combat outcomes locally.
- Client never commits authoritative state transitions from shared helpers.

Hybrid loop:
- Real-time party exploration for up to 5 players
- Encounter trigger creates a combat instance
- Initiative rounds execute only inside that combat instance
- On resolution, players return to exploration state

## 4) Graphics Delivery Decision

### Option A: SVG/DOM Tactical View

Pros:
- Fastest to ship
- Smallest payload
- Easiest debugging

Cons:
- Limited visual depth
- Less game feel

### Option B: Canvas 2D + Phaser 3 (Recommended)

Pros:
- Strong performance
- Good visual expression
- Practical production cost

Cons:
- Moderate complexity
- Requires sprite pipeline discipline

### Option C: WebGL/Three.js

Pros:
- Highest visual ceiling

Cons:
- Largest scope and asset burden
- Higher mobile risk

Decision for first playable milestone:
- Choose Option B as the default rendering path.
- Keep a low-fidelity Option A fallback layer for debug mode and low-end devices.

Asset delivery approach:
- Versioned sprite atlases and UI icon sheets in static hosting
- Hashed file names for cache busting
- CDN caching headers with immutable assets
- Asset manifest file mapping logical ids to versioned URLs

## 5) Phased Execution

### Phase 0: Foundations (1 week)

- Install project dependencies and verify the starter app boots locally.
- Add baseline developer scripts: `lint`, `typecheck`, `test`, and `build`.
- Add Vitest and a minimal CI workflow so the checklist is executable from day one.
- Add Convex to this repo and wire local and preview environments.
- Implement Google OAuth as the only required provider for the first playable milestone.
- Create initial shared domain types and deterministic utility placeholders in `shared/game`.
- Replace starter branding on `/` and the default layout with a Death Maze shell.

Exit criteria:
- Local Nuxt and Convex run end-to-end.
- `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` all pass.
- Google sign-in works in local and preview.
- Type-safe shared domain models compile.

### Phase 1: Logic Port (1-2 weeks)

- Port world generation, validation, and objective logic into `shared/game`.
- Port initiative ordering and round advancement primitives into `shared/game`.
- Add deterministic snapshot tests for fixed seeds.
- Document any intentional deviations from legacy behavior in [docs/legacy-port-notes.md](./legacy-port-notes.md).

Exit criteria:
- Same seed produces reproducible world outputs.
- Combat turn queue is deterministic under fixed inputs.
- Local contract tests cover the first ported subsystems.

### Phase 2: Multiplayer Core (1-2 weeks)

- Implement Convex tables and indexes for identities, players, lobbies, runs, actors, combat instances, and action logs.
- Implement mutations for create lobby, join lobby, ready up, start run, move, interact, enter combat, submit action, and resolve round.
- Add subscription queries for live room and combat state.
- Keep all legality checks and authoritative resolution in Convex.

Exit criteria:
- 2 to 5 clients can join and stay synchronized.
- Illegal actions are rejected server-side.
- Duplicate submissions are idempotent.

### Phase 3: First Playable UI (1-2 weeks)

- Replace the starter page with a marketing-forward home page and auth-aware CTA.
- Implement lobby flow, exploration viewport, and party state panels.
- Implement combat panel with initiative ladder, action selection, and combat log.
- Connect UI to Convex queries and mutations through composables and Pinia.

Exit criteria:
- Full loop: lobby -> explore -> combat -> explore.
- Home page and global layout no longer use starter branding.

### Phase 4: Graphics Production Pass (1-2 weeks)

- Integrate Phaser renderer and sprite atlas pipeline.
- Add movement interpolation, impact feedback, health overlays, and status overlays.
- Add fallback debug renderer.

Exit criteria:
- Stable frame pacing on desktop.
- Acceptable mobile performance.

### Phase 5: Balancing and Hardening (ongoing)

- Add encounter tables, enemy kits, and status effects.
- Add reconnect and resume support.
- Add telemetry and balancing hooks.
- Revisit additional auth providers only after first playtest metrics justify the added scope.

Exit criteria:
- Stable multiplayer sessions with recoverable disconnects.
- Session health and failure telemetry are visible.

## 6) Immediate Next Actions

1. Install dependencies and add `lint`, `typecheck`, `test`, and `build` scripts.
2. Add Vitest plus a minimal CI workflow.
3. Scaffold Convex in this repo and establish schema skeletons for `players` and `identities`.
4. Implement Google auth wiring end-to-end.
5. Create `shared/game/types.ts` and deterministic utility placeholders.
6. Replace the starter home page and header shell with Death Maze branding.

## 7) Risks And Mitigations

Risk:
- Deterministic drift between environments.

Mitigation:
- Centralize all authoritative RNG-driven decisions in Convex and verify them with seed snapshot tests over `shared/game`.

Risk:
- Combat latency or race conditions in multiplayer.

Mitigation:
- Enforce strict turn ownership checks and idempotent action mutation contracts.

Risk:
- Art pipeline slows feature delivery.

Mitigation:
- Ship grayscale placeholder atlases first, then replace them via manifest versioning.

Risk:
- Auth scope expands before the core loop is playable.

Mitigation:
- Ship Google first, defer secondary providers until after initial playtests, and keep account linking out of the critical path.

## 8) Homepage And Entry Flow

Base URL behavior:
- `/` is a marketing-forward home page with hero art, game premise, and a clear play funnel.
- Primary CTA is `Start Run` if authenticated or `Sign In to Enter the Maze` if anonymous.
- Secondary CTA is `How It Works`.

Hero treatment:
- Reuse the current hero image from the README for launch iteration.
- Add subtle animated overlays such as scanlines, dust, and warning-tape accents.
- Keep the route lightweight for LCP by preloading only the critical hero asset.

Navigation states:
- Anonymous: Home, Lore, How It Works, Sign In
- Authenticated: Home, Lobby, Profile, Sign Out

Routing outline:
- `/` home and acquisition
- `/lobby` party create, join, and ready state
- `/run/:runId` active game session for exploration and combat
- `/profile` player identity, character slots, and progression summary

## 9) Authentication Strategy

Decision:
- Use OAuth and OpenID providers for authentication.
- Do not store passwords in project infrastructure.
- Ship with Google only for the first playable milestone.
- Evaluate Discord only after the first closed playtest.
- Do not add a third provider until usage data shows clear need.

Identity model:
- External providers authenticate the user.
- Convex validates provider identity and maps it to an internal player id.
- Gameplay tables reference the internal player id only.

Data to store in Convex:
- `players`: displayName, avatarUrl, createdAt, lastSeenAt
- `identities`: playerId, provider, providerSubject, email, linkedAt
- `characters`: playerId, slotIndex, archetype, stats, inventory, progression
- `sessions`: lobby membership and active run participation

Account linking rules:
- Multi-provider linking is not required for the first playable milestone.
- If linking is added later, one player may connect multiple providers.
- Provider-specific identity remains isolated in `identities`, never in `players`.

Compliance and operational notes:
- Publish privacy policy and terms pages before launch.
- Request only minimal scopes such as `openid`, `profile`, and `email`.
- Implement safe sign-out and token expiry handling.
