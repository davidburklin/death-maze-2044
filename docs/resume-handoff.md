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
- `enterMaze` does not wait for a minimum party size; a solo entrant creates and enters a run immediately.
- `/run/:runId` can load the current run, show the player's entry point and coordinate, list all entry points, show party positions, render legal exits, and move through server-approved passages.
- Convex validates movement against the regenerated run world, rejects stale source cells, rejects reverse traversal through one-way passages, and rejects reverse traversal through one-way entry doors.
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

Start with Step 7 in [docs/execution-checklist.md](./execution-checklist.md):

1. Run a manual one-client smoke test for `ready -> character creation -> enter maze -> move`.
2. Run a manual two-client smoke test that confirms both clients can join the same open run before it fills.
3. Confirm party positions refresh without a page reload.
4. Record any smoke-test notes or release caveats in the checklist.
5. Decide whether an optional airlock or wait screen is needed before merging, without adding a minimum party-size gate.

## Session Re-entry Prompt

Use this prompt on return:

"Continue Death Maze 2044 from docs/execution-checklist.md on branch feature/chasing-mvp-1. Steps 2 through 6 are complete for the MVP movement proof. Start with Step 7: manual one-client and two-client smoke verification, then decide whether optional airlock/wait-screen polish is needed without adding a minimum party-size gate."

## Exit Criteria For Next Work Block

- Manual smoke notes cover solo entry without waiting for additional players.
- Manual smoke notes cover two clients joining the same open run before capacity is reached.
- Manual smoke notes cover movement through legal exits and visible party-position refresh.
- Any release-blocking issues found during smoke testing are either fixed or captured in the checklist.
- `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` remain the release gate.
