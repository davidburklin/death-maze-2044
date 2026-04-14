<template>
  <UPage>
    <UPageBody>
      <section class="dm-vibe-surface rounded-3xl border border-white/10 p-6 md:p-10">
        <p class="dm-kicker">Signal Suspended</p>
        <h1 class="dm-heading text-4xl md:text-6xl">You Left The Staging Room</h1>
        <p class="mt-4 max-w-3xl text-base leading-relaxed text-neutral-200/90 md:text-lg">
          Your squad slot has been released and your session is closed on this device. This is a
          temporary farewell landing page for the branch, and we can turn it into something richer later.
        </p>

        <div class="mt-8 grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <div class="rounded-2xl border border-white/15 bg-black/30 p-5">
            <p class="text-sm uppercase tracking-[0.24em] text-neutral-400">Placeholder</p>
            <p class="mt-3 text-lg font-semibold text-white">Reserved for exit messaging</p>
            <p class="mt-3 text-sm leading-7 text-neutral-300">
              Later we can use this page for run summaries, sign-out confirmation, reconnect guidance,
              or any post-session CTA. For now it just gives manual sign-out a stable destination.
            </p>
          </div>

          <div class="rounded-2xl border border-white/15 bg-black/30 p-5">
            <p class="text-sm uppercase tracking-[0.24em] text-neutral-400">Next Move</p>
            <div class="mt-4 flex flex-col gap-3">
              <UButton to="/" color="neutral" variant="soft" icon="i-lucide-arrow-left">
                Return to briefing
              </UButton>
              <UButton to="/lobby" color="primary" icon="i-lucide-door-open">
                Re-enter lobby
              </UButton>
            </div>
          </div>
        </div>
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Death Maze 2044 - Farewell',
  description: 'Placeholder sign-out landing page for Death Maze 2044.',
})
</script>