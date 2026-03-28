<template>
  <UPage>
    <UPageBody>
      <UPageHero
        title="Death Maze 2044"
        description="A real-time cooperative survival prototype where your squad navigates a hostile megastructure, drops into deterministic initiative combat, and races to override the nexus core."
      />
      <UPageSection
        title="Core Loop"
        description="Scout the maze, secure signal fragments, breach network locks, and survive combat rounds long enough to reach extraction."
        :features="coreLoop"
      />
      <UPageSection
        title="Phase 0 Status"
        description="Foundations are being wired now so gameplay systems can be implemented with deterministic contract tests and Convex-authoritative state."
        :features="status"
      />
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
const coreLoop = [
  {
    icon: 'i-lucide-radar',
    title: 'Explore',
    description: 'Party movement is synchronized in real time as players map macro-cells and route options.',
  },
  {
    icon: 'i-lucide-swords',
    title: 'Engage',
    description: 'Encounter triggers create isolated combat instances with deterministic initiative and turn order.',
  },
  {
    icon: 'i-lucide-cpu',
    title: 'Override',
    description: 'Runs complete by collecting enough signal fragments to override the nexus core and satisfy contract conditions.',
  },
]

const status = [
  {
    icon: 'i-lucide-check-check',
    title: 'Deterministic Rules',
    description: 'Shared world generation and combat primitives are already test-covered for reproducibility.',
  },
  {
    icon: 'i-lucide-database-zap',
    title: 'Authoritative Backend',
    description: 'Convex scaffolding and identity mapping are the next wiring steps in this implementation track.',
  },
  {
    icon: 'i-lucide-shield-check',
    title: 'Google OAuth First',
    description: 'Authentication scope is intentionally constrained to Google for the first playable milestone.',
  },
]
</script>
