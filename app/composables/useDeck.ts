/**
 * The deck: one panel per viewport, paged by wheel / key / touch.
 *
 * Two modes, decided by viewport size and the user's motion preference:
 *   deck  — panels are pinned and the rail translates between them
 *   flow  — ordinary document scroll, because a panel taller than the
 *           viewport would otherwise be clipped with no way to reach it
 *
 * The active panel drives `--accent`, which every accented rule transitions,
 * so paging walks the colour through the DreamUnrealThemes families.
 */

export interface DeckPanel {
  /** stable id, also the element id and the hash target */
  id: string
  /** i18n key for the rail label */
  key: string
  /** hex, written to `--accent` while this panel is live */
  accent: string
}

export const PANELS: DeckPanel[] = [
  { id: 'home', key: 'panel.home', accent: '#ffc62e' },
  { id: 'shader', key: 'panel.shader', accent: '#ffc62e' },
  { id: 'fx', key: 'panel.fx', accent: '#ff5c35' },
  { id: 'texture', key: 'panel.texture', accent: '#ff7aa8' },
  { id: 'plugins', key: 'panel.plugins', accent: '#4a9eff' },
  { id: 'ecosystem', key: 'panel.ecosystem', accent: '#39c5bb' },
  { id: 'start', key: 'panel.start', accent: '#ffc62e' },
]

/**
 * A deck needs room. Below this the panels are genuinely taller than the
 * viewport, and no amount of tightening fixes that — so the page becomes an
 * ordinary scrolling document instead of clipping content nobody can reach.
 */
const DECK_MIN = '(min-width: 861px) and (min-height: 720px)'
const TURN_MS = 900

export function useDeck() {
  const index = useState('deck-index', () => 0)
  const deckOn = useState('deck-on', () => false)
  /** decays to 0 each frame; the shader reads it as a hit on every page turn */
  const energy = useState('deck-energy', () => 0)
  /** timestamp the dither dissolve started, or -1 */
  const wipeAt = useState('deck-wipe', () => -1)

  const current = computed(() => PANELS[index.value]!)
  const accent = computed(() => current.value.accent)

  let locked = false
  let unlockTimer: ReturnType<typeof setTimeout> | undefined

  function go(next: number) {
    const i = Math.max(0, Math.min(PANELS.length - 1, next))
    if (i === index.value) return
    index.value = i

    if (deckOn.value) {
      locked = true
      clearTimeout(unlockTimer)
      unlockTimer = setTimeout(() => { locked = false }, TURN_MS)
      energy.value = 1
      wipeAt.value = performance.now()
    } else {
      document.getElementById(PANELS[i]!.id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isLocked = () => locked

  return { PANELS, index, deckOn, energy, wipeAt, current, accent, go, isLocked, DECK_MIN, TURN_MS }
}
