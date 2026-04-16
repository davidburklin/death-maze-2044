# Authentication Architecture

Last updated: 2026-03-27
Status: Approved for implementation

## Decision

Use external OAuth and OpenID providers for authentication and do not maintain local password accounts.

Provider rollout:
1. Google is required for Phase 0 and the first playable milestone.
2. Discord is the only secondary provider under consideration after the first closed playtest.
3. No third provider is planned before usage data justifies the added scope.

## Why This Decision

- Reduces security burden of password storage and reset workflows.
- Improves conversion with familiar sign-in providers.
- Keeps engineering focus on game systems, not account infrastructure.
- Prevents auth scope from expanding before the core multiplayer loop is playable.

## Identity Model

Principle:
- Identity is external; game state is internal.

Flow:
1. User authenticates with Google.
2. Provider returns an identity token.
3. Convex validates token claims and maps provider subject to an internal player id.
4. Gameplay tables reference the internal player id only.

Never store:
- Raw passwords
- Long-lived provider access tokens in gameplay records
- Provider subjects in the `players` table

## Data Model

`players`
- `_id`
- `displayName`
- `avatarUrl`
- `createdAt`
- `lastSeenAt`

`identities`
- `_id`
- `playerId`
- `provider` (`google`, later `discord` if enabled)
- `providerSubject`
- `email` (optional)
- `linkedAt`

`characters`
- `_id`
- `playerId`
- `slotIndex`
- `archetype`
- `attributes`
	- Base value: all attributes start at `1`
	- Creation rule: the Regime allows the entrant to choose one survival bias configuration, increasing one attribute by `1` during character creation
	- Implant rule: each character carries a standard cyber implant with four graft ports
	- Upgrade rule: each splice module found in the Maze raises one chosen attribute by `1` when installed into a graft port
	- Allocation rule: graft ports may all feed one attribute or be mixed across attributes in any combination
	- Practical maximum: `6` in a single attribute from base `1`, one survival bias bonus, and four installed splice modules
	- Persistence rule: installed splice modules occupy their graft ports, but the design does not treat them as permanently locked; no removal or reconfiguration mechanic is defined for the first playable
	- `strength`: each point above base `1` adds `10%` to the weapon's base melee damage
	- `perception`: each point above base `1` adds `10%` to the chance to spot items, traps, and other points of interest
	- `agility`: each point above base `1` adds `10%` dodge chance and `5%` damage reduction against incoming attacks
	- `intelligence`: each point above base `1` adds `10%` to reasoning-heavy puzzle checks
	- Scaling rule: bonuses stack linearly above base `1` until all four graft ports are filled
- `inventory`
- `progression`

Constraints:
- Unique index on (`provider`, `providerSubject`)
- Unique index on (`playerId`, `slotIndex`)

## Account Linking Strategy

- Account linking is not required for the first playable milestone.
- If a second provider is added later, one internal player may link multiple providers.
- Linking must require an already authenticated session on the target player account.
- Provider-specific identifiers remain isolated in `identities`, never in `players`.

## Environment Variables

Required for Phase 0 and first playable:
- `NUXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `AUTH_GOOGLE_CLIENT_ID`
- `AUTH_GOOGLE_CLIENT_SECRET`
- `AUTH_SESSION_SECRET`
- `AUTH_APP_URL`

Only add if Discord is enabled later:
- `AUTH_DISCORD_CLIENT_ID`
- `AUTH_DISCORD_CLIENT_SECRET`

Notes:
- Keep secrets only in secure environment stores.
- Do not commit secrets into repo files.
- Keep `.env.example` limited to variable names and non-secret placeholders.

## Security Controls

- Enforce short-lived session tokens.
- Require HTTPS for all auth callbacks in preview and production.
- Validate token audience, issuer, and expiration.
- Reject gameplay mutations from unauthenticated contexts.
- Log auth failures and suspicious replay patterns.

## Compliance Checklist

- [ ] Privacy policy page published.
- [ ] Terms of service page published.
- [ ] Data deletion request path defined.
- [ ] Minimal scopes requested: `openid`, `profile`, `email`.

## Implementation Sequence

1. Integrate Google provider and verify local callback flow.
2. Add Convex identity mapping plus player bootstrap mutation.
3. Add auth guard composable for protected pages.
4. Add sign-out flow and token expiry handling.
5. Re-evaluate Discord only after the first playtest and update this decision record if scope changes.

## Acceptance Criteria

- User can sign in with Google and receive a player record.
- Returning sign-in maps to the same player record by provider subject.
- Protected routes redirect unauthenticated users to sign-in.
- Sign-out clears local session and protected state.
