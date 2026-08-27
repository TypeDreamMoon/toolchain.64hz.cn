<script setup lang="ts">
/**
 * Four channel thumbnails for DreamTexture. One cheap value-noise field read
 * four different ways — a stand-in until real ComfyUI output exists to show.
 */
const CHANNELS = ['base', 'normal', 'rough', 'ao'] as const
const LABELS: Record<(typeof CHANNELS)[number], string> = {
  base: 'BASECOLOR',
  normal: 'NORMAL',
  rough: 'ROUGHNESS',
  ao: 'AO',
}

const root = shallowRef<HTMLElement>()

onMounted(() => {
  const N = 72
  const val = (x: number, y: number) =>
    (Math.sin(x * 0.21) * Math.cos(y * 0.17) + Math.sin((x + y) * 0.09) * 0.7 + 1.7) / 3.4

  root.value?.querySelectorAll<HTMLCanvasElement>('canvas').forEach((c) => {
    const k = c.dataset.chan as (typeof CHANNELS)[number]
    c.width = N
    c.height = N
    const cx = c.getContext('2d')
    if (!cx) return
    const im = cx.createImageData(N, N)
    const d = im.data
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4
        const v = val(x, y)
        let R: number, G: number, B: number
        if (k === 'base') { R = 150 * v + 40; G = 120 * v + 34; B = 96 * v + 30 }
        else if (k === 'normal') { R = 128 + (val(x + 1, y) - v) * 620; G = 128 + (val(x, y + 1) - v) * 620; B = 235 }
        else if (k === 'rough') { R = G = B = 60 + v * 150 }
        else { R = G = B = 210 - (1 - v) ** 2 * 190 }
        d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255
      }
    }
    cx.putImageData(im, 0, 0)
  })
})
</script>

<template>
  <div ref="root" class="chans">
    <div v-for="k in CHANNELS" :key="k" class="chan">
      <canvas :data-chan="k" />
      <span>{{ LABELS[k] }}</span>
    </div>
  </div>
</template>

<style scoped>
.chans { display: grid; grid-template-columns: repeat(4, 1fr); gap: .65rem; }

.chan {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: .55rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .06em;
  color: var(--faint);
}
.chan canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: .5;
  transition: opacity var(--dur-mid) var(--ease), transform 620ms var(--ease);
}
.chan:hover canvas { opacity: .95; transform: scale(1.06); }
.chan span { position: relative; }

@media (max-width: 860px) { .chans { grid-template-columns: repeat(2, 1fr); } }
</style>
