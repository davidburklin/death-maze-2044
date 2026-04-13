import { api } from '../../convex/_generated/api'
import { ConvexError } from 'convex/values'
import type { GoogleCredentialResponse } from '~/types/google-identity'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) return String(error.data)
  if (error instanceof Error) return error.message
  return fallback
}

interface AuthUser {
  displayName: string
  avatarUrl?: string
}

const AUTH_TOKEN_KEY = 'dm2044.google.idToken'
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client'

let googleScriptPromise: Promise<void> | null = null

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const tokenParts = token.split('.')
  if (tokenParts.length < 2) return null

  const payload = tokenParts[1]
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const jsonPayload = atob(padded)
    return JSON.parse(jsonPayload) as Record<string, unknown>
  }
  catch {
    return null
  }
}

const loadGoogleIdentityScript = (): Promise<void> => {
  if (googleScriptPromise) {
    return googleScriptPromise
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`)
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

export const useAuth = () => {
  const config = useRuntimeConfig()

  const isInitialized = useState<boolean>('auth.initialized', () => false)
  const isLoading = useState<boolean>('auth.loading', () => false)
  const idToken = useState<string | null>('auth.idToken', () => null)
  const user = useState<AuthUser | null>('auth.user', () => null)
  const errorMessage = useState<string | null>('auth.error', () => null)

  const isAuthenticated = computed<boolean>(() => Boolean(idToken.value))

  const resolveGoogleClientId = (): string => {
    const runtimeValue = config.public.googleClientId
    if (runtimeValue) return runtimeValue

    if (!import.meta.client) return ''

    const nuxtPublicValue = import.meta.env.NUXT_PUBLIC_AUTH_GOOGLE_CLIENT_ID as string | undefined
    if (nuxtPublicValue) return nuxtPublicValue

    const viteValue = import.meta.env.VITE_AUTH_GOOGLE_CLIENT_ID as string | undefined
    if (viteValue) return viteValue

    return ''
  }

  const setUserFromToken = (token: string): void => {
    const payload = decodeJwtPayload(token)
    const name = typeof payload?.name === 'string' ? payload.name : 'Unknown Agent'
    const picture = typeof payload?.picture === 'string' ? payload.picture : undefined

    user.value = {
      displayName: name,
      avatarUrl: picture,
    }
  }

  const signOut = (): void => {
    if (import.meta.client) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      window.google?.accounts.id.disableAutoSelect()
    }

    const client = useConvexClient()
    client.clearAuth()

    idToken.value = null
    user.value = null
    errorMessage.value = null
  }

  const syncAuthenticatedUser = async (): Promise<void> => {
    const token = idToken.value
    if (!token) return

    const client = useConvexClient()
    client.setAuth(token)
    await client.mutation(api.players.ensureCurrentPlayer, {})
    const currentPlayer = await client.query(api.players.getCurrentPlayer, {})

    if (currentPlayer) {
      user.value = {
        displayName: currentPlayer.lobbyName ?? currentPlayer.displayName,
        avatarUrl: currentPlayer.avatarKey ? `/${currentPlayer.avatarKey}` : currentPlayer.avatarUrl,
      }
      return
    }

    setUserFromToken(token)
  }

  const handleGoogleCredential = async (response: GoogleCredentialResponse): Promise<void> => {
    if (!response.credential) {
      errorMessage.value = 'Google sign-in failed: missing credential token.'
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      idToken.value = response.credential
      if (import.meta.client) {
        localStorage.setItem(AUTH_TOKEN_KEY, response.credential)
      }
      await syncAuthenticatedUser()
    }
    catch (error) {
      signOut()
      errorMessage.value = extractErrorMessage(error, 'Failed to complete sign-in.')
    }
    finally {
      isLoading.value = false
    }
  }

  const renderGoogleButton = async (target: HTMLElement): Promise<boolean> => {
    if (!import.meta.client) return false

    const googleClientId = resolveGoogleClientId()
    if (!googleClientId) {
      errorMessage.value = 'Google sign-in is not configured. Set NUXT_PUBLIC_AUTH_GOOGLE_CLIENT_ID (or AUTH_GOOGLE_CLIENT_ID) in .env.local and restart bun run dev.'
      return false
    }

    try {
      await loadGoogleIdentityScript()

      if (!window.google) {
        throw new Error('Google Identity Services is unavailable')
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          void handleGoogleCredential(response)
        },
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      target.innerHTML = ''
      window.google.accounts.id.renderButton(target, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 280,
        logo_alignment: 'left',
      })

      errorMessage.value = null
      return true
    }
    catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to render Google sign-in button.'
      return false
    }
  }

  const initialize = async (): Promise<void> => {
    if (!import.meta.client || isInitialized.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!storedToken) {
        isInitialized.value = true
        return
      }

      idToken.value = storedToken
      await syncAuthenticatedUser()
      isInitialized.value = true
    }
    catch (error) {
      signOut()
      errorMessage.value = extractErrorMessage(error, 'Failed to restore signed-in session.')
      isInitialized.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
    errorMessage,
    initialize,
    renderGoogleButton,
    signOut,
  }
}
