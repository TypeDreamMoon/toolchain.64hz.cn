<script setup lang="ts">
/** One flagship: copy on the left, a product-specific visual in the slot. */
const props = defineProps<{ product: any }>()
const { t } = useI18n()

const pills = computed(() => {
  const f = props.product.facts
  const out: { label: string; on?: boolean }[] = []
  if (f?.release?.tag) out.push({ label: f.release.tag, on: true })
  if (typeof f?.stars === 'number' && f.stars > 0) out.push({ label: `★ ${f.stars}` })
  for (const p of props.product.pills ?? []) out.push({ label: p })
  if (!f && props.product.status === 'planned') out.unshift({ label: props.product.copy.kind, on: true })
  return out
})
</script>

<template>
  <div class="panel__inner prod">
    <div class="prod__copy">
      <div class="prod__head rise">
        <span class="tag"><ScrambleText :text="`(${product.copy.tag})`" /></span>
        <h2 v-split class="display">{{ product.name }}</h2>
        <p class="sub"><ScrambleText :text="product.kicker" /></p>
      </div>

      <!-- eslint-disable-next-line vue/no-v-html -- copy is authored in content/products.json, not user input -->
      <p class="body-copy rise" v-html="product.copy.lede" />

      <div class="prod__facts rise">
        <div v-for="f in product.copy.facts" :key="f.k" class="prod__fact">
          <b>{{ f.k }}</b><span>{{ f.v }}</span>
        </div>
      </div>

      <div class="prod__meta rise">
        <span v-for="p in pills" :key="p.label" class="pill" :class="{ 'pill--on': p.on }">{{ p.label }}</span>
      </div>

      <div class="prod__actions rise">
        <a v-if="product.docs" class="cta" :href="product.docs" data-magnetic data-cursor-label="→">{{ t('product.docs') }}</a>
        <a class="cta cta--line" href="#" data-magnetic>
          {{ product.docs ? t('product.reference') : t('product.subscribe') }}
        </a>
      </div>
    </div>

    <div class="rise"><slot name="visual" /></div>
  </div>
</template>

<style scoped>
.prod {
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
}
.prod__copy { display: flex; flex-direction: column; gap: 1.3rem; }
.prod__head { display: flex; flex-direction: column; gap: .5rem; perspective: 700px; }

.prod__facts {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  border-left: 1px solid var(--line);
  padding-left: 1.05rem;
}
.prod__fact { display: flex; gap: .8rem; font-size: var(--step--1); color: var(--muted); }
.prod__fact b {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--accent);
  font-weight: 500;
  letter-spacing: .06em;
  flex: none;
  width: 4.4rem;
  padding-top: .16rem;
  transition: color 700ms var(--ease);
}

.prod__meta { display: flex; flex-wrap: wrap; gap: .42rem; }
.prod__actions { display: flex; flex-wrap: wrap; gap: .65rem; }

@media (max-width: 1080px) {
  .prod { grid-template-columns: 1fr; }
}
</style>
