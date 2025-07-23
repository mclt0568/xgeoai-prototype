import path from 'path';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    mapboxToken: process.env.MAPBOX_TOKEN
  },
  css: [path.join(process.cwd(), 'assets/styles/globals.scss')]
})
