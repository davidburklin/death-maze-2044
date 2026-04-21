<template>
  <UPage>
    <UPageBody>
      <section class="dm-vibe-surface rounded-lg border border-white/10 p-6 md:p-10">
        <p class="dm-kicker">Maze Entry</p>
        <h1 class="dm-heading text-4xl md:text-5xl">Active Run</h1>

        <p class="mt-4 max-w-3xl text-base leading-relaxed text-neutral-200/90 md:text-lg">
          The intake door seals behind you. The maze is empty for now, but the entry assignment is live.
        </p>

        <UAlert
          v-if="pageErrorMessage"
          class="mt-6"
          color="error"
          variant="soft"
          title="Run error"
          :description="pageErrorMessage"
        />

        <UAlert
          v-if="movementErrorMessage"
          class="mt-6"
          color="error"
          variant="soft"
          title="Movement denied"
          :description="movementErrorMessage"
        />

        <div v-if="isPageLoading" class="mt-8 space-y-4">
          <USkeleton class="h-14 max-w-xl rounded-lg" />
          <USkeleton class="h-56 rounded-lg" />
        </div>

        <div v-else-if="runView" class="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div class="rounded-lg border border-white/15 bg-black/30 p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-base font-semibold text-white">Run {{ runView.run.id }}</p>
                <p class="mt-1 text-sm text-neutral-300">Seed {{ runView.run.seed }}</p>
              </div>
              <UBadge
                :color="runView.run.status === 'full' ? 'warning' : 'success'"
                variant="soft"
                :label="runView.run.status"
              />
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg border border-white/10 bg-black/40 p-3">
                <p class="text-xs uppercase text-neutral-400">Players</p>
                <p class="mt-1 text-xl font-semibold text-white">
                  {{ runView.run.memberCount }}/{{ runView.run.maxPlayers }}
                </p>
              </div>
              <div class="rounded-lg border border-white/10 bg-black/40 p-3">
                <p class="text-xs uppercase text-neutral-400">Entry</p>
                <p class="mt-1 text-xl font-semibold text-white">
                  {{ runView.self.entryIndex + 1 }}
                </p>
              </div>
              <div class="rounded-lg border border-white/10 bg-black/40 p-3">
                <p class="text-xs uppercase text-neutral-400">Position</p>
                <p class="mt-1 text-xl font-semibold text-white">
                  {{ formatCoord(runView.self.position) }}
                </p>
              </div>
            </div>

            <div class="mt-6">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm font-semibold uppercase text-neutral-300">Available exits</p>
                <p class="text-xs text-neutral-400">
                  Grid {{ runView.world.width }}x{{ runView.world.height }}
                </p>
              </div>

              <div v-if="runView.self.legalMoves.length > 0" class="mt-3 grid gap-2 sm:grid-cols-2">
                <UButton
                  v-for="move in runView.self.legalMoves"
                  :key="move.connectionId"
                  color="primary"
                  variant="soft"
                  :loading="movingConnectionId === move.connectionId"
                  :disabled="isMoving"
                  @click="moveThrough(move)"
                >
                  <span class="flex w-full items-center justify-between gap-3">
                    <span>{{ directionLabels[move.direction] }} to {{ formatCoord(move.to) }}</span>
                    <span class="text-xs uppercase text-neutral-300">{{ move.mode }}</span>
                  </span>
                </UButton>
              </div>

              <UAlert
                v-else
                class="mt-3"
                color="warning"
                variant="soft"
                title="No unlocked exits"
                description="The cell is sealed. Wait for updated route telemetry."
              />
            </div>

            <div class="mt-6">
              <p class="text-sm font-semibold uppercase text-neutral-300">Entry points</p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <div
                  v-for="entryPoint in runView.run.entryPoints"
                  :key="entryPoint.index"
                  class="rounded-lg border border-white/10 bg-black/40 p-3"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-semibold text-white">{{ entryPoint.label }}</p>
                    <UBadge color="neutral" variant="soft" label="one-way" />
                  </div>
                  <p class="mt-2 text-sm text-neutral-300">
                    Into macro cell {{ formatCoord(entryPoint.to) }}
                  </p>
                </div>
              </div>
            </div>

            <UAlert
              class="mt-6"
              color="info"
              variant="soft"
              title="Entry doors sealed"
              description="The intake doors only open inward. The way back is gone."
            />
          </div>

          <div class="rounded-lg border border-white/15 bg-black/30 p-5">
            <p class="text-base font-semibold text-white">Entrants</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="member in runView.members"
                :key="member.playerId"
                class="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-3"
              >
                <div>
                  <p class="text-sm font-semibold text-white">
                    {{ member.displayName }}
                    <span v-if="member.isSelf" class="text-xs text-neutral-400">(you)</span>
                  </p>
                  <p class="mt-1 text-xs text-neutral-400">
                    Entry {{ member.entryIndex + 1 }} at {{ formatCoord(member.position) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ConvexError } from 'convex/values'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const RUN_REFRESH_INTERVAL_MS = 2500

type Direction = 'north' | 'east' | 'south' | 'west'
type DoorMode = 'two-way' | 'one-way'

interface CellCoord {
  x: number
  y: number
}

interface LegalMove {
  connectionId: string
  from: CellCoord
  to: CellCoord
  direction: Direction
  mode: DoorMode
}

interface RunView {
  run: {
    id: string
    seed: number
    status: 'open' | 'full' | 'closed'
    maxPlayers: number
    memberCount: number
    entryPoints: Array<{
      index: number
      label: string
      to: CellCoord
    }>
  }
  world: {
    width: number
    height: number
  }
  self: {
    memberId: string
    entryIndex: number
    position: CellCoord
    legalMoves: LegalMove[]
  }
  members: Array<{
    playerId: string
    displayName: string
    avatarUrl: string | null
    entryIndex: number
    position: CellCoord
    isSelf: boolean
  }>
}

interface MoveInRunResult {
  position: CellCoord
  legalMoves: LegalMove[]
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) return String(error.data)
  if (error instanceof Error) return error.message
  return fallback
}

const route = useRoute()
const convexClient = useConvexClient()
const { initialize, isAuthenticated } = useAuth()

const isPageLoading = ref<boolean>(true)
const isMoving = ref<boolean>(false)
const movingConnectionId = ref<string | null>(null)
const pageErrorMessage = ref<string | null>(null)
const movementErrorMessage = ref<string | null>(null)
const runView = ref<RunView | null>(null)
const refreshTimer = ref<number | null>(null)

const directionLabels: Record<Direction, string> = {
  north: 'North',
  east: 'East',
  south: 'South',
  west: 'West',
}

const resolveRunId = (): Id<'runs'> | null => {
  const rawRunId = route.params.runId
  if (typeof rawRunId !== 'string' || rawRunId.length === 0) return null
  return rawRunId as Id<'runs'>
}

const formatCoord = (coord: CellCoord): string => {
  return `${coord.x},${coord.y}`
}

const stopRunPolling = (): void => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const loadRunView = async (showLoading = true): Promise<boolean> => {
  if (showLoading) {
    isPageLoading.value = true
  }
  pageErrorMessage.value = null

  try {
    await initialize()

    if (!isAuthenticated.value) {
      pageErrorMessage.value = 'Sign in is required to view an active run.'
      return false
    }

    const runId = resolveRunId()
    if (!runId) {
      pageErrorMessage.value = 'Run id is invalid.'
      return false
    }

    runView.value = await convexClient.query(api.runs.getRunView, { runId }) as RunView
    return true
  }
  catch (error) {
    pageErrorMessage.value = extractErrorMessage(error, 'Failed to load run.')
    return false
  }
  finally {
    if (showLoading) {
      isPageLoading.value = false
    }
  }
}

const refreshRunView = async (): Promise<void> => {
  if (isMoving.value) return
  await loadRunView(false)
}

const startRunPolling = (): void => {
  stopRunPolling()
  refreshTimer.value = window.setInterval(() => {
    void refreshRunView()
  }, RUN_REFRESH_INTERVAL_MS)
}

const moveThrough = async (move: LegalMove): Promise<void> => {
  const runId = resolveRunId()
  const currentRunView = runView.value
  if (!runId || !currentRunView || isMoving.value) return

  isMoving.value = true
  movingConnectionId.value = move.connectionId
  movementErrorMessage.value = null

  try {
    const result = await convexClient.mutation(api.runs.moveInRun, {
      runId,
      from: currentRunView.self.position,
      connectionId: move.connectionId,
    }) as MoveInRunResult

    runView.value = {
      ...currentRunView,
      self: {
        ...currentRunView.self,
        position: result.position,
        legalMoves: result.legalMoves,
      },
      members: currentRunView.members.map(member =>
        member.isSelf ? { ...member, position: result.position } : member
      ),
    }

    await loadRunView(false)
  }
  catch (error) {
    movementErrorMessage.value = extractErrorMessage(error, 'Failed to move.')
    await loadRunView(false)
  }
  finally {
    isMoving.value = false
    movingConnectionId.value = null
  }
}

const initializeRunPage = async (): Promise<void> => {
  const loaded = await loadRunView()
  if (loaded) {
    startRunPolling()
  }
}

onMounted(() => {
  void initializeRunPage()
})

onBeforeUnmount(() => {
  stopRunPolling()
})
</script>
