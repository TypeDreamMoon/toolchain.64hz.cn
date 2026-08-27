/**
 * v-split — wraps each character of an element's text in a `.ch` span carrying
 * its index, so CSS can stagger a per-character reveal.
 *
 * The split happens on mount, so the prerendered HTML carries the heading as
 * plain text — better for search engines, and there is nothing to flash because
 * `.ch` is only hidden once `body.deck-on` exists, which is also client-side.
 *
 * The original string is kept on `aria-label` and the spans are hidden from the
 * accessibility tree, so a screen reader still reads one heading.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('split', {
    mounted(el: HTMLElement) {
      if (el.dataset.split === 'done') return
      const text = el.textContent ?? ''
      if (!text) return

      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text)
      el.textContent = ''

      let i = 0
      // iterate by code point so surrogate pairs stay whole
      for (const c of text) {
        const s = document.createElement('span')
        const isSpace = c === ' '
        s.className = isSpace ? 'ch ch--sp' : 'ch'
        s.style.setProperty('--i', String(i++))
        s.setAttribute('aria-hidden', 'true')
        s.textContent = isSpace ? ' ' : c
        el.appendChild(s)
      }
      el.dataset.split = 'done'
    },
  })
})
