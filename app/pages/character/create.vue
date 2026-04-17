<template>
  <UPage>
    <UPageBody>
      <section class="dm-vibe-surface rounded-lg border border-white/10 p-6 md:p-10">
        <p class="dm-kicker">Regime Intake</p>
        <h1 class="dm-heading text-4xl md:text-5xl">Survival Bias</h1>

        <p class="mt-4 max-w-3xl text-base leading-relaxed text-neutral-200/90 md:text-lg">
          The implant is awake. Four graft ports wait under the skin, sealed and hungry, but tonight the Regime grants only one mercy: a single bias before the maze takes its first bite.
        </p>

        <UAlert
          v-if="pageErrorMessage"
          class="mt-6"
          color="error"
          variant="soft"
          title="Intake error"
          :description="pageErrorMessage"
        />

        <UAlert
          v-if="entryMessage"
          class="mt-6"
          color="success"
          variant="soft"
          title="Character locked"
          :description="entryMessage"
        />

        <div v-if="isPageLoading" class="mt-8 space-y-4">
          <USkeleton class="h-14 max-w-xl rounded-lg" />
          <USkeleton class="h-40 rounded-lg" />
        </div>

        <div v-else-if="!isAuthenticated" class="mt-8 space-y-4">
          <UAlert
            color="warning"
            variant="soft"
            title="Lobby clearance required"
            description="The intake chair stays cold until Google identity clearance is restored."
          />
          <UButton to="/lobby" color="primary" icon="i-lucide-door-open">
            Return to lobby
          </UButton>
        </div>

        <div v-else-if="!isReadyForCreation" class="mt-8 space-y-4">
          <UAlert
            color="warning"
            variant="soft"
            title="Readiness revoked"
            description="The intake chair releases only ready entrants from an active lobby."
          />
          <UButton to="/lobby" color="primary" icon="i-lucide-door-open">
            Return to lobby
          </UButton>
        </div>

        <div v-else class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div class="space-y-4">
            <p class="text-sm font-semibold uppercase text-neutral-300">
              Choose one bias
            </p>

            <div class="grid gap-3">
              <label
                v-for="option in survivalBiasOptions"
                :key="option.key"
                class="cursor-pointer rounded-lg border p-4 transition"
                :class="selectedBias === option.key ? 'border-emerald-300 bg-emerald-400/15' : 'border-white/15 bg-black/30 hover:border-white/35'"
              >
                <input
                  v-model="selectedBias"
                  class="sr-only"
                  type="radio"
                  name="survival-bias"
                  :value="option.key"
                  :disabled="isSavingCharacter"
                >
                <span class="flex flex-col gap-2">
                  <span class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-lg font-semibold text-white">{{ option.title }}</span>
                    <UBadge color="success" variant="soft" :label="`+1 ${attributeLabels[option.key]}`" />
                  </span>
                  <span class="text-xs uppercase text-emerald-200/80">
                    {{ option.implantSignal }}
                  </span>
                  <span class="text-sm leading-relaxed text-neutral-300">
                    {{ option.description }}
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div class="rounded-lg border border-white/15 bg-black/30 p-5">
            <p class="text-base font-semibold text-white">Attribute imprint</p>
            <p class="mt-2 text-sm text-neutral-300">
              Baseline tissue response is flat. The selected survival bias receives the only sanctioned lift.
            </p>

            <div class="mt-5 space-y-3">
              <div
                v-for="attribute in attributeRows"
                :key="attribute.key"
                class="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2"
              >
                <span class="text-sm text-neutral-200">{{ attribute.label }}</span>
                <span class="text-lg font-semibold text-white">{{ computedAttributes[attribute.key] }}</span>
              </div>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <UButton
                color="neutral"
                variant="soft"
                :loading="isUnreadying"
                :disabled="isUnreadying || isSavingCharacter"
                @click="unready"
              >
                Unready
              </UButton>
              <UButton
                color="primary"
                :loading="isSavingCharacter"
                :disabled="!canEnterMaze || isSavingCharacter || isUnreadying"
                @click="enterMaze"
              >
                Enter Maze
              </UButton>
            </div>
          </div>
        </div>
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { api } from '../../../convex/_generated/api'
import { ConvexError } from 'convex/values'
import { computed, onMounted, ref } from 'vue'
import {
  BASE_CHARACTER_ATTRIBUTES,
  SURVIVAL_BIAS_OPTIONS,
  createMvpCharacter,
} from '~~/shared/game/characters/createCharacter'
import type { AttributeKey, CharacterAttributes } from '~~/shared/game/characters/types'

interface LobbyView {
  selfReady: boolean
}

interface CurrentCharacter {
  survivalBias?: AttributeKey
}

interface EnterMazeResult {
  runId: string
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) return String(error.data)
  if (error instanceof Error) return error.message
  return fallback
}

const convexClient = useConvexClient()
const {
  isAuthenticated,
  initialize,
} = useAuth()

const survivalBiasOptions = SURVIVAL_BIAS_OPTIONS
const attributeRows: Array<{ key: AttributeKey, label: string }> = [
  { key: 'strength', label: 'Strength' },
  { key: 'perception', label: 'Perception' },
  { key: 'agility', label: 'Agility' },
  { key: 'intelligence', label: 'Intelligence' },
]

const attributeLabels: Record<AttributeKey, string> = {
  strength: 'Strength',
  perception: 'Perception',
  agility: 'Agility',
  intelligence: 'Intelligence',
}

const selectedBias = ref<AttributeKey | null>(null)
const isPageLoading = ref<boolean>(true)
const isReadyForCreation = ref<boolean>(false)
const isSavingCharacter = ref<boolean>(false)
const isUnreadying = ref<boolean>(false)
const pageErrorMessage = ref<string | null>(null)
const entryMessage = ref<string | null>(null)

const computedAttributes = computed<CharacterAttributes>(() => {
  if (!selectedBias.value) {
    return { ...BASE_CHARACTER_ATTRIBUTES }
  }

  return createMvpCharacter(selectedBias.value).attributes
})

const canEnterMaze = computed<boolean>(() => selectedBias.value !== null)

const loadCharacterCreationState = async (): Promise<void> => {
  isPageLoading.value = true
  pageErrorMessage.value = null
  entryMessage.value = null

  try {
    await initialize()

    if (!isAuthenticated.value) {
      return
    }

    await convexClient.mutation(api.players.ensureCurrentPlayer, {})

    const lobbyView = await convexClient.query(api.lobbies.getCurrentLobbyView, {}) as LobbyView
    isReadyForCreation.value = lobbyView.selfReady

    if (!lobbyView.selfReady) {
      return
    }

    const currentCharacter = await convexClient.query(api.characters.getCurrentCharacter, {}) as CurrentCharacter | null
    selectedBias.value = currentCharacter?.survivalBias ?? null
  }
  catch (error) {
    pageErrorMessage.value = extractErrorMessage(error, 'Failed to load character intake.')
  }
  finally {
    isPageLoading.value = false
  }
}

const unready = async (): Promise<void> => {
  isUnreadying.value = true
  pageErrorMessage.value = null

  try {
    await convexClient.mutation(api.lobbies.setCurrentPlayerReady, {
      isReady: false,
    })
    await navigateTo('/lobby')
  }
  catch (error) {
    pageErrorMessage.value = extractErrorMessage(error, 'Failed to return to lobby.')
  }
  finally {
    isUnreadying.value = false
  }
}

const enterMaze = async (): Promise<void> => {
  if (!selectedBias.value) return

  isSavingCharacter.value = true
  pageErrorMessage.value = null
  entryMessage.value = null

  try {
    await convexClient.mutation(api.characters.saveCurrentCharacter, {
      survivalBias: selectedBias.value,
    })

    const result = await convexClient.mutation(api.runs.enterMaze, {}) as EnterMazeResult
    entryMessage.value = 'The implant accepts the imprint. Maze entry assigned.'
    await navigateTo(`/run/${result.runId}`)
  }
  catch (error) {
    pageErrorMessage.value = extractErrorMessage(error, 'Failed to enter maze.')
  }
  finally {
    isSavingCharacter.value = false
  }
}

onMounted(() => {
  void loadCharacterCreationState()
})
</script>
