<template>
  <UPage>
    <UPageBody>
      <section class="dm-vibe-surface rounded-3xl border border-white/10 p-6 md:p-10">
        <p class="dm-kicker">Staging Node</p>
        <h1 class="dm-heading text-4xl md:text-5xl">Lobby Access</h1>

        <p class="mt-4 max-w-2xl text-base leading-relaxed text-neutral-200/90 md:text-lg">
          Assemble your squad before entering the maze. Sign in is required to create or join a run.
        </p>

        <UAlert
          v-if="errorMessage"
          class="mt-6"
          color="error"
          variant="soft"
          title="Sign-in error"
          :description="errorMessage"
        />

        <div v-if="isLoading && !isAuthenticated" class="mt-8">
          <USkeleton class="h-14 w-[280px] rounded-lg" />
        </div>

        <div v-else-if="!isAuthenticated" class="mt-8 space-y-4">
          <p class="text-sm text-neutral-300">
            Continue with your Google account to enter the multiplayer lobby.
          </p>
          <div ref="googleButtonContainer" class="min-h-14" />
        </div>

        <div v-else class="mt-8 space-y-6">
          <div class="rounded-2xl border border-white/15 bg-black/30 p-5">
            <p class="text-sm text-neutral-300">Signed in as</p>
            <div class="mt-3 flex items-center gap-3">
              <UAvatar
                :src="user?.avatarUrl"
                :alt="user?.displayName"
                size="md"
              />
              <p class="text-lg font-semibold text-white">
                {{ user?.displayName ?? 'Unknown Agent' }}
              </p>
            </div>
          </div>

          <div class="rounded-2xl border border-white/15 bg-black/30 p-5">
            <p class="text-base font-semibold text-white">Lobby Placeholder</p>
            <p class="mt-2 text-sm text-neutral-300">
              Lobby creation and join flow will be added next. Authentication gate is now active.
            </p>
          </div>

          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-log-out"
            @click="signOut"
          >
            Sign out
          </UButton>
        </div>
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const googleButtonContainer = ref<HTMLElement | null>(null)
const {
  isAuthenticated,
  isLoading,
  user,
  errorMessage,
  initialize,
  renderGoogleButton,
  signOut,
} = useAuth()

const mountGoogleButton = async (): Promise<void> => {
  if (!googleButtonContainer.value || isAuthenticated.value) return
  await renderGoogleButton(googleButtonContainer.value)
}

onMounted(async () => {
  await initialize()
  await mountGoogleButton()
})

watch(isAuthenticated, async (authed) => {
  if (!authed) {
    await mountGoogleButton()
  }
})
</script>
