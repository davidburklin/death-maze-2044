# Death Maze 2044 Execution Checklist

Last updated: 2026-03-27
Owner: TBD

Purpose:
- Convert the strategic plan into an execution checklist with concrete tasks, file targets, and acceptance tests.

Reference:
- See [docs/implementation-plan.md](./implementation-plan.md) for architecture decisions.

## Phase 0: Foundation Setup

Goal:
- Stand up runtime foundations for Convex, Google auth, shared game modules, and baseline verification tooling.

Tasks:
- [ ] Install project dependencies and confirm the starter app runs locally.
- [ ] Add `lint`, `typecheck`, `test`, and `build` scripts to `package.json`.
- [ ] Add Vitest configuration and a minimal test harness for shared modules.
- [ ] Add CI workflow to run install, lint, typecheck, test, and build.
- [ ] Add Convex dependencies and initialize Convex project files.
- [ ] Configure local and Vercel environment variables for Convex and Google auth.
- [ ] Add initial domain model files for world, player, session, and combat under `shared/game`.
- [ ] Add auth integration shell for Google sign-in.
- [ ] Replace starter branding on `/` and in the default layout.
- [ ] Add project docs for environment setup and local bootstrap.

Suggested file targets:
- `package.json`
- `vitest.config.ts`
- `.github/workflows/ci.yml`
- `convex/schema.ts`
- `convex/players.ts`
- `convex/identities.ts`
- `convex/lobbies.ts`
- `convex/combat.ts`
- `shared/game/types.ts`
- `shared/game/random.ts`
- `app/composables/useAuth.ts`
- `.env.example`
- `README.md`
- `app/pages/index.vue`
- `app/layouts/default.vue`

Acceptance tests:
- [ ] `bun install` succeeds.
- [ ] `bun run dev` starts Nuxt successfully.
- [ ] Convex local dev process can start and connect.
- [ ] Google sign-in works in local dev.
- [ ] `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` all pass.
- [ ] Starter branding is removed from the home page shell.

## Phase 1: Deterministic Logic Port

Goal:
- Port legacy deterministic world logic without behavior drift.

Tasks:
- [ ] Port RNG utility and seed-based helpers into `shared/game`.
- [ ] Port world generation logic and rename fantasy terms to 2044 terminology.
- [ ] Port world validation and objective completion logic.
- [ ] Add deterministic snapshot tests for fixed seeds.
- [ ] Create or update `docs/legacy-port-notes.md` with subsystem contracts and intentional deviations.

Suggested file targets:
- `shared/game/random.ts`
- `shared/game/world/generateWorld.ts`
- `shared/game/world/validateWorld.ts`
- `shared/game/objective/objectiveState.ts`
- `shared/game/__tests__/world-seeds.test.ts`
- `docs/legacy-port-notes.md`

Acceptance tests:
- [ ] Same seed always generates identical topology and objective data.
- [ ] Validation rejects malformed worlds.
- [ ] Objective completion logic matches expected contract behavior.
- [ ] Local contract notes exist for each ported subsystem.

## Phase 2: Multiplayer Core In Convex

Goal:
- Implement authoritative multiplayer state and action resolution.

Tasks:
- [ ] Define Convex tables and indexes for players, identities, lobbies, runs, combats, and action logs.
- [ ] Implement lobby lifecycle mutations.
- [ ] Implement run lifecycle mutations.
- [ ] Implement exploration action mutations with legality checks.
- [ ] Implement combat instance and turn action mutations.
- [ ] Implement subscription queries for lobby, run, and combat real-time views.
- [ ] Keep all authoritative legality and outcome resolution inside Convex.

Suggested file targets:
- `convex/schema.ts`
- `convex/identities.ts`
- `convex/lobbies.ts`
- `convex/runs.ts`
- `convex/exploration.ts`
- `convex/combat.ts`
- `convex/queries.ts`
- `shared/game/combat/resolveRound.ts`

Acceptance tests:
- [ ] 2 to 5 clients can join one lobby and observe synchronized state updates.
- [ ] Out-of-turn combat actions are rejected.
- [ ] Invalid movement intents are rejected.
- [ ] Repeated duplicate action submissions are idempotent.

## Phase 3: First Playable Frontend

Goal:
- Deliver full user flow from home page to playable run.

Tasks:
- [ ] Replace starter index content with a marketing-first home page.
- [ ] Add auth-aware CTA behavior.
- [ ] Build lobby screen for create, join, and ready state.
- [ ] Build active run page with exploration viewport and party state panels.
- [ ] Build combat overlay with initiative, actions, and combat log.
- [ ] Connect UI to Convex queries and mutations through composables and Pinia.

Suggested file targets:
- `app/pages/index.vue`
- `app/pages/lobby.vue`
- `app/pages/run/[runId].vue`
- `app/pages/profile.vue`
- `app/components/marketing/HomeHero.vue`
- `app/components/marketing/CoreLoopCards.vue`
- `app/components/marketing/HowItWorks.vue`
- `app/components/marketing/HomeFooterLinks.vue`
- `app/components/game/ExplorationViewport.vue`
- `app/components/game/CombatPanel.vue`
- `app/stores/gameSession.ts`
- `app/composables/useGameSession.ts`

Acceptance tests:
- [ ] Anonymous user sees home page and sign-in CTA.
- [ ] Authenticated user can create or join lobby.
- [ ] Session transitions: lobby -> run -> combat -> exploration.
- [ ] UI updates are live across multiple clients.

## Phase 4: Graphics And Asset Pipeline

Goal:
- Implement Phaser renderer and production-ready asset delivery path.

Tasks:
- [ ] Integrate Phaser runtime into exploration and combat views.
- [ ] Build sprite atlas manifest and loader.
- [ ] Add interpolation and feedback effects for movement, hits, and status changes.
- [ ] Implement fallback tactical renderer mode for debugging and low-end support.
- [ ] Add performance budgets and measure frame pacing.

Suggested file targets:
- `app/components/game/PhaserViewport.vue`
- `app/composables/usePhaserGame.ts`
- `app/utils/assets/manifest.ts`
- `public/assets/manifest.json`
- `app/components/game/FallbackTacticalView.vue`

Acceptance tests:
- [ ] Stable rendering under expected client load.
- [ ] Asset version updates invalidate cache correctly.
- [ ] Fallback view can be toggled and remains functional.

## Phase 5: Hardening And Live Readiness

Goal:
- Improve reliability, balance, and operational visibility.

Tasks:
- [ ] Add reconnect and session resume handling.
- [ ] Add telemetry and diagnostics for state transition failures.
- [ ] Tune encounter rates, enemy balance, and rewards.
- [ ] Add moderation and abuse safeguards for lobby and player interactions.
- [ ] Decide whether a second auth provider is justified after playtest metrics.
- [ ] Write release checklist and rollback playbook.

Suggested file targets:
- `convex/telemetry.ts`
- `app/composables/useReconnect.ts`
- `docs/release-checklist.md`
- `docs/incident-playbook.md`

Acceptance tests:
- [ ] Mid-session disconnect and reconnect restores state correctly.
- [ ] Core metrics are visible for session health.
- [ ] First live playtest completes without critical desync.

## Cross-Phase Definition Of Done

- [ ] `bun run lint` passes.
- [ ] `bun run typecheck` passes.
- [ ] `bun run test` passes.
- [ ] `bun run build` passes.
- [ ] No unresolved TypeScript errors remain in touched files.
- [ ] Updated docs reflect any changed architecture or public behavior.
- [ ] New logic paths include deterministic or integration tests.
