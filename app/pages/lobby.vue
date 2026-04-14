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
          <UAlert
            v-if="profileErrorMessage"
            color="error"
            variant="soft"
            title="Profile setup error"
            :description="profileErrorMessage"
          />

          <div
            v-if="requiresProfileSetup"
            class="rounded-2xl border border-white/15 bg-black/30 p-5"
          >
            <p class="text-base font-semibold text-white">Complete your lobby profile</p>
            <p class="mt-2 text-sm text-neutral-300">
              Pick an avatar and choose your lobby name. This is saved for future logins.
            </p>

            <div class="mt-5 max-w-md">
              <label class="mb-2 block text-xs uppercase tracking-wide text-neutral-300" for="lobby-name">
                Lobby name
              </label>
              <UInput
                id="lobby-name"
                v-model="profileForm.lobbyName"
                size="xl"
                placeholder="Enter your lobby name"
                :disabled="isSavingProfile"
              />
            </div>

            <div class="mt-6">
              <p class="text-xs uppercase tracking-wide text-neutral-300">Choose avatar</p>
              <div class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                <button
                  v-for="avatar in avatarOptions"
                  :key="avatar"
                  type="button"
                  class="rounded-xl border p-2 transition"
                  :class="avatar === profileForm.avatarKey ? 'border-emerald-300 bg-emerald-400/20' : 'border-white/15 bg-black/30 hover:border-white/35'"
                  :disabled="isSavingProfile"
                  @click="profileForm.avatarKey = avatar"
                >
                  <img
                    :src="`/${avatar}`"
                    :alt="avatar"
                    class="mx-auto h-12 w-12"
                  >
                </button>
              </div>
            </div>

            <div class="mt-6">
              <UButton
                color="primary"
                size="lg"
                :loading="isSavingProfile"
                :disabled="isSavingProfile || !canSaveProfile"
                @click="saveProfile"
              >
                Save profile
              </UButton>
            </div>
          </div>

          <div v-else class="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
            <div class="rounded-2xl border border-white/15 bg-black/30 p-5">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-base font-semibold text-white">{{ lobbyView?.lobby.name ?? 'Lobby Chat' }}</p>
                  <p class="text-sm text-neutral-300">Real-time squad chat for this staging room.</p>
                </div>
                <UBadge
                  v-if="lobbyView?.allReady"
                  color="success"
                  variant="soft"
                  label="All Players Ready"
                />
              </div>

              <UAlert
                v-if="lobbyErrorMessage"
                class="mt-4"
                color="error"
                variant="soft"
                title="Lobby error"
                :description="lobbyErrorMessage"
              />

              <div
                ref="chatContainer"
                class="mt-4 h-[380px] overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3"
              >
                <div v-if="hasMoreMessages" class="mb-3 flex justify-center">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :loading="isLoadingMoreMessages"
                    :disabled="isLoadingMoreMessages"
                    @click="loadMoreMessages"
                  >
                    Load more
                  </UButton>
                </div>

                <div
                  v-for="message in chatMessages"
                  :key="message.id"
                  class="mb-3 rounded-lg border border-white/10 p-3"
                  :class="message.isSelf ? 'bg-emerald-500/10' : 'bg-white/5'"
                >
                  <div class="flex items-center gap-2">
                    <div class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                      <img
                        v-if="message.senderAvatarUrl"
                        :src="message.senderAvatarUrl"
                        :alt="message.senderName"
                        class="h-full w-full object-cover"
                      >
                      <span v-else class="text-[10px] font-semibold text-white">{{ getInitials(message.senderName) }}</span>
                    </div>
                    <p class="text-xs text-neutral-300">{{ message.senderName }}</p>
                    <p class="text-[11px] text-neutral-500">{{ formatMessageTime(message.createdAt) }}</p>
                  </div>
                  <p class="mt-2 whitespace-pre-wrap text-sm text-white">{{ message.body }}</p>
                </div>

                <p v-if="chatMessages.length === 0" class="text-sm text-neutral-400">
                  No messages yet. Start the conversation.
                </p>
              </div>

              <p v-if="typingIndicatorText" class="mt-3 text-xs text-neutral-400">
                {{ typingIndicatorText }}
              </p>

              <form class="mt-4 flex gap-2" @submit.prevent="sendMessage">
                <UInput
                  v-model="chatInput"
                  class="flex-1"
                  size="lg"
                  placeholder="Type a message"
                  :disabled="isSendingMessage"
                />
                <UButton
                  type="submit"
                  color="primary"
                  :loading="isSendingMessage"
                  :disabled="isSendingMessage || !chatInput.trim()"
                >
                  Send
                </UButton>
              </form>
            </div>

            <div class="space-y-4 rounded-2xl border border-white/15 bg-black/30 p-5">
              <div class="flex items-center justify-between gap-2">
                <p class="text-base font-semibold text-white">Players</p>
                <p class="text-xs text-neutral-300">
                  {{ lobbyView?.members.length ?? 0 }}/{{ lobbyView?.lobby.maxPlayers ?? 0 }}
                </p>
              </div>

              <div class="space-y-2">
                <div
                  v-for="member in lobbyView?.members ?? []"
                  :key="member.playerId"
                  class="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-2"
                >
                  <div class="flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                      <img
                        v-if="member.avatarUrl"
                        :src="member.avatarUrl"
                        :alt="member.displayName"
                        class="h-full w-full object-cover"
                      >
                      <span v-else class="text-xs font-semibold text-white">{{ getInitials(member.displayName) }}</span>
                    </div>
                    <p class="text-sm text-white">
                      {{ member.displayName }}
                      <span v-if="member.isSelf" class="text-xs text-neutral-400">(you)</span>
                    </p>
                  </div>
                  <UBadge
                    :color="member.isReady ? 'success' : 'neutral'"
                    variant="soft"
                    :label="member.isReady ? 'Ready' : 'Not ready'"
                  />
                </div>
              </div>

              <UButton
                color="primary"
                variant="solid"
                block
                :loading="isUpdatingReady"
                :disabled="isUpdatingReady"
                @click="toggleReady"
              >
                {{ lobbyView?.selfReady ? 'Unready' : 'Ready Up' }}
              </UButton>
            </div>
          </div>

        </div>
      </section>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { api } from '../../convex/_generated/api'
import { ConvexError } from 'convex/values'
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'

const CHAT_BOTTOM_THRESHOLD_PX = 48
const CHAT_PAGE_SIZE = 5
const LOBBY_TIMEOUT_REDIRECT_MESSAGE = 'while you were napping, you were fed to the maze. Try again.'
const LOBBY_TIMEOUT_ERRORS = new Set([
  'Lobby session timed out.',
  'No active lobby membership found.',
])

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) return String(error.data)
  if (error instanceof Error) return error.message
  return fallback
}

interface AvatarResponse {
  avatars: string[]
}

interface LobbyView {
  lobby: {
    id: string
    name: string
    maxPlayers: number
  }
  members: Array<{
    playerId: string
    displayName: string
    avatarUrl: string | null
    isReady: boolean
    isSelf: boolean
  }>
  typingDisplayNames: string[]
  allReady: boolean
  selfReady: boolean
}

interface LobbyMessage {
  id: string
  playerId: string
  senderName: string
  senderAvatarUrl: string | null
  body: string
  createdAt: number
  isSelf: boolean
}

interface LobbyMessagePage {
  page: LobbyMessage[]
  isDone: boolean
  continueCursor: string
}

const googleButtonContainer = ref<HTMLElement | null>(null)
const chatContainer = ref<HTMLElement | null>(null)
const convexClient = useConvexClient()

const avatarOptions = ref<string[]>([])
const requiresProfileSetup = ref<boolean>(false)
const profileErrorMessage = ref<string | null>(null)
const lobbyErrorMessage = ref<string | null>(null)
const isSavingProfile = ref<boolean>(false)
const isUpdatingReady = ref<boolean>(false)
const isSendingMessage = ref<boolean>(false)
const isLoadingMoreMessages = ref<boolean>(false)
const isSigningOut = ref<boolean>(false)
const lobbyView = ref<LobbyView | null>(null)
const chatMessages = ref<LobbyMessage[]>([])
const chatInput = ref<string>('')
const refreshTimer = ref<number | null>(null)
const typingIdleTimer = ref<number | null>(null)
const typingState = ref<boolean>(false)
const hasMoreMessages = ref<boolean>(false)
const messageHistoryCursor = ref<string | null>(null)
const newestLoadedMessageCreatedAt = ref<number | null>(null)
const isHandlingLobbyExit = ref<boolean>(false)

const profileForm = reactive({
  lobbyName: '',
  avatarKey: '',
})

const canSaveProfile = computed<boolean>(() => {
  return profileForm.lobbyName.trim().length >= 2 && profileForm.avatarKey.length > 0
})

const typingIndicatorText = computed<string | null>(() => {
  const typingNames = lobbyView.value?.typingDisplayNames ?? []
  if (typingNames.length === 0) return null
  if (typingNames.length === 1) return `${typingNames[0]} is typing...`
  if (typingNames.length === 2) return `${typingNames[0]} and ${typingNames[1]} are typing...`
  return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`
})

const {
  isAuthenticated,
  isLoading,
  errorMessage,
  initialize,
  renderGoogleButton,
  signOut,
} = useAuth()

const resetChatState = (anchorTimestamp = Date.now()): void => {
  chatMessages.value = []
  hasMoreMessages.value = false
  messageHistoryCursor.value = null
  newestLoadedMessageCreatedAt.value = anchorTimestamp
}

const isChatNearBottom = (): boolean => {
  const container = chatContainer.value
  if (!container) return true

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
  return distanceFromBottom <= CHAT_BOTTOM_THRESHOLD_PX
}

const scrollChatToBottom = async (): Promise<void> => {
  await nextTick()

  const container = chatContainer.value
  if (!container) return

  container.scrollTop = container.scrollHeight
}

const mergeMessages = (messages: LobbyMessage[]): LobbyMessage[] => {
  const uniqueMessages = new Map<string, LobbyMessage>()

  for (const message of messages) {
    uniqueMessages.set(message.id, message)
  }

  return Array.from(uniqueMessages.values()).sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt - right.createdAt
    }

    return left.id.localeCompare(right.id)
  })
}

const updateNewestLoadedMessageAnchor = (): void => {
  const newestMessage = chatMessages.value.at(-1)
  if (!newestMessage) return

  newestLoadedMessageCreatedAt.value = newestMessage.createdAt
}

const stopLobbyPolling = (): void => {
  if (refreshTimer.value !== null) {
    window.clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const clearTypingTimer = (): void => {
  if (typingIdleTimer.value !== null) {
    window.clearTimeout(typingIdleTimer.value)
    typingIdleTimer.value = null
  }
}

const beginLobbyExit = (): void => {
  isHandlingLobbyExit.value = true
  stopLobbyPolling()
  clearTypingTimer()
  typingState.value = false
  lobbyErrorMessage.value = null
  lobbyView.value = null
  chatInput.value = ''
  resetChatState()
}

const handleLobbySessionLoss = async (reason: 'auth' | 'timeout'): Promise<void> => {
  if (isHandlingLobbyExit.value) return

  beginLobbyExit()
  signOut()

  if (reason === 'timeout') {
    await navigateTo({
      path: '/',
      query: {
        timedOut: '1',
        message: LOBBY_TIMEOUT_REDIRECT_MESSAGE,
      },
    })
    return
  }

  await navigateTo('/')
}

const handleLobbyDataError = async (error: unknown, fallback: string): Promise<boolean> => {
  const message = extractErrorMessage(error, fallback)

  if (LOBBY_TIMEOUT_ERRORS.has(message)) {
    await handleLobbySessionLoss('timeout')
    return true
  }

  if (message === 'Not authenticated') {
    await handleLobbySessionLoss('auth')
    return true
  }

  lobbyErrorMessage.value = message
  return false
}

const handleManualSignOut = async (): Promise<void> => {
  if (isSigningOut.value) return

  isSigningOut.value = true
  beginLobbyExit()

  try {
    if (!requiresProfileSetup.value) {
      await convexClient.mutation(api.lobbies.leaveCurrentLobby, {})
    }
  }
  catch {
    // Best effort: if the leave call fails, the inactivity cleanup will still reclaim the slot.
  }

  signOut()
  await navigateTo('/farewell')
}

provide('lobbySignOut', handleManualSignOut)

const startLobbyPolling = (): void => {
  stopLobbyPolling()
  refreshTimer.value = window.setInterval(() => {
    void refreshLobbyState()
  }, 2500)
}

const mountGoogleButton = async (): Promise<void> => {
  if (!googleButtonContainer.value || isAuthenticated.value) return
  await renderGoogleButton(googleButtonContainer.value)
}

const loadAvatarOptions = async (): Promise<void> => {
  const response = await $fetch<AvatarResponse>('/api/avatars')
  avatarOptions.value = response.avatars
}

const loadCurrentPlayerProfile = async (): Promise<void> => {
  const currentPlayer = await convexClient.query(api.players.getCurrentPlayer, {})

  if (!currentPlayer) {
    requiresProfileSetup.value = true
    return
  }

  profileForm.lobbyName = currentPlayer.lobbyName ?? ''
  profileForm.avatarKey = currentPlayer.avatarKey ?? ''
  requiresProfileSetup.value = !currentPlayer.lobbyName || !currentPlayer.avatarKey
}

const loadLobbyView = async (): Promise<boolean> => {
  try {
    lobbyErrorMessage.value = null
    lobbyView.value = await convexClient.query(api.lobbies.getCurrentLobbyView, {}) as LobbyView
    return true
  }
  catch (error) {
    await handleLobbyDataError(error, 'Failed to load lobby.')
    return false
  }
}

const loadInitialMessages = async (): Promise<boolean> => {
  const requestStartedAt = Date.now()

  try {
    const initialPage = await convexClient.query(api.lobbies.listCurrentLobbyMessages, {
      paginationOpts: {
        cursor: null,
        numItems: CHAT_PAGE_SIZE,
      },
    }) as LobbyMessagePage

    chatMessages.value = initialPage.page
    hasMoreMessages.value = !initialPage.isDone
    messageHistoryCursor.value = initialPage.continueCursor
    newestLoadedMessageCreatedAt.value = initialPage.page.length > 0
      ? initialPage.page[initialPage.page.length - 1]?.createdAt ?? requestStartedAt
      : requestStartedAt

    await scrollChatToBottom()
    return true
  }
  catch (error) {
    await handleLobbyDataError(error, 'Failed to load chat history.')
    return false
  }
}

const loadMoreMessages = async (): Promise<void> => {
  if (!hasMoreMessages.value || !messageHistoryCursor.value) return

  isLoadingMoreMessages.value = true
  lobbyErrorMessage.value = null

  const previousScrollHeight = chatContainer.value?.scrollHeight ?? 0
  const previousScrollTop = chatContainer.value?.scrollTop ?? 0

  try {
    const olderPage = await convexClient.query(api.lobbies.listCurrentLobbyMessages, {
      paginationOpts: {
        cursor: messageHistoryCursor.value,
        numItems: CHAT_PAGE_SIZE,
      },
    }) as LobbyMessagePage

    chatMessages.value = mergeMessages([...olderPage.page, ...chatMessages.value])
    hasMoreMessages.value = !olderPage.isDone
    messageHistoryCursor.value = olderPage.continueCursor

    await nextTick()

    const container = chatContainer.value
    if (container) {
      container.scrollTop = previousScrollTop + (container.scrollHeight - previousScrollHeight)
    }
  }
  catch (error) {
    await handleLobbyDataError(error, 'Failed to load older messages.')
  }
  finally {
    isLoadingMoreMessages.value = false
  }
}

const loadNewMessages = async (forceScroll = false): Promise<boolean> => {
  if (newestLoadedMessageCreatedAt.value === null) {
    newestLoadedMessageCreatedAt.value = Date.now()
  }

  const shouldStickToBottom = forceScroll || isChatNearBottom()

  try {
    const recentMessages = await convexClient.query(api.lobbies.listCurrentLobbyMessagesSince, {
      afterCreatedAt: newestLoadedMessageCreatedAt.value,
    }) as LobbyMessage[]

    const knownIds = new Set(chatMessages.value.map(message => message.id))
    const unseenMessages = recentMessages.filter(message => !knownIds.has(message.id))

    if (unseenMessages.length === 0) {
      return true
    }

    chatMessages.value = mergeMessages([...chatMessages.value, ...unseenMessages])
    updateNewestLoadedMessageAnchor()

    if (shouldStickToBottom) {
      await scrollChatToBottom()
    }

    return true
  }
  catch (error) {
    await handleLobbyDataError(error, 'Failed to refresh chat.')
    return false
  }
}

const refreshLobbyState = async (): Promise<void> => {
  const loadedLobby = await loadLobbyView()
  if (!loadedLobby) return

  await loadNewMessages()
}

const formatMessageTime = (timestamp: number): string => {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

const getInitials = (displayName?: string | null): string => {
  if (!displayName) return '??'

  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return '??'
  return parts.map(part => part[0]?.toUpperCase() ?? '').join('')
}

const sendTypingState = async (isTyping: boolean): Promise<void> => {
  if (!isAuthenticated.value) return
  if (typingState.value === isTyping) return

  typingState.value = isTyping
  try {
    await convexClient.mutation(api.lobbies.setCurrentPlayerTyping, { isTyping })
  }
  catch {
    // Ignore typing update errors to keep chat interactions smooth.
  }
}

const scheduleTypingIdleReset = (): void => {
  clearTypingTimer()
  typingIdleTimer.value = window.setTimeout(() => {
    void sendTypingState(false)
  }, 1800)
}

const initializeLobby = async (): Promise<void> => {
  resetChatState()
  await convexClient.mutation(api.lobbies.ensureJoinedDefaultLobby, {})

  const lobbyLoaded = await loadLobbyView()
  if (!lobbyLoaded) return

  const messagesLoaded = await loadInitialMessages()
  if (!messagesLoaded) return

  startLobbyPolling()
}

const saveProfile = async (): Promise<void> => {
  if (!canSaveProfile.value) return

  profileErrorMessage.value = null
  isSavingProfile.value = true

  try {
    await convexClient.mutation(api.players.updateCurrentProfile, {
      lobbyName: profileForm.lobbyName,
      avatarKey: profileForm.avatarKey,
    })

    requiresProfileSetup.value = false
    await initializeLobby()
    await initialize()
  }
  catch (error) {
    profileErrorMessage.value = extractErrorMessage(error, 'Failed to save profile.')
  }
  finally {
    isSavingProfile.value = false
  }
}

const sendMessage = async (): Promise<void> => {
  const nextBody = chatInput.value.trim()
  if (!nextBody) return

  isSendingMessage.value = true
  lobbyErrorMessage.value = null

  try {
    await convexClient.mutation(api.lobbies.sendCurrentPlayerMessage, { body: nextBody })
    chatInput.value = ''
    clearTypingTimer()
    await sendTypingState(false)
    await loadNewMessages(true)
  }
  catch (error) {
    await handleLobbyDataError(error, 'Failed to send message.')
  }
  finally {
    isSendingMessage.value = false
  }
}

const toggleReady = async (): Promise<void> => {
  if (!lobbyView.value) return

  isUpdatingReady.value = true
  lobbyErrorMessage.value = null

  try {
    await convexClient.mutation(api.lobbies.setCurrentPlayerReady, {
      isReady: !lobbyView.value.selfReady,
    })
    await loadLobbyView()
  }
  catch (error) {
    await handleLobbyDataError(error, 'Failed to update ready state.')
  }
  finally {
    isUpdatingReady.value = false
  }
}

const initializeAuthenticatedExperience = async (): Promise<void> => {
  profileErrorMessage.value = null
  lobbyErrorMessage.value = null

  try {
    await convexClient.mutation(api.players.ensureCurrentPlayer, {})
    await loadAvatarOptions()
    await loadCurrentPlayerProfile()

    if (requiresProfileSetup.value) {
      stopLobbyPolling()
      resetChatState()
      return
    }

    await initializeLobby()
  }
  catch (error) {
    stopLobbyPolling()
    const message = extractErrorMessage(error, 'Failed to initialize your lobby experience.')

    if (requiresProfileSetup.value) {
      profileErrorMessage.value = message
    }
    else {
      lobbyErrorMessage.value = message
    }
  }
}

onMounted(async () => {
  await initialize()
  if (isAuthenticated.value) {
    await initializeAuthenticatedExperience()
    return
  }

  await mountGoogleButton()
})

watch(chatInput, (nextValue) => {
  const hasText = nextValue.trim().length > 0

  if (!hasText) {
    clearTypingTimer()
    void sendTypingState(false)
    return
  }

  void sendTypingState(true)
  scheduleTypingIdleReset()
})

watch(isAuthenticated, async (authed) => {
  if (authed) {
    await initializeAuthenticatedExperience()
    return
  }

  stopLobbyPolling()
  clearTypingTimer()

  if (!isHandlingLobbyExit.value) {
    void sendTypingState(false)
  }

  lobbyView.value = null
  requiresProfileSetup.value = false
  chatInput.value = ''
  isSigningOut.value = false
  resetChatState()

  if (!isHandlingLobbyExit.value) {
    await mountGoogleButton()
  }
})

onBeforeUnmount(() => {
  stopLobbyPolling()
  clearTypingTimer()

  if (!isHandlingLobbyExit.value) {
    void sendTypingState(false)
  }
})
</script>
