<script setup lang="ts">
/**
 * The deck shell: rail nav, panel counter, and the input that pages between
 * panels. Panels themselves come in through the default slot.
 */

const { PANELS, index, deckOn, go, isLocked, DECK_MIN } = useDeck()
const { t } = useI18n()

const railInner = shallowRef<HTMLElement>()

const railStyle = computed(() =>
  deckOn.value ? { transform: `translate3d(0, ${-index.value * 100}vh, 0)` } : {},
)

/** the live accent is written to the root so every accented rule transitions */
watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.style.setProperty('--accent', PANELS[index.value]!.accent)
  }
})

watchEffect(() => {
  if (import.meta.client) document.body.classList.toggle('deck-on', deckOn.value)
})

onMounted(() => {
  const deckQuery = matchMedia(DECK_MIN)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')

  const sync = () => { deckOn.value = deckQuery.matches && !reduce.matches }
  sync()
  deckQuery.addEventListener('change', sync)
  reduce.addEventListener('change', sync)
  // Some hosts lay out after the script runs, so the media query would read
  // false forever without a second look once a real size exists.
  const ro = new ResizeObserver(sync)
  ro.observe(document.documentElement)

  /* ---- wheel: accumulate so a trackpad's flurry counts as one page ---- */
  let acc = 0
  let accTimer: ReturnType<typeof setTimeout> | undefined

  const onWheel = (e: WheelEvent) => {
    if (!deckOn.value) return

    // A dense region inside a panel scrolls on its own until it bottoms out;
    // only then does the wheel go back to paging. Without this the global
    // preventDefault would freeze the plugin grid.
    const sc = (e.target as Element | null)?.closest?.('[data-scroll]') as HTMLElement | null
    if (sc && sc.scrollHeight > sc.clientHeight + 1) {
      const atTop = sc.scrollTop <= 0
      const atEnd = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1
      if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atEnd)) { acc = 0; return }
    }

    e.preventDefault()
    if (isLocked()) return
    acc += e.deltaY
    clearTimeout(accTimer)
    accTimer = setTimeout(() => { acc = 0 }, 160)
    if (Math.abs(acc) > 42) { go(index.value + (acc > 0 ? 1 : -1)); acc = 0 }
  }

  const onKey = (e: KeyboardEvent) => {
    if (!deckOn.value) return
    if ((e.target as Element | null)?.closest?.('[data-keys]')) return
    const step: Record<string, number> = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }
    if (e.key in step) { e.preventDefault(); go(index.value + step[e.key]!) }
    else if (e.key === 'Home') { e.preventDefault(); go(0) }
    else if (e.key === 'End') { e.preventDefault(); go(PANELS.length - 1) }
  }

  let touchY: number | null = null
  const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]!.clientY }
  const onTouchMove = (e: TouchEvent) => {
    if (!deckOn.value || touchY === null || isLocked()) return
    const dy = touchY - e.touches[0]!.clientY
    if (Math.abs(dy) > 56) { go(index.value + (dy > 0 ? 1 : -1)); touchY = null }
  }

  addEventListener('wheel', onWheel, { passive: false })
  addEventListener('keydown', onKey)
  addEventListener('touchstart', onTouchStart, { passive: true })
  addEventListener('touchmove', onTouchMove, { passive: true })

  /* ---- in flow mode the rail still tracks whichever panel is on screen ---- */
  const io = new IntersectionObserver(
    (entries) => {
      if (deckOn.value) return
      for (const en of entries) {
        if (en.isIntersecting) {
          const i = PANELS.findIndex((p) => p.id === en.target.id)
          if (i >= 0) index.value = i
        }
      }
    },
    { threshold: 0.55 },
  )
  for (const p of PANELS) {
    const el = document.getElementById(p.id)
    if (el) io.observe(el)
  }

  onBeforeUnmount(() => {
    deckQuery.removeEventListener('change', sync)
    reduce.removeEventListener('change', sync)
    ro.disconnect()
    io.disconnect()
    removeEventListener('wheel', onWheel)
    removeEventListener('keydown', onKey)
    removeEventListener('touchstart', onTouchStart)
    removeEventListener('touchmove', onTouchMove)
    clearTimeout(accTimer)
    document.body.classList.remove('deck-on')
  })
})
</script>

<template>
  <div>
    <nav class="rail" :aria-label="t('nav.sections')">
      <a
        v-for="(p, i) in PANELS"
        :key="p.id"
        class="rail__item"
        :href="`#${p.id}`"
        :aria-current="i === index ? 'true' : 'false'"
        :data-cursor-label="t(p.key)"
        @click.prevent="go(i)"
      >
        <span class="rail__label">{{ t(p.key) }}</span>
        <span class="rail__tick" />
      </a>
    </nav>

    <div class="counter">
      <b>{{ String(index).padStart(2, '0') }}</b>
      <span>/ {{ String(PANELS.length - 1).padStart(2, '0') }}</span>
    </div>

    <div class="deck" :class="{ 'is-deck': deckOn }">
      <div ref="railInner" class="deck__rail" :style="railStyle">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.deck { position: relative; z-index: 1; }

/* Deck mode is a class on this element rather than a global `body.deck-on`
   rule: Tailwind 4's `@import 'tailwindcss'` puts the global sheet into a
   cascade layer, and an unlayered scoped rule beats a layered one no matter
   how specific the layered one is. Keeping it local sidesteps that entirely. */
.deck.is-deck {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
.deck.is-deck .deck__rail {
  height: 100%;
  transition: transform var(--deck-turn) var(--ease);
  will-change: transform;
}

/* ---- rail ---- */
.rail {
  position: fixed;
  z-index: 30;
  right: var(--pad);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: .85rem;
  align-items: flex-end;
}
.rail__item {
  display: flex;
  align-items: center;
  gap: .7rem;
  color: var(--faint);
  transition: color 260ms var(--ease);
}
.rail__label {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .1em;
  opacity: 0;
  transform: translateX(6px);
  white-space: nowrap;
  transition: opacity 260ms var(--ease), transform 260ms var(--ease);
}
.rail__tick {
  width: 24px;
  height: 1px;
  background: currentColor;
  transition: width var(--dur-mid) var(--ease);
}
.rail__item:hover,
.rail__item[aria-current='true'] { color: var(--text); }
.rail__item:hover .rail__label,
.rail__item[aria-current='true'] .rail__label { opacity: 1; transform: none; }
.rail__item[aria-current='true'] { color: var(--accent); }
.rail__item[aria-current='true'] .rail__tick { width: 42px; }

/* ---- counter ---- */
.counter {
  position: fixed;
  z-index: 30;
  left: var(--pad);
  bottom: 1.4rem;
  display: flex;
  align-items: baseline;
  gap: .45rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .1em;
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}
.counter b {
  color: var(--accent);
  font-weight: 500;
  transition: color 700ms var(--ease);
}

@media (max-width: 860px) {
  .rail { display: none; }
}
</style>
