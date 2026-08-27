import productsRaw from '~~/content/products.json'
import pluginsRaw from '~~/content/plugins.json'
import registryRaw from '~~/content/generated/registry.json'

/**
 * The catalog: hand-written copy from content/*.json joined to the live GitHub
 * facts in content/generated/registry.json.
 *
 * All three are imported, so the join happens at build time and the rendered
 * HTML carries the numbers — no request, no loading state, no rate limit.
 */

export interface ReleaseAsset { name: string; url: string; size: number }

export interface Release {
  tag: string
  name: string
  publishedAt: string
  url: string
  prerelease: boolean
  assets: ReleaseAsset[]
}

export interface RepoFacts {
  repo: string
  url?: string
  description?: string | null
  stars?: number
  license?: string | null
  pushedAt?: string | null
  defaultBranch?: string
  releases?: Release[]
  release?: { tag: string; name: string; publishedAt: string; url: string } | null
  missing?: boolean
}

export interface Fact { k: string; v: string }
export interface FlagshipCopy { tag: string; kind: string; lede: string; facts: Fact[] }

export interface Flagship {
  id: string
  repo: string | null
  name: string
  kicker: string
  accent: string
  status: 'stable' | 'planned'
  pills: string[]
  docs: string | null
  /** the second button: a deeper reference, or somewhere to follow along */
  secondary: string
  sample?: { file: string; lang: string; note: string }
  copy: FlagshipCopy
  facts: RepoFacts | null
}

export interface ForkSource { name: string; author: string; license: string; url: string }

export interface PluginItem {
  repo: string
  cat: string
  desc: string
  source: ForkSource | null
  todo: boolean
  facts: RepoFacts | null
}

export interface Category { id: string; label: string; count: number }

type Lang = 'zh' | 'en'
type RawFlagship = Omit<Flagship, 'copy' | 'facts'> & Record<Lang, FlagshipCopy>
type RawPlugin = { repo: string; cat: string; source?: ForkSource; todo?: boolean } & Record<Lang, string>
type RawCategory = { id: string } & Record<Lang, string>

const registry = registryRaw as {
  generatedAt: string
  owner: string
  totals: { repos: number; stars: number }
  repos: Record<string, RepoFacts>
}

const products = productsRaw as unknown as { flagships: RawFlagship[] }
const plugins = pluginsRaw as unknown as { categories: RawCategory[]; items: RawPlugin[] }

export function useCatalog() {
  const { locale } = useI18n()
  const lang = computed<Lang>(() => (locale.value === 'en' ? 'en' : 'zh'))

  const facts = (repo: string | null | undefined): RepoFacts | null =>
    repo ? (registry.repos[repo] ?? null) : null

  /** Flagships, each carrying its localised copy and its live repo facts. */
  const flagships = computed<Flagship[]>(() =>
    products.flagships.map((p) => ({
      ...p,
      copy: p[lang.value],
      facts: facts(p.repo),
    })),
  )

  const pluginItems = computed<PluginItem[]>(() =>
    plugins.items.map((p) => ({
      repo: p.repo,
      cat: p.cat,
      desc: p[lang.value],
      source: p.source ?? null,
      todo: Boolean(p.todo),
      facts: facts(p.repo),
    })),
  )

  const categories = computed<Category[]>(() =>
    plugins.categories.map((c) => ({
      id: c.id,
      label: c[lang.value],
      count: plugins.items.filter((p) => p.cat === c.id).length,
    })),
  )

  /** Everything the release board shows, newest first. */
  const releases = computed(() =>
    Object.values(registry.repos)
      .filter((r): r is RepoFacts & { release: NonNullable<RepoFacts['release']> } => Boolean(r.release))
      .sort((a, b) => Date.parse(b.release.publishedAt) - Date.parse(a.release.publishedAt)),
  )

  /**
   * Everything the get-it panel can hand you, flagships first and then by
   * stars. Anything the sync could not reach is dropped rather than offered
   * as a broken download.
   */
  const downloads = computed(() => {
    const order = products.flagships.map((p: RawFlagship) => p.repo).filter(Boolean) as string[]
    return Object.values(registry.repos)
      .filter((r) => !r.missing)
      .sort((a, b) => {
        const ia = order.indexOf(a.repo)
        const ib = order.indexOf(b.repo)
        if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
        return (b.stars ?? 0) - (a.stars ?? 0)
      })
  })

  /** How many of them ship a built package — the rest are source only. */
  const prebuiltCount = computed(
    () => downloads.value.filter((r) => r.releases?.some((rel) => rel.assets.length)).length,
  )

  return {
    lang,
    downloads,
    prebuiltCount,
    flagships,
    pluginItems,
    categories,
    releases,
    totals: registry.totals,
    generatedAt: registry.generatedAt,
    pluginCount: plugins.items.length,
    facts,
  }
}
