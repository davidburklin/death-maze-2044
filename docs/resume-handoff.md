# Resume Handoff

Last updated: 2026-04-16

## Current State

- Current branch target: `feature/chasing-mvp-1`.
- MVP-1 is scoped to `lobby -> character creation -> empty maze exploration`.
- Nuxt, Convex, Google auth, lobby profile setup, lobby chat, member presence, and ready/unready state are already present.
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

Start with Step 2 in [docs/execution-checklist.md](./execution-checklist.md):

1. Define the MVP character-creation contract.
2. Add a character creation screen or route reached after readying up.
3. Implement survival-bias validation: base `1` in every attribute, plus `1` to exactly one chosen attribute.
4. Add `Unready` to return to lobby and clear ready state.
5. Add disabled-until-valid `Enter Maze`.
6. Add Convex character mutation/query support.

## Session Re-entry Prompt

Use this prompt on return:

"Continue Death Maze 2044 from docs/execution-checklist.md on branch feature/chasing-mvp-1. Start with Step 2: character creation contract for MVP-1, then proceed toward enterMaze and empty-maze movement."

## Exit Criteria For Next Work Block

- Ready players can reach character creation.
- Character creation validates the MVP attribute rules.
- `Unready` returns to lobby and clears ready state.
- `Enter Maze` is present but only enabled for a valid character.
- Any new character logic has deterministic tests where practical.
- `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` remain the release gate.
