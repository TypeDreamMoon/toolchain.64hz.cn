<script setup lang="ts">
/**
 * A listbox that looks like the rest of the page.
 *
 * A native <select> paints its popup with the operating system's own widget —
 * on a dark, mono-typed panel that lands as a foreign object, and no amount of
 * styling reaches inside it. This keeps the keyboard contract (arrows, Home,
 * End, Enter, Escape, type-ahead) and gives up nothing but the OS chrome.
 */

export interface DropOption {
  value: string
  label: string
  /** trailing detail, dimmed — star counts, pre-release markers */
  hint?: string
}

const props = defineProps<{
  modelValue: string
  options: DropOption[]
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)
const activeIndex = ref(0)
const rootEl = shallowRef<HTMLElement>()
const listEl = shallowRef<HTMLElement>()

const uid = useId()
const selected = computed(() => props.options.find((o) => o.value === props.modelValue))
const selectedIndex = computed(() => props.options.findIndex((o) => o.value === props.modelValue))

function show() {
  open.value = true
  activeIndex.value = Math.max(0, selectedIndex.value)
  nextTick(scrollActiveIntoView)
}

function hide() {
  open.value = false
}

function choose(i: number) {
  const opt = props.options[i]
  if (!opt) return
  emit('update:modelValue', opt.value)
  hide()
}

function move(delta: number) {
  const n = props.options.length
  if (!n) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(scrollActiveIntoView)
}

function scrollActiveIntoView() {
  listEl.value?.querySelector<HTMLElement>('[data-active="true"]')
    ?.scrollIntoView({ block: 'nearest' })
}

/** type-ahead, the way a native select behaves */
let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined
function typeAhead(key: string) {
  typed += key.toLowerCase()
  clearTimeout(typedTimer)
  typedTimer = setTimeout(() => { typed = '' }, 700)
  const hit = props.options.findIndex((o) => o.label.toLowerCase().startsWith(typed))
  if (hit >= 0) {
    activeIndex.value = hit
    if (!open.value) choose(hit)
    else nextTick(scrollActiveIntoView)
  }
}

function onKey(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); open.value ? move(1) : show(); break
    case 'ArrowUp': e.preventDefault(); open.value ? move(-1) : show(); break
    case 'Home': if (open.value) { e.preventDefault(); activeIndex.value = 0; nextTick(scrollActiveIntoView) } break
    case 'End': if (open.value) { e.preventDefault(); activeIndex.value = props.options.length - 1; nextTick(scrollActiveIntoView) } break
    case 'Enter':
    case ' ': e.preventDefault(); open.value ? choose(activeIndex.value) : show(); break
    case 'Escape': if (open.value) { e.preventDefault(); hide() } break
    case 'Tab': hide(); break
    default:
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); typeAhead(e.key) }
  }
}

function onDocPointer(e: PointerEvent) {
  if (open.value && !rootEl.value?.contains(e.target as Node)) hide()
}

onMounted(() => document.addEventListener('pointerdown', onDocPointer))
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer)
  clearTimeout(typedTimer)
})

// a changed option set can leave the highlight past the end
watch(() => props.options, () => { activeIndex.value = Math.max(0, selectedIndex.value) })
</script>

<template>
  <div ref="rootEl" class="drop" :class="{ 'is-open': open }">
    <span :id="`${uid}-label`" class="drop__k">{{ label }}</span>

    <button
      type="button"
      class="drop__btn"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="`${uid}-list`"
      :aria-labelledby="`${uid}-label`"
      aria-haspopup="listbox"
      @click="open ? hide() : show()"
      @keydown="onKey"
    >
      <span class="drop__value">{{ selected?.label ?? '—' }}</span>
      <span v-if="selected?.hint" class="drop__hint">{{ selected.hint }}</span>
      <svg class="drop__chev" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <ul
      v-show="open"
      :id="`${uid}-list`"
      ref="listEl"
      class="drop__list"
      role="listbox"
      :aria-labelledby="`${uid}-label`"
      data-scroll
    >
      <li
        v-for="(o, i) in options"
        :key="o.value"
        class="drop__opt"
        role="option"
        :aria-selected="o.value === modelValue"
        :data-active="i === activeIndex"
        @pointerenter="activeIndex = i"
        @click="choose(i)"
      >
        <span class="drop__optLabel">{{ o.label }}</span>
        <span v-if="o.hint" class="drop__optHint">{{ o.hint }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.drop { position: relative; display: flex; flex-direction: column; gap: .35rem; min-width: 0; }

.drop__k {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--faint);
}

.drop__btn {
  display: flex;
  align-items: center;
  gap: .6rem;
  width: 100%;
  min-width: 17rem;
  padding: .6rem .8rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
  background: var(--bg-slab);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-sm);
  text-align: left;
  transition: border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.drop__btn:hover { border-color: var(--accent); }
.drop.is-open .drop__btn { border-color: var(--accent); background: var(--bg-soft); }

.drop__value { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drop__hint { color: var(--faint); flex: none; }

.drop__chev {
  width: 10px;
  height: 6px;
  flex: none;
  color: var(--muted);
  transition: transform var(--dur-mid) var(--ease), color var(--dur-fast) var(--ease);
}
.drop.is-open .drop__chev { transform: rotate(180deg); color: var(--accent); }

.drop__list {
  position: absolute;
  z-index: 20;
  top: calc(100% + .35rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: .25rem;
  list-style: none;
  /* capped and scrollable: twenty-five repositories will not fit a panel that
     clips, and `data-scroll` is what lets the deck's wheel handler pass the
     event down instead of paging */
  max-height: 15rem;
  overflow-y: auto;
  background: var(--bg-soft);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  box-shadow: 0 18px 44px rgb(0 0 0 / .55);
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}
.drop__list::-webkit-scrollbar { width: 6px; }
.drop__list::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 3px; }

.drop__opt {
  display: flex;
  align-items: baseline;
  gap: .6rem;
  padding: .42rem .6rem;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--muted);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.drop__opt[data-active='true'] { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--text); }
.drop__opt[aria-selected='true'] { color: var(--accent); }
.drop__opt[aria-selected='true']::after { content: '·'; }

.drop__optLabel { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drop__optHint { color: var(--faint); flex: none; font-size: var(--step--2); }

@media (max-width: 640px) {
  .drop { width: 100%; }
  .drop__btn { min-width: 0; }
}
</style>
