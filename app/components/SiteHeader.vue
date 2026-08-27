<script setup lang="ts">
const { t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { locale } = useI18n()
const { go } = useDeck()

const otherLocale = computed(() => (locale.value === 'en' ? 'zh' : 'en'))
</script>

<template>
  <header class="top">
    <a class="brand" href="#home" data-magnetic @click.prevent="go(0)">
      <span class="brand__mark">64<span>Hz</span></span>
      <span class="brand__sub">Toolchain</span>
    </a>

    <div class="top__end">
      <a class="top__link" href="https://shader.toolchain.64hz.cn">{{ t('nav.docs') }}</a>
      <!-- no destination yet; a dead link is worse than a plain label -->
      <span class="top__link top__link--soon" :title="t('nav.soon')">{{ t('nav.playground') }}</span>
      <a
        class="top__link"
        href="https://github.com/TypeDreamMoon"
        target="_blank"
        rel="noopener"
        data-cursor-label="↗"
      >{{ t('nav.github') }} ↗</a>
      <NuxtLink class="top__link" :to="switchLocalePath(otherLocale)">{{ t('nav.lang') }}</NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.top {
  position: fixed;
  z-index: 30;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.35rem var(--pad);
}

.brand { display: flex; align-items: baseline; gap: .6rem; }
.brand__mark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--step-1);
  letter-spacing: -.02em;
  color: var(--text-hi);
}
.brand__mark span { color: var(--accent); transition: color 700ms var(--ease); }
.brand__sub {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--faint);
}

.top__end { display: flex; align-items: center; gap: 1.35rem; }
.top__link {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
  transition: color var(--dur-fast) var(--ease);
}
.top__link:hover { color: var(--accent); }

.top__link--soon { color: var(--faint); cursor: default; }
.top__link--soon:hover { color: var(--faint); }

@media (max-width: 560px) {
  .brand__sub { display: none; }
  .top__end { gap: .9rem; }
}
</style>
