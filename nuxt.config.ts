import { config } from 'dotenv'

config({ path: '.env.local' })

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  runtimeConfig: {
    public: {
      convexUrl: process.env.NUXT_PUBLIC_CONVEX_URL ?? process.env.VITE_CONVEX_URL ?? '',
      googleClientId: process.env.AUTH_GOOGLE_CLIENT_ID ?? process.env.NUXT_PUBLIC_AUTH_GOOGLE_CLIENT_ID ?? '',
    },
  },

  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },

  image: {
    dir: 'assets/images',
  },

  modules: [
    '@nuxt/devtools',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/ui',
    '@pinia/nuxt'
  ]
})
