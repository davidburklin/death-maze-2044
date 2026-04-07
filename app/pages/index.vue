<template>
  <UPage>
    <UPageBody>
      <section class="dm-vibe-surface rounded-3xl border border-white/10 p-6 md:p-10">
        <p class="dm-kicker">Live Transmission</p>
        <h1 class="dm-heading text-4xl md:text-6xl">Death Maze 2044</h1>
        <p class="mt-4 max-w-3xl text-base leading-relaxed text-neutral-200/90 md:text-lg">
          A real-time multiploayer survival game. Survive the horrors within the maze long
          enough to escape, or meet your expected death. Real Time exploration with hybrid
          turn based combat.
        </p>

        <div class="dm-crawl-shell mt-8">
          <div class="dm-crawl-stage">
            <div
              :key="crawlReplaySeed"
              class="dm-crawl-track"
              :class="{
                'is-paused': isCrawlPaused,
              }"
            >
              <p
                v-for="(line, lineIndex) in heroCrawlLines"
                :key="`crawl-line-${lineIndex}`"
                class="dm-crawl-line"
              >
                {{ line }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-pause"
            @click="isCrawlPaused = !isCrawlPaused"
          >
            {{ isCrawlPaused ? 'Resume crawl' : 'Pause crawl' }}
          </UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="replayCrawl">
            Replay intro
          </UButton>
          <UButton to="/story" color="primary" icon="i-lucide-scroll-text">
            Read full transmission
          </UButton>
        </div>
      </section>
      <UPageSection
        title="The maze"
        description="Scout the maze, secure signal fragments, breach network locks, and survive 
        combat rounds long enough to find and unlock the exit. or die trying."
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
import { ref } from 'vue'
import { heroCrawlLines } from '~/content/story'

const isCrawlPaused = ref(false)
const crawlReplaySeed = ref(0)

const replayCrawl = (): void => {
  crawlReplaySeed.value += 1
  isCrawlPaused.value = false
}

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
