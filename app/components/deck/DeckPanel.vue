<script setup lang="ts">
/**
 * One panel of the deck. In deck mode it is exactly one viewport tall and
 * clips; in flow mode it grows and the page scrolls normally.
 *
 * Children marked `.rise` animate in when this panel becomes live.
 */

const props = defineProps<{ id: string }>()

const { PANELS, index, deckOn } = useDeck()
const live = computed(() => PANELS[index.value]?.id === props.id)
</script>

<template>
  <section :id="props.id" class="panel" :class="{ 'is-live': live, 'is-deck': deckOn }">
    <slot />
  </section>
</template>

<style scoped>
.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(5rem, 11vh, 7.5rem) var(--pad) clamp(3.5rem, 8vh, 5.5rem);
  min-height: 100vh;
  border-top: 1px solid var(--line);
}

/* Local for the same reason as .deck.is-deck — see the note in TheDeck.vue. */
.panel.is-deck {
  height: 100vh;
  min-height: 0;
  border-top: 0;
  overflow: hidden;
  /* depth on the seam — the panel leaving sinks back, the way the studio
     site's stacking panels do */
  transition: transform var(--deck-turn) var(--ease), filter var(--deck-turn) var(--ease);
  transform-origin: center;
}
.panel.is-deck:not(.is-live) {
  transform: scale(.945);
  filter: brightness(.5);
}

@media (max-width: 860px) {
  .panel {
    min-height: auto;
    padding-block: clamp(4rem, 12vh, 6rem);
  }
}
</style>
