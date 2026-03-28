# Resume Handoff

Last updated: 2026-03-27

## Current State

- Strategic architecture and phased plan are documented.
- Phaser remains the selected primary graphics path, with a fallback tactical renderer for debugging and low-end support.
- OAuth-only identity strategy is selected, with Google as the only required provider for the first playable milestone.
- No Convex scaffolding or gameplay code has been implemented in this repo yet.
- The app shell still uses starter branding and should be replaced early.

## Key Planning Docs

- [docs/implementation-plan.md](./implementation-plan.md)
- [docs/execution-checklist.md](./execution-checklist.md)
- [docs/auth-architecture.md](./auth-architecture.md)
- [docs/homepage-ia.md](./homepage-ia.md)
- [docs/legacy-port-notes.md](./legacy-port-notes.md)

## Recommended First Coding Session

1. Install dependencies and add `lint`, `typecheck`, `test`, and `build` scripts.
2. Add Vitest and a minimal CI workflow so verification exists before feature work.
3. Scaffold Convex plus initial `players` and `identities` schema files.
4. Implement Google auth wiring end-to-end.
5. Create `shared/game` domain type and deterministic utility placeholders.
6. Replace the starter home page and default layout shell with Death Maze branding.

## Session Re-entry Prompt

Use this prompt on return:

"Continue Death Maze 2044 from docs/execution-checklist.md. Start with Phase 0: add scripts and CI, scaffold Convex, wire Google auth, create shared/game domain types, and replace the starter home page shell."

## Exit Criteria For Next Work Block

- Local dev starts with no blocking type errors.
- `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` pass.
- Google sign-in path is wired end-to-end.
- Home page and default layout no longer use starter branding.
- Baseline Convex schema files are committed.
