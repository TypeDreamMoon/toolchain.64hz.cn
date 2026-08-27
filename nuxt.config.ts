import tailwindcss from '@tailwindcss/vite'

const site = {
  // Every canonical URL, sitemap entry and OG tag reads from here, so pointing
  // the site at a different host is a one-line change.
  url: process.env.NUXT_PUBLIC_SITE_URL || 'https://toolchain.64hz.cn',
  name: '64Hz Toolchain',
}

export default defineNuxtConfig({
  compatibilityDate: '2026-08-27',
  devtools: { enabled: true },

  // Prerendered to static HTML: the deploy is an rsync of a folder, and the
  // OG/SEO tags are in the served markup rather than painted in by the client.
  ssr: true,
  nitro: {
    // `dist/` rather than `.output/public/`, so the rsync line matches the one
    // already in hertz-games.
    output: { publicDir: 'dist' },
    prerender: { crawlLinks: true, routes: ['/'], failOnError: true },
  },

  modules: ['@nuxtjs/i18n'],

  // Without this, `components/deck/TheDeck.vue` auto-registers as
  // <DeckTheDeck>; a plain <TheDeck> then resolves to nothing and renders as
  // an empty comment with no error. Names come from the filename instead.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: 'zh',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: false,
  },

  runtimeConfig: {
    public: { siteUrl: site.url, siteName: site.name },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0e1014' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
        },
      ],
    },
  },

  typescript: { typeCheck: false, strict: true },
})
