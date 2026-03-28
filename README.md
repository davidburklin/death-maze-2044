# Death Maze 2044

Death Maze 2044 is a multiplayer sci-fi survival game prototype built with Nuxt 4, Vue 3, TypeScript, Pinia, and Convex. Players explore the maze in real time, drop into initiative-driven combat, and try to survive long enough to escape.

## Current Status

The repo is still in the planning and scaffolding stage.

- Architecture, auth, and execution docs are in place.
- Gameplay systems and Convex integration have not been implemented yet.
- The current app shell still contains starter content and will be replaced in Phase 0.

## Key Docs

- [Implementation plan](./docs/implementation-plan.md)
- [Execution checklist](./docs/execution-checklist.md)
- [Authentication architecture](./docs/auth-architecture.md)
- [Homepage IA](./docs/homepage-ia.md)
- [Legacy port notes](./docs/legacy-port-notes.md)
- [Resume handoff](./docs/resume-handoff.md)

## Planned Architecture

- Nuxt 4 handles the client and page shell.
- Convex is the authoritative source of game state and real-time sync.
- Shared deterministic game rules live outside `app/` under `shared/game`.
- Google OAuth is the only required auth provider for the first playable milestone.

## Setup

Install dependencies:

```bash
bun install
```

Start the development server on `http://localhost:3000`:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

## Notes

- Additional scripts for linting, type checking, and testing are planned as part of Phase 0.
- Keep secrets out of the repo; use `.env.example` for placeholders only.
