<template>
  <UPage>
    <UPageBody>
      <section class="dm-vibe-surface rounded-3xl border border-white/10 p-6 md:p-10">
        <p class="dm-kicker">Transmission Archive</p>
        <h1 class="dm-heading text-4xl md:text-6xl">The Death Maze Chronicle</h1>
        <p class="mt-4 max-w-3xl text-base leading-relaxed text-neutral-200/90 md:text-lg">
          Full narrative briefing for squads entering the Maze. Read before deployment.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <UButton to="/" color="neutral" variant="soft" icon="i-lucide-arrow-left">
            Return to briefing
          </UButton>
        </div>

        <div class="dm-story-divider mt-10" />

        <article class="dm-story-flow mt-8 max-w-4xl">
          <p
            v-for="(paragraph, paragraphIndex) in fullStoryParagraphs"
            :key="`story-paragraph-${paragraphIndex}`"
            class="dm-story-paragraph"
          >
            {{ paragraph }}
          </p>
        </article>
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { fullStoryParagraphs } from '~/content/story'

useSeoMeta({
  title: 'Death Maze 2044 - Story',
  description: 'Read the full Death Maze 2044 transmission and narrative setup.',
})
</script>
