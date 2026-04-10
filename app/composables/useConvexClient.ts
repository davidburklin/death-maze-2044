import { ConvexHttpClient } from 'convex/browser'

let convexClient: ConvexHttpClient | null = null

export const useConvexClient = (): ConvexHttpClient => {
  if (convexClient) {
    return convexClient
  }

  const config = useRuntimeConfig()
  const convexUrl = config.public.convexUrl

  if (!convexUrl) {
    throw new Error('Convex URL is not configured. Set NUXT_PUBLIC_CONVEX_URL or VITE_CONVEX_URL.')
  }

  convexClient = new ConvexHttpClient(convexUrl)
  return convexClient
}
