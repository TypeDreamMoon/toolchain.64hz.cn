<script setup lang="ts">
/**
 * A typewriter that arrives out of order.
 *
 * Each character gets its own random reveal frame, so the string resolves in
 * a scatter rather than left to right. Latin characters cycle through glyphs
 * on the way in — the decoding-readout look — while CJK simply holds back,
 * because substituting random Han characters reads as corruption, not as
 * machinery warming up.
 *
 * It runs when the panel around it becomes live (see DeckPanel's provide), so
 * paging back to a panel plays it again.
 */

const props = withDefaults(
  defineProps<{
    text: string
    /** frames of glyph-cycling per character before it settles */
    hold?: number
    /** how far apart characters can start, in frames */
    scatter?: number
  }>(),
  { hold: 8, scatter: 26 },
)

const GLYPHS = '01<>[]{}/\\|=+*#%&$@ABCDEFGHIJKLMNOPQRSTUVWXYZ'
// CJK gets blocks rather than random Han: substituting real characters reads as
// corruption, and an empty placeholder collapses the label's width and then
// springs it back open.
const BLOCKS = '░▒▓'
const isLatin = (c: string) => c.charCodeAt(0) < 0x2e80
const glyph = (c: string) =>
  isLatin(c)
    ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!
    : BLOCKS[Math.floor(Math.random() * BLOCKS.length)]!

const out = ref(props.text)
const live = inject<Ref<boolean>>('panelLive', ref(true))
const reduce = ref(false)

let raf = 0
let bail: ReturnType<typeof setTimeout> | undefined

function settle() {
  cancelAnimationFrame(raf)
  clearTimeout(bail)
  out.value = props.text
}

function run() {
  cancelAnimationFrame(raf)
  clearTimeout(bail)
  const chars = [...props.text]
  if (reduce.value || !chars.length) {
    out.value = props.text
    return
  }

  // one random settle frame per character — this is what scatters the arrival
  const to = chars.map(
    () => Math.floor(Math.random() * props.scatter) + Math.floor(Math.random() * props.hold) + 3,
  )

  let frame = 0
  const tick = () => {
    let settled = 0
    out.value = chars
      .map((c, i) => {
        if (c === ' ') return ' '
        if (frame >= to[i]!) { settled++; return c }
        return glyph(c)
      })
      .join('')

    frame++
    if (settled < chars.length) raf = requestAnimationFrame(tick)
    else settle()
  }
  // requestAnimationFrame is paused in a background tab, so without this the
  // label would be left mid-scramble — unreadable — until the tab is looked at
  // again. Whatever happens, the text resolves.
  bail = setTimeout(settle, 1500)

  // paint the first frame synchronously — going through rAF leaves the settled
  // text on screen for a beat, so the effect reads as a flicker after the fact
  tick()
}

onMounted(() => {
  reduce.value = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (live.value) run()
})

watch(live, (on) => { if (on) run() })
watch(() => props.text, () => {
  if (live.value) run()
  else out.value = props.text
})

onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(bail) })
</script>

<template><span :aria-label="text"><span aria-hidden="true">{{ out }}</span></span></template>
