<script setup lang="ts">
const { t, locale } = useI18n()
const config = useRuntimeConfig()

useHead({
  titleTemplate: (chunk) => (chunk ? `${chunk} — ${t('site.name')}` : t('site.name')),
  htmlAttrs: { lang: () => (locale.value === 'en' ? 'en' : 'zh-CN') },
})

useSeoMeta({
  description: () => t('site.description'),
  ogTitle: () => t('site.name'),
  ogDescription: () => t('site.description'),
  ogType: 'website',
  ogUrl: config.public.siteUrl as string,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <ShaderField />
    <CustomCursor />
    <SiteHeader />
    <NuxtPage />
  </div>
</template>
