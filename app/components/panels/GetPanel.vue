<script setup lang="ts">
import type { RepoFacts, Release } from '~/composables/useCatalog'

/**
 * Pick a repository and a version; get the clone line and the download.
 *
 * Every URL here is composed from the registry rather than hand-written, so a
 * new release becomes selectable the next time the sync runs.
 */

const props = defineProps<{ repos: RepoFacts[]; prebuilt: number }>()
const { t } = useI18n()

const OWNER = 'TypeDreamMoon'

const repoName = ref(props.repos[0]?.repo ?? '')
const repo = computed(() => props.repos.find((r) => r.repo === repoName.value) ?? props.repos[0])

/** the default branch is always offered, tags on top of it */
const versions = computed(() => {
  const r = repo.value
  if (!r) return []
  const branch = r.defaultBranch ?? 'main'
  return [
    { id: `branch:${branch}`, label: branch, hint: t('get.latestSource'), tag: null as string | null },
    ...(r.releases ?? []).map((rel) => ({
      id: `tag:${rel.tag}`,
      label: rel.tag,
      hint: rel.prerelease ? 'pre-release' : undefined,
      tag: rel.tag,
    })),
  ]
})

const repoOptions = computed(() =>
  props.repos.map((r) => ({ value: r.repo, label: r.repo, hint: r.stars ? `★ ${r.stars}` : undefined })),
)
const versionOptions = computed(() =>
  versions.value.map((v) => ({ value: v.id, label: v.label, hint: v.hint })),
)

const versionId = ref('')
// a repo change invalidates the selection — fall back to its newest entry
watch(versions, (list) => {
  if (!list.some((v) => v.id === versionId.value)) versionId.value = list[1]?.id ?? list[0]?.id ?? ''
}, { immediate: true })

const version = computed(() => versions.value.find((v) => v.id === versionId.value) ?? versions.value[0])
const release = computed<Release | undefined>(() =>
  version.value?.tag ? repo.value?.releases?.find((r) => r.tag === version.value!.tag) : undefined,
)

const command = computed(() => {
  const r = repo.value
  if (!r) return ''
  const ref = version.value?.tag ?? r.defaultBranch ?? 'main'
  return `git clone --depth 1 --branch ${ref} https://github.com/${OWNER}/${r.repo}.git Plugins/${r.repo}`
})

const sourceZip = computed(() => {
  const r = repo.value
  if (!r) return ''
  return version.value?.tag
    ? `https://github.com/${OWNER}/${r.repo}/archive/refs/tags/${version.value.tag}.zip`
    : `https://github.com/${OWNER}/${r.repo}/archive/refs/heads/${r.defaultBranch ?? 'main'}.zip`
})

/** a packaged build, where the release actually ships one */
const asset = computed(() => release.value?.assets?.[0])

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`)

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(command.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 1600)
  } catch {
    // clipboard is blocked outside a secure context; the line is selectable
    copied.value = false
  }
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>

<template>
  <div class="get">
    <!-- data-keys keeps the deck's arrow-key paging out of the selects -->
    <div class="get__picks rise" data-keys>
      <DropSelect v-model="repoName" :options="repoOptions" :label="t('get.plugin')" />
      <DropSelect v-model="versionId" :options="versionOptions" :label="t('get.version')" />
    </div>

    <div class="get__cmd rise">
      <code><b>$</b> {{ command }}</code>
      <button type="button" class="get__copy" @click="copy">
        {{ copied ? t('get.copied') : t('get.copy') }}
      </button>
    </div>

    <div class="get__acts rise">
      <a v-if="asset" class="cta" :href="asset.url" :download="asset.name">
        {{ t('get.pkg') }} · {{ kb(asset.size) }}
      </a>
      <a class="cta" :class="{ 'cta--line': !!asset }" :href="sourceZip">
        {{ t('get.zip') }}
      </a>
      <a v-if="release" class="cta cta--line" :href="release.url" target="_blank" rel="noopener">
        {{ t('get.notes') }}
      </a>
    </div>

    <p class="get__note rise">
      <b>{{ t('get.noteTitle') }}</b>
      {{ t('get.noteBody', { prebuilt: prebuilt, total: repos.length }) }}
    </p>
  </div>
</template>

<style scoped>
.get { display: flex; flex-direction: column; gap: clamp(.9rem, 2vh, 1.4rem); }

.get__picks { display: flex; flex-wrap: wrap; gap: .8rem; }

.get__cmd {
  display: flex;
  align-items: center;
  gap: .8rem;
  padding: .75rem .9rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-slab);
  max-width: 100%;
}
.get__cmd code {
  font-family: var(--font-mono);
  font-size: clamp(.7rem, .62rem + .34vw, .85rem);
  color: var(--muted);
  overflow-x: auto;
  white-space: nowrap;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}
.get__cmd b { color: var(--accent); font-weight: 400; transition: color 700ms var(--ease); }

.get__copy {
  flex: none;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-sm);
  padding: .35rem .7rem;
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
}
.get__copy:hover { color: var(--accent); border-color: var(--accent); }

.get__acts { display: flex; flex-wrap: wrap; gap: .65rem; }

.get__note {
  font-size: var(--step--2);
  color: var(--muted);
  line-height: 1.7;
  max-width: 62ch;
  border-left: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
  padding-left: .8rem;
}
.get__note b {
  color: var(--accent);
  font-weight: 500;
  transition: color 700ms var(--ease);
}

@media (max-width: 640px) {
  .get__picks { flex-direction: column; align-items: stretch; }
}
</style>
