<script setup lang="ts">
import type { PluginItem } from '~/composables/useCatalog'

/**
 * The plugin library as three counter-scrolling bands of names.
 *
 * Eighteen entries do not fit a viewport as cards, and a ranked list reads as
 * a spreadsheet. Bands carry any number of items in a fixed height, and the
 * studio site already uses a marquee, so the motif is house style rather than
 * decoration. Hovering stops the band it belongs to and pins the detail below.
 */

const props = defineProps<{ items: PluginItem[]; label: (cat: string) => string }>()

const ROWS = 3
const SPEEDS = ['58s', '72s', '64s']

/** deal the items round-robin so each band mixes categories */
const bands = computed(() => {
  const out: PluginItem[][] = Array.from({ length: ROWS }, () => [])
  props.items.forEach((it, i) => out[i % ROWS]!.push(it))
  return out
})

const active = ref<PluginItem | null>(null)
const detail = computed(() => active.value)

const stars = (p: PluginItem) => p.facts?.stars ?? 0
const href = (p: PluginItem) => p.facts?.url ?? `https://github.com/TypeDreamMoon/${p.repo}`
</script>

<template>
  <div class="mq" @pointerleave="active = null">
    <div
      v-for="(band, r) in bands"
      :key="r"
      class="mq__band"
      :class="{ 'mq__band--rev': r % 2 === 1 }"
      :style="{ '--speed': SPEEDS[r] }"
    >
      <!-- the track holds the band twice, so the loop has no seam -->
      <div class="mq__track">
        <a
          v-for="(p, i) in [...band, ...band]"
          :key="`${p.repo}-${i}`"
          class="mq__item"
          :class="{ 'is-dim': active && active.repo !== p.repo }"
          :href="href(p)"
          target="_blank"
          rel="noopener"
          :aria-hidden="i >= band.length ? 'true' : undefined"
          :tabindex="i >= band.length ? -1 : undefined"
          :data-cursor-label="label(p.cat)"
          @pointerenter="active = p"
          @focus="active = p"
        >
          <span class="mq__name">{{ p.repo }}</span>
          <span v-if="stars(p)" class="mq__stars">{{ stars(p) }}</span>
          <span class="mq__dot" aria-hidden="true">●</span>
        </a>
      </div>
    </div>

    <div class="mq__detail" :class="{ 'is-on': !!detail }">
      <template v-if="detail">
        <span class="mq__cat">{{ label(detail.cat) }}</span>
        <p class="mq__desc">{{ detail.desc }}</p>
        <span v-if="detail.source" class="mq__src">
          Fork of {{ detail.source.name }} · {{ detail.source.author }} · {{ detail.source.license }}
        </span>
      </template>
      <p v-else class="mq__hint">
        <slot name="hint" />
      </p>
    </div>
  </div>
</template>

<style scoped>
.mq { display: flex; flex-direction: column; gap: 0; min-width: 0; }

.mq__band {
  position: relative;
  overflow: hidden;
  border-top: 1px solid var(--line);
  padding-block: .45rem;
  /* fade the ends so names enter and leave instead of getting cut */
  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}
.mq__band:last-of-type { border-bottom: 1px solid var(--line); }

.mq__track {
  display: flex;
  align-items: center;
  width: max-content;
  animation: mq-run var(--speed) linear infinite;
  will-change: transform;
}
.mq__band--rev .mq__track { animation-direction: reverse; }
.mq__band:hover .mq__track,
.mq__band:focus-within .mq__track { animation-play-state: paused; }

/* the track is the band twice over, so -50% lands exactly on the repeat */
@keyframes mq-run {
  to { transform: translateX(-50%); }
}

.mq__item {
  display: inline-flex;
  align-items: baseline;
  gap: .4rem;
  padding-inline: .55rem;
  color: var(--text);
  transition: color var(--dur-fast) var(--ease), opacity var(--dur-fast) var(--ease);
}
.mq__item.is-dim { opacity: .3; }
.mq__item:hover,
.mq__item:focus-visible { color: var(--accent); opacity: 1; }

.mq__name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: var(--step-2);
  letter-spacing: -.02em;
  white-space: nowrap;
}
.mq__stars {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  align-self: flex-start;
  padding-top: .35em;
  transition: color 700ms var(--ease);
}
.mq__dot { color: var(--faint); font-size: .4rem; padding-inline-start: .4rem; }

/* ---- detail ---- */
.mq__detail {
  min-height: 4.6rem;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: .3rem;
  max-width: 62ch;
}
.mq__cat {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--accent);
  transition: color 700ms var(--ease);
}
.mq__desc { font-size: var(--step--1); color: var(--muted); line-height: 1.65; }
.mq__src { font-family: var(--font-mono); font-size: var(--step--2); color: var(--faint); }
.mq__hint { font-size: var(--step--1); color: var(--faint); line-height: 1.65; }

@media (max-width: 860px) {
  .mq__name { font-size: var(--step-1); }
}

/* Standing still, the bands become an ordinary wrapped list — no motion, and
   nothing is hidden off-track where it could never be reached. */
@media (prefers-reduced-motion: reduce) {
  .mq__band { mask-image: none; overflow: visible; }
  .mq__track { animation: none; width: auto; flex-wrap: wrap; }
  .mq__item[aria-hidden='true'] { display: none; }
}
</style>
