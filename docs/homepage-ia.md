# Homepage Information Architecture

Last updated: 2026-03-27

## Purpose

Define the `/` route as a marketing-first entry point that drives authentication and conversion into lobby participation.

Implementation note:
- The current repo shell is still the Nuxt starter.
- Replacing starter branding on the home page and global layout is part of Phase 0, not a later polish task.

## Target Outcomes

- Anonymous visitor understands the game premise in under 10 seconds.
- Visitor sees a clear sign-in CTA.
- Authenticated player can jump directly to the lobby or active run.

## Content Blocks (Top To Bottom)

1. Hero
- Full-width key art using the existing README image for the first iteration.
- Title: Death Maze 2044.
- Short value line focused on survival, squad tension, real-time exploration, and turn-based combat.
- Primary CTA: `Sign In to Enter the Maze` for anonymous users or `Start Run` for authenticated users.
- Secondary CTA: `How It Works`.

2. Core Loop Explainer
- Three cards:
- Explore the maze in real time.
- Engage in initiative-driven combat.
- Extract with your team or die trying.

3. Social Proof And Tension
- Callout strip for co-op and betrayal mechanics.
- Small `up to 5 players` emphasis.

4. How It Works
- Step list:
- Sign in.
- Join or create a lobby.
- Enter a run.
- Survive encounters.
- Escape with progression.

5. Footer
- Links to privacy policy, terms, and support or contact.

## Navigation Model

Anonymous nav:
- Home
- Lore
- How It Works
- Sign In

Authenticated nav:
- Home
- Lobby
- Profile
- Sign Out

## UX Rules

- Keep first contentful paint fast with optimized hero image sizes.
- Avoid heavy script execution on the home route before user intent.
- Keep the primary CTA visible above the fold on desktop and mobile.
- Preserve thematic tone with subtle motion, not noisy animation.

## Component Map

- `app/pages/index.vue`
- `app/components/marketing/HomeHero.vue`
- `app/components/marketing/CoreLoopCards.vue`
- `app/components/marketing/HowItWorks.vue`
- `app/components/marketing/HomeFooterLinks.vue`

## CTA Behavior Rules

- If unauthenticated, the primary CTA opens the Google auth flow.
- If authenticated and there is no active lobby, the primary CTA routes to `/lobby`.
- If authenticated and there is an active run, the primary CTA routes to `/run/:runId`.

## Acceptance Criteria

- Anonymous user can reach sign-in in one click.
- Authenticated user can reach lobby or run in one click.
- Home page is responsive and readable on mobile.
- The route remains lightweight enough to protect Lighthouse performance after hero integration.
