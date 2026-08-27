<script setup lang="ts">
import type { PluginItem } from '~/composables/useCatalog'

/**
 * The plugin library as a tilted wall.
 *
 * The plane leans with the pointer, and each tile's depth is its star count —
 * so the wall is not just perspective for its own sake, the Z axis carries the
 * same information the numbers do. Hovering pulls a tile to the front and
 * writes its description underneath.
 */

const props = defineProps<{ items: PluginItem[]; label: (cat: string) => string }>()

const wall = shallowRef<HTMLElement>()
const active = ref<PluginItem | null>(null)

const stars = (p: PluginItem) => p.facts?.stars ?? 0
const href = (p: PluginItem) => p.facts?.url ?? `https://github.com/TypeDreamMoon/${p.repo}`

const maxStars = computed(() => Math.max(1, ...props.items.map(stars)))
/** 0 at the back, 1 at the front — square-rooted so a 10★ outlier does not
 *  flatten everything else against the wall */
const depth = (p: PluginItem) => Math.sqrt(stars(p) / maxStars.value)

/** the wall leans a little even at rest, so it reads as a plane on arrival */
const REST = { rx: 4, ry: -7 }
const tilt = reactive({ ...REST })

function onMove(e: PointerEvent) {
  // the sheen follows the pointer inside whichever tile it is over
  const tile = (e.target as Element | null)?.closest?.('.wall__tile') as HTMLElement | null
  if (tile) {
    const tr = tile.getBoundingClientRect()
    tile.style.setProperty('--mx', `${((e.clientX - tr.left) / tr.width) * 100}%`)
    tile.style.setProperty('--my', `${((e.clientY - tr.top) / tr.height) * 100}%`)
  }

  const el = wall.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
  const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
  tilt.ry = REST.ry + nx * 11
  tilt.rx = REST.rx - ny * 7
}

function onLeave() {
  tilt.rx = REST.rx
  tilt.ry = REST.ry
  active.value = null
}

const planeStyle = computed(() => ({
  transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
}))
</script>

<template>
  <div class="wall" @pointermove="onMove" @pointerleave="onLeave">
    <div ref="wall" class="wall__stage">
      <div class="wall__plane" :style="planeStyle">
        <span
          v-for="(p, i) in items"
          :key="p.repo"
          class="wall__cell"
          :style="{ '--i': i }"
        >
          <a
            class="wall__tile"
            :class="{ 'is-dim': active && active.repo !== p.repo }"
            :style="{ '--d': depth(p).toFixed(3) }"
            :href="href(p)"
            target="_blank"
            rel="noopener"
            :data-cursor-label="label(p.cat)"
            @pointerenter="active = p"
            @focus="active = p"
          >
            <span class="wall__cat"><ScrambleText :text="label(p.cat)" /></span>
            <span class="wall__name">{{ p.repo }}</span>
            <span class="wall__stars">
              <i class="wall__bar" />
              {{ stars(p) }}
            </span>
          </a>
        </span>
      </div>
    </div>

    <div class="wall__detail">
      <template v-if="active">
        <!-- keyed on the repo so moving between tiles remounts and re-decodes,
             and tuned faster than the panel labels: this one is driven by hover,
             so it has to land almost as soon as the pointer arrives -->
        <p class="wall__desc">
          <ScrambleText :key="active.repo" :text="active.desc" :scatter="13" :hold="5" />
        </p>
        <span v-if="active.source" class="wall__src">
          <ScrambleText
            :key="`${active.repo}-src`"
            :text="`Fork of ${active.source.name} · ${active.source.author} · ${active.source.license}`"
            :scatter="13"
            :hold="5"
          />
        </span>
      </template>
      <p v-else class="wall__hint"><slot name="hint" /></p>
    </div>
  </div>
</template>

<style scoped>
.wall { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }

.wall__stage { perspective: 1500px; perspective-origin: 50% 40%; }

.wall__plane {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: .55rem;
  transform-style: preserve-3d;
  transition: transform 600ms var(--ease);
  will-change: transform;
}

/* The wave lives on a wrapper so it composes with the tile's own depth and
   hover lift instead of fighting them for the transform property. Phase comes
   from the item index, so the swell travels across the wall at an angle
   rather than every tile breathing in unison. */
.wall__cell {
  display: flex;
  transform-style: preserve-3d;
  animation: wall-swell 7.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * -210ms);
  will-change: transform;
}

@keyframes wall-swell {
  0%, 100% { transform: translateZ(-11px) rotateX(1.1deg); }
  50%      { transform: translateZ(15px) rotateX(-1.1deg); }
}

.wall__tile {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: .3rem;
  padding: .7rem .75rem .6rem;
  min-height: 6.4rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-card) 82%, transparent);
  /* depth is the star count — see `depth()` */
  transform: translateZ(calc(var(--d) * 88px));
  transition: transform 420ms var(--ease), border-color var(--dur-fast) var(--ease),
              background var(--dur-fast) var(--ease), opacity var(--dur-fast) var(--ease);
  will-change: transform;
}
/* a highlight that tracks the pointer across the tile */
.wall__tile::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle 150px at var(--mx, 50%) var(--my, 50%),
    color-mix(in srgb, var(--accent) 34%, transparent),
    transparent 68%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 280ms var(--ease);
  z-index: 1;
}
.wall__tile:hover::before,
.wall__tile:focus-visible::before { opacity: 1; }

/* the further forward a tile sits, the more it catches the accent */
.wall__tile::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 62%);
  opacity: calc(var(--d) * .9);
  pointer-events: none;
  transition: opacity var(--dur-fast) var(--ease);
}

.wall__tile:hover,
.wall__tile:focus-visible {
  /* perspective alone already enlarges the lift; the explicit scale is what
     makes it land as a pick-up rather than a drift forward */
  transform: translateZ(calc(var(--d) * 88px + 96px)) scale(1.07);
  border-color: var(--accent);
  background: var(--bg-soft);
  z-index: 2;
}
.wall__tile.is-dim { opacity: .38; }

.wall__cat,
.wall__name,
.wall__stars { position: relative; z-index: 2; }

.wall__cat {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--faint);
}
.wall__name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: var(--step--1);
  line-height: 1.25;
  letter-spacing: -.01em;
  color: var(--text-hi);
  overflow-wrap: anywhere;
}
.wall__stars {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: .45rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.wall__bar {
  display: block;
  height: 2px;
  width: calc(6px + var(--d) * 34px);
  border-radius: 1px;
  background: var(--accent);
  transition: background 700ms var(--ease);
}

/* ---- detail ---- */
.wall__detail {
  min-height: 3.4rem;
  display: flex;
  flex-direction: column;
  gap: .25rem;
  max-width: 66ch;
}
.wall__desc { font-size: var(--step--1); color: var(--muted); line-height: 1.65; }
.wall__src { font-family: var(--font-mono); font-size: var(--step--2); color: var(--faint); }
.wall__hint { font-size: var(--step--1); color: var(--faint); line-height: 1.65; }

@media (max-width: 1180px) { .wall__plane { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 860px) {
  .wall__plane { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* Standing still: no perspective, no lean, no depth — an ordinary grid, with
   every tile at the same distance and the same weight. */
@media (prefers-reduced-motion: reduce) {
  .wall__stage { perspective: none; }
  .wall__plane { transform: none !important; transition: none; }
  .wall__cell { animation: none; transform: none; }
  .wall__tile { transform: none; }
  .wall__tile:hover, .wall__tile:focus-visible { transform: none; }
}
</style>
