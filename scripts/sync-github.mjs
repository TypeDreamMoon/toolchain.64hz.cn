#!/usr/bin/env node
/**
 * Merge live GitHub facts into content/generated/registry.json.
 *
 *   content/products.json  ─┐
 *   content/plugins.json   ─┼─→ registry.json ─→ the Nuxt build
 *   GitHub REST            ─┘
 *
 * registry.json is committed. That way a clone builds with no token and no
 * network, `git log` shows when a star count or a version actually moved, and
 * a push-triggered deploy and a cron-triggered deploy render the same numbers.
 *
 * Auth is optional: set GITHUB_TOKEN to lift the 60/hour anonymous rate limit
 * (Actions provides one automatically).
 *
 *   pnpm sync:github
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OWNER = 'TypeDreamMoon'
const OUT = resolve(ROOT, 'content/generated/registry.json')

const token = process.env.GITHUB_TOKEN?.trim()
const headers = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'hertz-toolchain-sync',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
}

let failures = 0

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (res.status === 404) return null // no release yet, or a repo we do not own
  if (!res.ok) {
    const hint = res.status === 403 && !token ? ' (rate limited — set GITHUB_TOKEN)' : ''
    throw new Error(`GitHub ${res.status} on ${path}${hint}`)
  }
  return res.json()
}

async function fetchRepo(name) {
  const repo = await api(`/repos/${OWNER}/${name}`)
  if (!repo) return { repo: name, missing: true }

  const release = await api(`/repos/${OWNER}/${name}/releases/latest`)

  return {
    repo: name,
    url: repo.html_url,
    description: repo.description ?? null,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    topics: repo.topics ?? [],
    license: repo.license?.spdx_id ?? null,
    pushedAt: repo.pushed_at ?? null,
    archived: Boolean(repo.archived),
    release: release
      ? {
          tag: release.tag_name,
          name: release.name || release.tag_name,
          publishedAt: release.published_at,
          url: release.html_url,
        }
      : null,
  }
}

async function main() {
  const products = JSON.parse(await readFile(resolve(ROOT, 'content/products.json'), 'utf8'))
  const plugins = JSON.parse(await readFile(resolve(ROOT, 'content/plugins.json'), 'utf8'))

  const names = [
    ...products.flagships.map((p) => p.repo),
    ...plugins.items.map((p) => p.repo),
    // the ecosystem pieces that carry their own versions
    'dreamshader-language-support',
    'dreamfx-language-support',
    'dream-mcp',
    'dreamshader-blender',
    'dreamshader-package-index',
  ].filter(Boolean)

  const unique = [...new Set(names)]
  console.log(`Syncing ${unique.length} repositories${token ? '' : ' (anonymous — 60/hour)'}…`)

  const repos = {}
  for (const name of unique) {
    try {
      repos[name] = await fetchRepo(name)
      const r = repos[name]
      console.log(`  ${name.padEnd(30)} ★ ${String(r.stars ?? '-').padStart(3)}  ${r.release?.tag ?? '—'}`)
    } catch (err) {
      failures++
      console.warn(`  ${name.padEnd(30)} FAILED — ${err.message}`)
    }
  }

  // A partial sync would silently blank out numbers the site already shows, so
  // keep the committed registry and let the build use it instead.
  if (failures > 0 && existsSync(OUT)) {
    console.error(`\n${failures} repository/repositories failed. Keeping the existing registry.json unchanged.`)
    process.exit(1)
  }
  if (failures > 0) {
    console.error(`\n${failures} repository/repositories failed and there is no registry to fall back to.`)
    process.exit(1)
  }

  const totalStars = Object.values(repos).reduce((n, r) => n + (r.stars ?? 0), 0)

  const registry = {
    generatedAt: new Date().toISOString(),
    owner: OWNER,
    totals: { repos: unique.length, stars: totalStars },
    repos,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  console.log(`\nWrote ${OUT}\n  ${unique.length} repos · ${totalStars} stars total`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
