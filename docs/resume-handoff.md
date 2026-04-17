# Resume Handoff

Last updated: 2026-04-16

## Current State

- Current branch target: `feature/chasing-mvp-1`.
- MVP-1 is scoped to `lobby -> character creation -> empty maze exploration`.
- Nuxt, Convex, Google auth, lobby profile setup, lobby chat, member presence, and ready/unready state are already present.
- Ready players route to `/character/create`.
- MVP character creation is present, including survival-bias validation, implant story material, `Unready`, and disabled-until-valid `Enter Maze`.
- Convex can save the current MVP character and attach it to the waiting lobby member.
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

Start with Step 3 in [docs/execution-checklist.md](./execution-checklist.md):

1. Add `runs` and `runMembers` tables.
2. Add indexes for open-run lookup and player active-run lookup.
3. Cap active runs at 5 players.
4. Store generated world seed/topology data needed for movement validation.
5. Define exactly 5 one-way entry points per run.
6. Track each run member's character, entry point, and current macro-cell coordinate.

## Session Re-entry Prompt

Use this prompt on return:

"Continue Death Maze 2044 from docs/execution-checklist.md on branch feature/chasing-mvp-1. Step 2 is complete; start with Step 3: active run data model for MVP-1, then proceed toward enterMaze and empty-maze movement."

## Exit Criteria For Next Work Block

- Convex schema supports active empty-maze runs.
- Each run has exactly 5 one-way entry points.
- A run can track 0 to 5 active members.
- Player active-run lookup is indexed.
- Any new run/entry-point logic has deterministic tests where practical.
- `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` remain the release gate.
