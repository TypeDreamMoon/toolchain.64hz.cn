# 64Hz Toolchain

The portal for the 64Hz Unreal Engine toolchain — [toolchain.64hz.cn](https://toolchain.64hz.cn).

A seven-panel deck: the three languages (DreamShader, DreamFX, DreamTexture) get
a panel each, the plugin library and the ecosystem get one each, and the accent
colour walks the DreamUnrealThemes families as you page through.

Documentation stays where it already lives — [shader.toolchain.64hz.cn](https://shader.toolchain.64hz.cn)
and [fx.toolchain.64hz.cn](https://fx.toolchain.64hz.cn). This site is the front
door, not a second copy of the docs.

## Requirements

**Node 22.19+ or 24.11+.** Nuxt 4.5 declares
`^22.19.0 || ^24.11.0 || >=26.0.0`, and on Node 20 the build fails inside undici
with `webidl.util.markAsUncloneable is not a function`. pnpm 10.

```bash
nvm use 24.20.0
pnpm install
pnpm dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | `nuxt generate` — prerenders to `dist/` |
| `pnpm preview` | Serve the built output |
| `pnpm typecheck` | `vue-tsc` over the project |
| `pnpm sync:github` | Refresh `content/generated/registry.json` from the GitHub API |

## Content

Copy is hand-written; numbers are not.

```
content/products.json   flagship copy, zh + en          ─┐
content/plugins.json    the plugin matrix, zh + en      ─┼─→ registry.json ─→ build
GitHub REST (stars, releases, licences, topics)         ─┘
```

`scripts/sync-github.mjs` merges the two and writes
`content/generated/registry.json`, **which is committed**. A clone therefore
builds with no token and no network; `git log` shows exactly when a star count
or a version moved; and a push-triggered deploy renders the same numbers a
cron-triggered one does.

The sync refuses to write a partial result — if any repo fails it keeps the
committed registry and exits non-zero, rather than silently blanking numbers
the site already shows.

Set `GITHUB_TOKEN` to lift the 60/hour anonymous rate limit:

```bash
GITHUB_TOKEN=$(gh auth token) pnpm sync:github
```

## Design

`app/assets/css/tokens.css` is the single source of truth for colour, type,
space, radius and motion. Ground, ink and the type ramp come from
[hertz-games](https://github.com/hertz-games/hertz-games-web)`/src/style.css` so
the two sites read as one house; the accent families are named the way
`DreamUnrealThemes` names its editor themes.

Everything animated on the page is a real-time rendering technique, because
that is what the toolchain is for:

- `ShaderField.vue` — a WebGL2 fbm trace field plus 64 spectrum bins, sampled
  three times along the pointer vector so the channels separate into a
  chromatic-aberration lens. Falls back to a canvas 2D field without WebGL2.
- The page turn is an ordered 4×4 Bayer dither dissolve on chunky pixels.
- `v-split` staggers headings per character; `CustomCursor.vue` carries the
  studio site's cursor and magnetic hover.

All of it degrades: below 861×620, or under `prefers-reduced-motion`, the deck
becomes an ordinary scrolling page and the effects stand down.

## Deploy

`nuxt generate` writes `dist/`; the workflow rsyncs it to the web root, matching
what hertz-games already does. Pushes to `main` build and deploy, pull requests
build only, and a daily cron refreshes the registry before deploying.

Repository secrets: `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY`,
`DEPLOY_PATH`.

Use a dedicated deploy user with write access to only that web root — a repo
compromise should not be a server compromise.

## Licence

MIT © 64Hz Games Studio
