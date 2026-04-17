# Death Maze 2044 Execution Checklist

Last updated: 2026-04-17
Owner: TBD

Purpose:

- Convert the MVP-1 plan into concrete tasks, file targets, and acceptance tests.

Reference:

- See [docs/implementation-plan.md](./implementation-plan.md) for architecture decisions and post-MVP scope.

## MVP-1 Definition

Goal:

- Ship the smallest playable multiplayer proof: lobby -> character creation -> empty maze exploration.

In scope:

- Authenticated lobby entry.
- Ready state routes players to character creation.
- Valid character creation with base attributes and one survival-bias bonus.
- `Unready` returns to lobby.
- `Enter Maze` is disabled until character creation is valid.
- First entrant creates a generated maze run when no active run has capacity.
- Up to 5 players can enter the same active maze.
- Each entrant is randomly assigned to one of 5 one-way entry points into a macro cell.
- Empty-maze movement proves one-way and two-way passage behavior.

Out of scope:

- Items, splice-module discovery, inventory progression, and graft-port reconfiguration.
- Enemies, encounters, combat, combat UI, rewards, and balancing.
- Nexus-core objective completion, signal fragments, final-exit victory, and run completion.
- Phaser production renderer, asset pipeline, telemetry, moderation, and reconnect hardening.

## Current Baseline

Foundation and logic already present:

- [x] `package.json` includes `dev`, `build`, `generate`, `preview`, `lint`, `typecheck`, and `test`.
- [x] Vitest configuration exists.
- [x] CI workflow runs install, lint, typecheck, test, and build.
- [x] Convex project scaffold exists.
- [x] Google identity and Convex player bootstrap exist.
- [x] Lobby profile setup exists.
- [x] Lobby chat, active members, typing indicator, and ready/unready state exist.
- [x] Shared deterministic RNG exists.
- [x] Shared world generation and validation exist.
- [x] Shared objective-state primitives exist.
- [x] Shared combat turn primitives exist, but are deferred for MVP-1.

Known stale docs to avoid:

- Older references to "Phase 0" being unimplemented are obsolete.
- Older first-playable references to combat are post-MVP for the current branch.

## Step 1: Planning Alignment

Goal:

- Align docs around the narrowed MVP-1.

Tasks:

- [x] Update implementation plan to define MVP-1 scope.
- [x] Update execution checklist to focus on character creation, run entry, and empty-maze movement.
- [x] Update resume handoff so future sessions start from the correct next task.
- [x] Update auth architecture so splice-module progression is post-MVP.

Suggested file targets:

- `docs/implementation-plan.md`
- `docs/execution-checklist.md`
- `docs/resume-handoff.md`
- `docs/auth-architecture.md`

Acceptance tests:

- [x] Docs describe `lobby -> character creation -> empty maze exploration`.
- [x] Combat, itemization, enemies, and graphics production are explicitly deferred.

## Step 2: Character Creation Contract

Goal:

- Let ready players create a valid MVP entrant before entering the maze.

Tasks:

- [x] Decide whether character creation is a dedicated route or an in-lobby screen state.
- [x] Route ready players from lobby to character creation.
- [x] Add `Unready` action that clears ready state and returns to lobby.
- [x] Add `Enter Maze` action that remains disabled until the character is valid.
- [x] Define the MVP character shape shared by frontend and Convex.
- [x] Implement survival-bias choices that increase exactly one attribute by `1`.
- [x] Display the implant and survival-bias story material.
- [x] Persist or update the current player's MVP character.
- [x] Attach the valid character to the lobby member or upcoming run entry flow.

Suggested file targets:

- `convex/schema.ts`
- `convex/characters.ts`
- `convex/lobbies.ts`
- `shared/game/characters/types.ts`
- `shared/game/characters/createCharacter.ts`
- `shared/game/__tests__/characters.test.ts`
- `app/pages/lobby.vue`
- `app/pages/character/create.vue` or `app/components/game/CharacterCreationPanel.vue`
- `app/composables/useGameSession.ts`

Acceptance tests:

- [x] Ready player reaches character creation.
- [x] Base attributes are `1`.
- [x] Exactly one survival-bias attribute becomes `2`.
- [x] Invalid attribute payloads are rejected server-side.
- [x] `Enter Maze` is unavailable until the local form is valid.
- [x] `Unready` returns to lobby and clears ready state.

## Step 3: Active Run Data Model

Goal:

- Represent empty maze runs and run membership in Convex.

Tasks:

- [x] Add `runs` table.
- [x] Add `runMembers` table.
- [x] Add indexes for active run lookup and player active membership lookup.
- [x] Cap runs at 5 active players.
- [x] Store the generated world seed needed to regenerate movement-validating topology.
- [x] Store exactly 5 entry points for each run.
- [x] Track each member's character id, entry index, and current macro-cell coordinate.
- [x] Decide how a run leaves the "open" state once the fifth player enters.

Suggested file targets:

- `convex/schema.ts`
- `convex/runs.ts`
- `shared/game/world/types.ts`
- `shared/game/world/generateEntryPoints.ts`
- `shared/game/__tests__/entry-points.test.ts`

Acceptance tests:

- [x] A run can be created with 5 entry points.
- [x] Entry points are one-way entrances into valid macro cells.
- [x] A run tracks 0 to 5 active members.
- [x] Player active-run lookup is efficient and indexed.

## Step 4: Enter Maze Mutation

Goal:

- Create or join an active run from a valid character-creation state.

Tasks:

- [x] Implement `enterMaze`.
- [x] Require an authenticated player.
- [x] Require a valid character.
- [x] Return an existing active run membership for the same player instead of creating duplicates.
- [x] Join an existing open run with fewer than 5 members when available.
- [x] Create a new generated run when no open run has capacity.
- [x] Randomly assign one unused entry point to the entering player.
- [x] Mark run full or otherwise stop accepting members once it reaches 5 players.
- [x] Return the destination `runId` to the client.
- [x] Navigate to `/run/:runId` after success.

Suggested file targets:

- `convex/runs.ts`
- `convex/characters.ts`
- `convex/lobbies.ts`
- `app/pages/character/create.vue` or `app/components/game/CharacterCreationPanel.vue`
- `app/composables/useGameSession.ts`

Acceptance tests:

- [x] First valid entrant creates a new run.
- [x] Entrants 2 through 5 join the same open run.
- [x] Sixth entrant does not overfill the run.
- [x] Repeated `Enter Maze` submissions by the same player return the same membership.
- [x] Each player receives a unique entry point within the run.

## Step 5: Authoritative Exploration Movement

Goal:

- Prove macro-cell movement through directed and bidirectional passages.

Status:

- Next implementation step.

Tasks:

- [ ] Add movement intent mutation.
- [ ] Add run view query with current player, party positions, current cell, and legal exits.
- [ ] Validate player belongs to the run.
- [ ] Validate movement starts from the player's current macro cell.
- [ ] Allow valid directed connection traversal.
- [ ] Reject reverse traversal through one-way macro-cell passages.
- [ ] Reject reverse traversal through one-way entry points.
- [ ] Update player position after valid movement.
- [ ] Keep movement state synchronized across clients.

Suggested file targets:

- `convex/exploration.ts`
- `convex/runs.ts`
- `shared/game/world/types.ts`
- `shared/game/world/getLegalMoves.ts`
- `shared/game/__tests__/movement.test.ts`
- `app/composables/useGameSession.ts`

Acceptance tests:

- [ ] Valid movement updates the player's macro-cell position.
- [ ] Movement from the wrong source cell is rejected.
- [ ] Reverse traversal through one-way passages is rejected.
- [ ] Two-way passages work both directions.
- [ ] Two clients can observe synchronized party positions.

## Step 6: Empty Maze Run UI

Goal:

- Give players a usable debug-grade exploration screen.

Tasks:

- [x] Add `/run/:runId` page.
- [x] Load run state from Convex.
- [x] Render current macro-cell coordinate.
- [x] Render party positions.
- [ ] Render available exits from the current cell.
- [ ] Make one-way and two-way exits visually distinct.
- [ ] Add movement controls that call the authoritative movement mutation.
- [ ] Show server-side movement errors in the UI.
- [x] Avoid combat, inventory, objective, and enemy panels for MVP-1.

Suggested file targets:

- `app/pages/run/[runId].vue`
- `app/components/game/ExplorationViewport.vue`
- `app/components/game/PartyStatePanel.vue`
- `app/composables/useGameSession.ts`
- `app/stores/gameSession.ts`

Acceptance tests:

- [x] Player can load `/run/:runId` after entering the maze.
- [ ] Player can move through legal exits.
- [ ] Illegal movement reports a readable error.
- [ ] One-way and two-way exits are understandable at a glance.
- [ ] Party movement updates are visible without a page reload.

## Step 7: Verification And Release Gate

Goal:

- Prove MVP-1 works locally before merging.

Tasks:

- [x] Add shared-game tests for character creation.
- [x] Add shared-game tests for entry-point generation.
- [ ] Add shared-game tests for movement legality.
- [ ] Add Convex tests for character creation if test harness supports it in this pass.
- [ ] Add Convex tests for `enterMaze` and run capacity if test harness supports it in this pass.
- [ ] Add manual two-client smoke test notes.
- [x] Update docs for any architecture changes made during implementation.

Commands:

- [x] `bun run lint`
- [x] `bun run typecheck`
- [x] `bun run test`
- [x] `bun run build`

Latest verification snapshot:

- 2026-04-17: all four commands passed after Step 4. Re-run after movement lands.

Acceptance tests:

- [ ] Authenticated user can ready up and reach character creation.
- [ ] Valid character can enter the maze.
- [ ] First entrant creates a run.
- [ ] Up to 5 entrants can share the same run.
- [ ] Movement through an empty maze works.
- [ ] One-way and two-way passage behavior is verified.

## Deferred Backlog

Do not pull these into MVP-1 unless the MVP is already complete:

- [ ] Reconnect and session resume handling.
- [ ] Nexus-core objective progression.
- [ ] Signal fragments and final-exit completion.
- [ ] Itemization and splice-module progression.
- [ ] Encounter spawning.
- [ ] Enemy AI.
- [ ] Combat lifecycle and combat UI.
- [ ] Phaser production renderer.
- [ ] Sprite atlas manifest and asset pipeline.
- [ ] Telemetry and diagnostics.
- [ ] Moderation and abuse safeguards.
- [ ] Additional auth providers.

## Cross-Phase Definition Of Done

- [ ] `bun run lint` passes.
- [ ] `bun run typecheck` passes.
- [ ] `bun run test` passes.
- [ ] `bun run build` passes.
- [ ] No unresolved TypeScript errors remain in touched files.
- [ ] Updated docs reflect any changed architecture or public behavior.
- [ ] New logic paths include deterministic or integration tests.
