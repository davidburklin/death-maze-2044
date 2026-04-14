<template>
  <div>
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="text-lg font-semibold tracking-wide">
          Death Maze 2044
        </NuxtLink>
      </template>

      <template #right>
        <UButton to="/" variant="ghost" color="neutral" size="sm">
          Home
        </UButton>

        <UDropdownMenu
          v-if="showUserMenu"
          :items="userMenuItems"
          :content="{ align: 'end', sideOffset: 8 }"
          :ui="{ content: 'w-48' }"
        >
          <UButton variant="ghost" color="neutral" size="sm">
              <div class="flex items-center gap-2">
              <div class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                <img
                  v-if="user?.avatarUrl"
                  :src="user.avatarUrl"
                  :alt="user?.displayName"
                  class="h-full w-full object-cover"
                >
                <span v-else class="text-[10px] font-semibold text-white">{{ getInitials(user?.displayName) }}</span>
              </div>
              <span>{{ user?.displayName ?? 'Agent' }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-4 text-neutral-400" />
            </div>
          </UButton>
        </UDropdownMenu>

        <UButton v-else to="/lobby" variant="soft" color="primary" size="sm">
          Enter Lobby
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>

    <USeparator />
    <footer class="mx-auto w-full max-w-7xl px-4 py-6 text-sm text-muted">
      Death Maze 2044 prototype shell. Real-time co-op survival is in active development.
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const route = useRoute()
const { isAuthenticated, user, signOut } = useAuth()
const lobbySignOut = inject<(() => Promise<void>) | null>('lobbySignOut', null)

const showUserMenu = computed<boolean>(() => route.path === '/lobby' && isAuthenticated.value)

const getInitials = (displayName?: string | null): string => {
  if (!displayName) return '??'
  const parts = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (parts.length === 0) return '??'
  return parts.map(part => part[0]?.toUpperCase() ?? '').join('')
}

const handleSignOut = async (): Promise<void> => {
  if (lobbySignOut) {
    await lobbySignOut()
    return
  }
  signOut()
  await navigateTo('/farewell')
}

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      onSelect: () => void handleSignOut(),
    },
  ],
])
</script>
