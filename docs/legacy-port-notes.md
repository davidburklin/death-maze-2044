# Legacy Port Notes

Last updated: 2026-03-28

## Purpose

Capture behavior contracts from the external legacy game repo in a portable way that can live inside this repository.

Rule:
- The external repo is reference material only.
- Once a subsystem has local tests in this repo, those tests become the normative source of truth.

For each subsystem record:
- Input and output shapes
- Deterministic seed expectations
- Important invariants and failure cases
- Renamed 2044 terminology
- Any intentional deviations from legacy behavior

## Port Workflow

1. Inspect the legacy subsystem in the external repo.
2. Summarize behavior here in plain language.
3. Add deterministic tests under `shared/game/__tests__`.
4. Port the implementation into `shared/game`.
5. Note any deviations before merging.

## Terminology Renames Applied

| Legacy Term | 2044 Term |
|---|---|
| relic | nexusCore |
| RelicDefinition | NexusCoreDefinition |
| relicId | nexusCoreId |
| relicCell | nexusCoreCell |
| clue / clueCount | signalFragment / signalFragmentCount |
| clueCountRequired | signalFragmentsRequired |
| mastery-only | override-only |
| mastery-and-final-exit | override-and-final-exit |
| masteryOnlyChance | overrideOnlyChance |
| puzzle (gate) | networkLock |
| manipulation (gate) | sequenceGate |
| keyed (gate) | credentialGate |

## Subsystems

### RNG

Status:
- Ported to `shared/game/random.ts`.

Contract notes:
- Seeded PRNG using bitwise mixing (variant of splitmix32).
- `createRng(seed)` returns `{ next, int, bool, pick }`.
- `int(min, max)` is inclusive on both ends.
- `bool(probability)` returns true when `next() < probability`.
- `pick(values)` selects uniformly from a non-empty array.
- Throws on invalid inputs: empty array, probability outside [0,1], min > max.

Deviations:
- None. Byte-identical behavior to legacy.

### World Generation

Status:
- Ported to `shared/game/world/generateWorld.ts`.

Contract notes:
- Input: `{ seed, gatedExitChance?, oneWayDoorChance?, overrideOnlyChance? }`.
- Output: `WorldGraph` with 25x25 macro cells, connections, nexus core definition, and objective cells.
- Cells created with isolated RNG stream (`seed ^ 0x9e3779b9`).
- Base connections via randomized spanning tree (`seed ^ 0xa341316c`) plus 12% extra bidirectional links.
- One-way doors applied pairwise, only if removing the reverse edge preserves minimum inbound/outbound of 1.
- Nexus core placed at farthest reachable cell from start. Final exit placed at farthest reachable from nexus core when contract is `override-and-final-exit`.
- Same seed always produces identical topology, gate types, and objective layout.

Deviations:
- Fantasy relic names replaced with sci-fi nexus core names.
- All type and field names use 2044 terminology (see rename table above).

### World Validation

Status:
- Ported to `shared/game/world/validateWorld.ts`.

Contract notes:
- Returns `string[]` of issues; empty array means valid.
- Checks: grid dimensions, cell count, room count range (2-5), inbound/outbound minimums, directed path start→nexusCore, directed path nexusCore→finalExit for `override-and-final-exit` contracts.
- `hasRunCompleted(world, progress)` checks nexus core override conditions plus contract-specific final exit requirement.

Deviations:
- Error messages use 2044 terminology ("nexus core" instead of "relic").

### Objective State

Status:
- Ported to `shared/game/simulation/objectiveState.ts`.

Contract notes:
- Pure functional state transitions: `createObjectiveState`, `applySignalFragmentFound`, `applyNexusCoreFound`, `applyFinalExitReached`, `evaluateObjective`.
- `evaluateObjective` recomputes `nexusCoreUsable` and `completed` from current progress against world requirements.
- All functions return new state objects (immutable pattern).

Deviations:
- Renamed from `applyClueFound`/`applyRelicFound` to `applySignalFragmentFound`/`applyNexusCoreFound`.
- `relicUsable` → `nexusCoreUsable`.

### Combat Initiative And Round Advancement

Status:
- Ported to `shared/game/combat/stepCombatTurn.ts`.

Contract notes:
- `enterCombat(combatants)` sorts by initiative descending, returns initial `CombatState`.
- `advanceTurn(state)` increments `turnIndex` modulo `turnOrder.length`.
- `applyDamage(state, targetId, damage)` reduces HP (floored at 0), removes dead combatants from turn order, ends combat when ≤1 alive.
- Negative damage is clamped to 0 (no healing via damage).
- Damage to unknown target returns state unchanged.
- `active` is false when 0 or 1 combatants remain alive.

Deviations:
- **Bug fix**: Legacy `turnIndex` calculation after death used `state.turnIndex % aliveOrder.length`, which could skip or repeat turns when combatants before the current index died. Fixed to track the current combatant's identity through the filter and recompute index based on position in the surviving order. New tests cover: death before current index, death of current combatant, death after current index.
