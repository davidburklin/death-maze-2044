# Resume Handoff

Last updated: 2026-04-17

## Current State

- Current branch target: `feature/chasing-mvp-1`.
- MVP-1 is scoped to `lobby -> character creation -> empty maze exploration`.
- Nuxt, Convex, Google auth, lobby profile setup, lobby chat, member presence, and ready/unready state are already present.
- Ready players route to `/character/create`.
- MVP character creation is present, including survival-bias validation, implant story material, `Unready`, and disabled-until-valid `Enter Maze`.
- Convex can save the current MVP character and attach it to the waiting lobby member.
- Active run state is modeled in Convex with `runs` and `runMembers`.
- Runs store a generated world seed, capacity status, member count, and exactly five one-way entry points.
- `enterMaze` creates or joins an open run, caps runs at 5 players, assigns one unused entry point, and returns the destination run.
- `/run/:runId` can load the current run, show the player's entry point and coordinate, list all entry points, and show party positions.
- Shared deterministic RNG, world generation, world validation, objective-state primitives, and combat turn primitives are already present.
- Combat primitives remain available, but combat is deferred until after MVP-1.
- Itemization, enemies, objectives, Phaser production rendering, telemetry, and reconnect polish are deferred.

## Key Planning Docs

- [docs/implementation-plan.md](./implementation-plan.md)
- [docs/execution-checklist.md](./execution-checklist.md)
- [docs/auth-architecture.md](./auth-architecture.md)
- [docs/homepage-ia.md](./homepage-ia.md)
- [docs/legacy-port-notes.md](./legacy-port-notes.md)

## Recommended Next Coding Session

Start with Step 5 in [docs/execution-checklist.md](./execution-checklist.md):

1. Add authoritative movement rules for run members.
2. Add legal-exit calculation from the player's current macro cell.
3. Reject reverse traversal through one-way entry points and directed macro-cell passages.
4. Update the `/run/:runId` page with exits and movement controls.
5. Add movement tests for one-way and two-way passage behavior.

## Session Re-entry Prompt

Use this prompt on return:

"Continue Death Maze 2044 from docs/execution-checklist.md on branch feature/chasing-mvp-1. Steps 2 through 4 are complete, and `/run/:runId` has a run-state landing page. Start with Step 5: authoritative empty-maze movement, then finish the run UI movement controls."

## Exit Criteria For Next Work Block

- Legal exits are derived server-side from the generated run world and the player's current position.
- Valid movement updates the player's current macro-cell coordinate.
- Reverse traversal through one-way entry points and one-way macro-cell passages is rejected.
- Two-way passages can be traversed in both directions.
- `/run/:runId` exposes movement controls and readable server-side movement errors.
- New movement logic has deterministic tests where practical.
- `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` remain the release gate.
