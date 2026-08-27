<script setup lang="ts">
/**
 * The studio site's cursor, carried over: a near-rigid dot, a ring that trails,
 * and a label the ring picks up from `data-cursor-label`. Elements marked
 * `data-magnetic` lean toward the pointer.
 *
 * Only mounts where a real pointer exists and motion is welcome — on touch the
 * native behaviour is left alone.
 */

const ringEl = shallowRef<HTMLElement>()
const dotEl = shallowRef<HTMLElement>()
const labelEl = shallowRef<HTMLElement>()
const hot = ref(false)
const on = ref(false)

const HOT = 'a, button, [data-cursor-label]'

onMounted(() => {
  const fine = matchMedia('(hover: hover) and (pointer: fine)')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  if (!fine.matches || reduce.matches) return

  on.value = true
  document.body.classList.add('cursor-on')

  const p = { x: innerWidth / 2, y: innerHeight / 2, dx: 0, dy: 0, rx: 0, ry: 0 }
  p.dx = p.rx = p.x
  p.dy = p.ry = p.y

  const onMove = (e: PointerEvent) => { p.x = e.clientX; p.y = e.clientY }

  const onOver = (e: PointerEvent) => {
    const t = (e.target as Element | null)?.closest?.(HOT)
    if (!t) return
    hot.value = true
    if (labelEl.value) labelEl.value.textContent = t.getAttribute('data-cursor-label') || ''
  }

  const onOut = (e: PointerEvent) => {
    const from = (e.target as Element | null)?.closest?.(HOT)
    const to = (e.relatedTarget as Element | null)?.closest?.(HOT)
    if (from && !to) {
      hot.value = false
      if (labelEl.value) labelEl.value.textContent = ''
    }
  }

  // magnetic pull — the element leans toward the pointer and springs back
  const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'))
  const magnetMove = (m: HTMLElement) => (e: PointerEvent) => {
    const r = m.getBoundingClientRect()
    const mx = e.clientX - (r.left + r.width / 2)
    const my = e.clientY - (r.top + r.height / 2)
    m.style.transform = `translate(${mx * 0.22}px, ${my * 0.28}px)`
  }
  const magnetLeave = (m: HTMLElement) => () => { m.style.transform = '' }
  const bound = magnets.map((m) => {
    const move = magnetMove(m)
    const leave = magnetLeave(m)
    m.addEventListener('pointermove', move)
    m.addEventListener('pointerleave', leave)
    return { m, move, leave }
  })

  addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerover', onOver)
  document.addEventListener('pointerout', onOut)

  let raf = 0
  const loop = () => {
    p.dx += (p.x - p.dx) * 0.85   // the dot is nearly rigid
    p.dy += (p.y - p.dy) * 0.85
    p.rx += (p.x - p.rx) * 0.16   // the ring trails behind
    p.ry += (p.y - p.ry) * 0.16
    if (dotEl.value) dotEl.value.style.transform = `translate(${p.dx}px, ${p.dy}px) translate(-50%, -50%)`
    if (ringEl.value) ringEl.value.style.transform = `translate(${p.rx}px, ${p.ry}px) translate(-50%, -50%)`
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
    bound.forEach(({ m, move, leave }) => {
      m.removeEventListener('pointermove', move)
      m.removeEventListener('pointerleave', leave)
      m.style.transform = ''
    })
    document.body.classList.remove('cursor-on')
  })
})
</script>

<template>
  <div v-show="on" class="cur" :class="{ 'is-hot': hot }" aria-hidden="true">
    <div ref="ringEl" class="cur__ring"><span ref="labelEl" /></div>
    <div ref="dotEl" class="cur__dot" />
  </div>
</template>

<style scoped>
.cur {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  pointer-events: none;
}

.cur__dot,
.cur__ring {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  will-change: transform;
}

.cur__dot {
  width: 5px;
  height: 5px;
  background: var(--accent);
  transition: background 700ms var(--ease);
}

.cur__ring {
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
  display: grid;
  place-items: center;
  transition: width var(--dur-mid) var(--ease), height var(--dur-mid) var(--ease),
              border-color 700ms var(--ease), background var(--dur-mid) var(--ease);
}

.cur__ring span {
  font-family: var(--font-mono);
  font-size: .6rem;
  letter-spacing: .08em;
  color: var(--accent-ink);
  opacity: 0;
  white-space: nowrap;
  transition: opacity var(--dur-fast) var(--ease);
}

.cur.is-hot .cur__ring {
  width: 56px;
  height: 56px;
  background: color-mix(in srgb, var(--accent) 88%, transparent);
  border-color: transparent;
}
.cur.is-hot .cur__ring span { opacity: 1; }

@media (hover: none), (pointer: coarse) { .cur { display: none; } }
@media (prefers-reduced-motion: reduce) { .cur { display: none; } }
</style>
