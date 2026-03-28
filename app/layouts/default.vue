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
        <UButton to="/lobby" variant="soft" color="primary" size="sm">
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
