<script setup lang="ts">
const { t } = useI18n()
const { go } = useDeck()
const { flagships, pluginItems, categories, pluginCount, totals } = useCatalog()

const catLabel = (id: string) => categories.value.find((c) => c.id === id)?.label ?? id

const byId = (id: string) => computed(() => flagships.value.find((p) => p.id === id))
const shader = byId('shader')
const fx = byId('fx')
const texture = byId('texture')

const CHANNEL_VARS: Record<string, string> = {
  shader: 'var(--amber)',
  fx: 'var(--ember)',
  texture: 'var(--sakura)',
}
</script>

<template>
  <TheDeck>
    <!-- ══════════ 00 · home ══════════ -->
    <DeckPanel id="home">
      <div class="panel__inner hero">
        <p class="hero__eyebrow rise">{{ t('hero.eyebrow') }}</p>

        <h1 class="hero__title rise" aria-label="HERTZ TOOLCHAIN">
          <span v-split class="ln">HERTZ</span>
          <span v-split class="ln ln--out">TOOLCHAIN</span>
        </h1>

        <div class="hero__grid rise">
          <p class="body-copy">
            {{ t('hero.lede', { count: pluginCount }) }}<em>{{ t('hero.ledeStrong') }}</em>。
          </p>

          <div class="strip">
            <a
              v-for="(p, i) in flagships"
              :key="p.id"
              class="strip__row"
              :href="`#${p.id}`"
              :style="{ '--ch': CHANNEL_VARS[p.id] }"
              :data-cursor-label="p.copy.tag"
              @click.prevent="go(i + 1)"
            >
              <span class="strip__n">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="strip__name">Dream<b>{{ p.name.replace('Dream', '') }}</b></span>
              <span class="strip__kind">{{ p.copy.kind }}</span>
            </a>

            <a
              class="strip__row strip__row--more"
              href="#plugins"
              :style="{ '--ch': 'var(--azure)' }"
              :data-cursor-label="t('panel.plugins')"
              @click.prevent="go(4)"
            >
              <span class="strip__n">+</span>
              <span class="strip__name">{{ t('hero.more') }}</span>
              <span class="strip__kind">{{ t('hero.moreKind') }}</span>
            </a>
          </div>
        </div>

        <div class="rise"><span class="scroll-hint"><i />{{ t('hero.scroll') }}</span></div>
      </div>

      <div class="corner corner--l"><b>64.000 Hz</b><span>{{ t('hero.cornerLeft') }}</span></div>
      <div class="corner corner--r"><b>★ {{ totals.stars }} · {{ totals.repos }} REPOS</b><span>{{ t('hero.cornerRight') }}</span></div>
    </DeckPanel>

    <!-- ══════════ 01 · DreamShader ══════════ -->
    <DeckPanel id="shader">
      <FlagshipPanel :product="shader">
        <template #visual>
          <figure class="slab">
            <div class="slab__bar"><span>M_Minimal.dsm</span><span>DreamShaderLang</span></div>
            <pre><code><span class="k1">Shader</span>(<span class="k2">Name</span>=<span class="k3">"DreamMaterials/M_Minimal"</span>)
{
    <span class="k2">Properties</span> = {
        <span class="k4">vec3</span> Tint = <span class="k1">vec3</span>(<span class="k3">1.0, 0.2, 0.2</span>);
    }

    <span class="k2">Settings</span> = {
        <span class="k2">Domain</span> = <span class="k3">"UI"</span>;
        <span class="k2">ShadingModel</span> = <span class="k3">"Unlit"</span>;
    }

    <span class="k2">Outputs</span> = {
        <span class="k4">vec3</span> Color;
        Base.EmissiveColor = Color;
    }

    <span class="k2">Graph</span> = { Color = Tint; }
}
<span class="k5">// {{ shader?.sample?.note }}</span></code></pre>
          </figure>
        </template>
      </FlagshipPanel>
    </DeckPanel>

    <!-- ══════════ 02 · DreamFX ══════════ -->
    <DeckPanel id="fx">
      <FlagshipPanel :product="fx">
        <template #visual>
          <div class="loop">
            <div class="loop__box">
              <b>{{ t('product.source') }}</b>
              <span>Systems/ *.dfs<br>Emitters/ *.dfe<br>Modules/ *.dfm</span>
            </div>
            <div class="loop__mid">
              <svg viewBox="0 0 42 10" fill="none" aria-hidden="true">
                <path d="M0 3h36M31 0l5 3-5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M42 8H6m5 3l-5-3 5-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".55" />
              </svg>
              <em>{{ t('product.roundTrip') }}</em>
            </div>
            <div class="loop__box">
              <b>{{ t('product.assets') }}</b>
              <span>NiagaraSystem<br>NiagaraEmitter<br>NiagaraScript</span>
            </div>
            <p class="loop__note">{{ t('product.roundTripNote') }}</p>
          </div>
        </template>
      </FlagshipPanel>
    </DeckPanel>

    <!-- ══════════ 03 · DreamTexture ══════════ -->
    <DeckPanel id="texture">
      <FlagshipPanel :product="texture">
        <template #visual><TextureChannels /></template>
      </FlagshipPanel>
    </DeckPanel>

    <!-- ══════════ 04 · plugin library ══════════ -->
    <DeckPanel id="plugins">
      <div class="panel__inner panel__inner--col">
        <div class="mx__head rise">
          <div class="mx__title">
            <span class="tag">{{ t('plugins.tag') }}</span>
            <h2 v-split class="display">{{ t('plugins.title') }}</h2>
          </div>
          <p class="mx__count">
            <b>{{ pluginCount }}</b> {{ t('plugins.countUnit') }} · {{ categories.map(c => c.label).join(' · ') }}
          </p>
        </div>

        <div class="rise mx__body">
          <PluginMarquee :items="pluginItems" :label="catLabel">
            <template #hint>{{ t('plugins.hint') }}</template>
          </PluginMarquee>
        </div>
      </div>
    </DeckPanel>

    <!-- ══════════ 05 · ecosystem ══════════ -->
    <DeckPanel id="ecosystem">
      <div class="panel__inner">
        <div class="eco__head rise">
          <span class="tag">{{ t('eco.tag') }}</span>
          <h2 v-split class="display">{{ t('eco.title') }}</h2>
          <p class="sub">{{ t('eco.sub') }}</p>
        </div>

        <div class="eco rise">
          <a
            v-for="k in ['vscode', 'rider', 'mcp', 'registry', 'blender', 'apps']"
            :key="k"
            class="eco__cell"
            :class="{ 'eco__cell--soft': k === 'apps' }"
            href="#"
          >
            <span class="eco__k">{{ t(`eco.${k}.k`) }}</span>
            <span class="eco__n">{{ t(`eco.${k}.n`) }}</span>
            <span class="eco__d">{{ t(`eco.${k}.d`) }}</span>
            <span class="eco__go">→</span>
          </a>
        </div>
      </div>
    </DeckPanel>

    <!-- ══════════ 06 · start ══════════ -->
    <DeckPanel id="start">
      <div class="panel__inner start">
        <div class="eco__head rise">
          <span class="tag">{{ t('start.tag') }}</span>
          <h2 v-split class="display">{{ t('start.title') }}</h2>
        </div>

        <div class="steps rise">
          <div class="step"><b>01</b><span>{{ t('start.s1', { dir: 'Plugins/' }) }}</span></div>
          <div class="step"><b>02</b><span>{{ t('start.s2', { dir: 'DShader/' }) }}</span></div>
          <div class="step"><b>03</b><span>{{ t('start.s3') }}</span></div>
        </div>

        <div class="cmd rise">
          <b>$</b> git clone https://github.com/TypeDreamMoon/DreamShader.git Plugins/DreamShader
        </div>

        <div class="ends rise">
          <div class="ends__col">
            <h4>{{ t('start.cols.lang') }}</h4>
            <a href="#shader" @click.prevent="go(1)">DreamShader</a>
            <a href="#fx" @click.prevent="go(2)">DreamFX</a>
            <a href="#texture" @click.prevent="go(3)">DreamTexture</a>
          </div>
          <div class="ends__col">
            <h4>{{ t('start.cols.plugins') }}</h4>
            <a href="#plugins" @click.prevent="go(4)">{{ t('start.links.library') }}</a>
            <a href="#ecosystem" @click.prevent="go(5)">{{ t('start.links.extensions') }}</a>
            <a href="#ecosystem" @click.prevent="go(5)">{{ t('start.links.registry') }}</a>
          </div>
          <div class="ends__col">
            <h4>{{ t('start.cols.docs') }}</h4>
            <a href="https://shader.toolchain.64hz.cn">{{ t('start.links.reference') }}</a>
            <a href="https://fx.toolchain.64hz.cn">{{ t('start.links.fxDocs') }}</a>
            <a href="#">{{ t('start.links.examples') }}</a>
          </div>
          <div class="ends__col">
            <h4>{{ t('start.cols.community') }}</h4>
            <a href="https://github.com/TypeDreamMoon" target="_blank" rel="noopener">GitHub</a>
            <a href="https://discord.gg/BpC9rH8Rk" target="_blank" rel="noopener">Discord</a>
            <a href="https://qm.qq.com/q/X9uCLjVcY" target="_blank" rel="noopener">QQ 群 466585194</a>
            <a href="https://64hz.cn">{{ t('start.links.studio') }}</a>
          </div>
          <div class="ends__bar">
            <span>© 2026 64Hz Games Studio</span>
            <span>toolchain.64hz.cn</span>
          </div>
        </div>
      </div>
    </DeckPanel>
  </TheDeck>
</template>

<style scoped>
/* ---------- 00 hero ---------- */
.hero { display: flex; flex-direction: column; gap: clamp(1.4rem, 2.8vh, 2.4rem); }
.hero__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--faint);
}
.hero__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--step-4);
  line-height: .86;
  letter-spacing: -.045em;
  color: var(--text-hi);
  perspective: 700px;
}
.hero__title .ln { display: block; }
/* the second line is drawn, not filled — the accent traces it */
.hero__title .ln--out :deep(.ch) {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--accent);
  transition: -webkit-text-stroke-color 700ms var(--ease), opacity 520ms var(--ease), transform 620ms var(--ease);
}

.hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: end;
}

.strip { display: flex; flex-direction: column; border-top: 1px solid var(--line); }
.strip__row {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 2.2rem 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: .72rem .25rem;
  border-bottom: 1px solid var(--line);
  transition: padding-left 380ms var(--ease);
}
/* the channel colour wipes in from the left rather than a flat hover fill */
.strip__row::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--ch) 16%, transparent), transparent 72%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 480ms var(--ease);
}
.strip__row:hover::before { transform: scaleX(1); }
.strip__row:hover { padding-left: .8rem; }
.strip__row > * { position: relative; }
.strip__n { font-family: var(--font-mono); font-size: var(--step--2); color: var(--faint); }
.strip__name { font-family: var(--font-display); font-weight: 500; font-size: var(--step-1); letter-spacing: -.01em; }
.strip__name b { font-weight: 500; color: var(--ch); }
.strip__kind { font-family: var(--font-mono); font-size: var(--step--2); letter-spacing: .1em; color: var(--faint); }
.strip__row--more .strip__name { color: var(--muted); font-size: var(--step-0); }

.corner {
  position: absolute;
  bottom: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: .1rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .1em;
  color: var(--faint);
}
.corner--l { left: var(--pad); }
.corner--r { right: var(--pad); text-align: right; }
.corner b { color: var(--muted); font-weight: 400; }

.scroll-hint {
  display: inline-flex;
  align-items: center;
  gap: .7rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--faint);
}
.scroll-hint i {
  display: block;
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, var(--accent), transparent);
  animation: sweep 2.4s var(--ease) infinite;
}
@keyframes sweep {
  0%, 100% { opacity: .3; transform: scaleX(.6); transform-origin: left; }
  50% { opacity: 1; transform: scaleX(1); }
}

/* ---------- code slab ---------- */
.slab {
  background: var(--bg-slab);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 24px 60px rgb(0 0 0 / .4);
}
.slab__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .55rem .85rem;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .06em;
  color: var(--faint);
}
.slab pre {
  padding: 1rem 1.15rem;
  font-family: var(--font-mono);
  font-size: clamp(.62rem, .55rem + .3vw, .8rem);
  line-height: 1.82;
  overflow-x: auto;
  color: rgb(233 230 221 / .82);
}
.k1 { color: var(--accent); }
.k2 { color: #8fb8c9; }
.k3 { color: #d8b06a; }
.k4 { color: #c98fa8; }
.k5 { color: var(--faint); }

/* ---------- round trip ---------- */
.loop { display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center; }
.loop__box {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.1rem;
  background: rgb(27 30 36 / .5);
  display: flex;
  flex-direction: column;
  gap: .45rem;
}
.loop__box b { font-family: var(--font-display); font-weight: 500; font-size: var(--step-0); color: var(--text-hi); }
.loop__box span { font-family: var(--font-mono); font-size: var(--step--2); color: var(--faint); line-height: 1.9; }
.loop__mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
  color: var(--accent);
  transition: color 700ms var(--ease);
}
.loop__mid svg { width: 42px; height: 10px; }
.loop__mid em { font-family: var(--font-mono); font-size: var(--step--2); font-style: normal; letter-spacing: .1em; color: var(--faint); }
.loop__note {
  grid-column: 1 / -1;
  margin-top: .3rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--faint);
  text-align: center;
}

/* ---------- 04 matrix ---------- */
.mx__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1.3rem;
}
.mx__title { display: flex; flex-direction: column; gap: .5rem; perspective: 700px; }

.filters { display: flex; flex-wrap: wrap; gap: .4rem; }
.filters button {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .08em;
  padding: .34rem .7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--muted);
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.filters button:hover { color: var(--text); border-color: var(--line-2); }
.filters button[aria-pressed='true'] { color: var(--accent-ink); background: var(--accent); border-color: var(--accent); }
.filters b { font-weight: 400; opacity: .65; }

.mx__body { min-height: 0; display: flex; flex-direction: column; justify-content: center; flex: 1 1 auto; }

.mx__count {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: .1em;
  color: var(--faint);
}
.mx__count b { color: var(--accent); font-weight: 500; transition: color 700ms var(--ease); }

/* ---------- 05 ecosystem ---------- */
.eco__head { display: flex; flex-direction: column; gap: .5rem; perspective: 700px; margin-bottom: clamp(1.4rem, 3.5vh, 2.4rem); }
.eco {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}
.eco__cell {
  background: var(--bg);
  padding: clamp(1.1rem, 2.2vw, 1.7rem);
  display: flex;
  flex-direction: column;
  gap: .5rem;
  min-height: 10rem;
  transition: background 240ms var(--ease);
}
.eco__cell:hover { background: var(--bg-soft); }
.eco__k { font-family: var(--font-mono); font-size: var(--step--2); letter-spacing: .16em; color: var(--faint); }
.eco__n { font-family: var(--font-display); font-weight: 500; font-size: var(--step-1); letter-spacing: -.01em; color: var(--text-hi); }
.eco__d { font-size: var(--step--1); color: var(--muted); line-height: 1.6; }
.eco__go { margin-top: auto; font-family: var(--font-mono); font-size: var(--step--2); color: var(--accent); letter-spacing: .08em; transition: color 700ms var(--ease); }
.eco__cell--soft .eco__n { color: var(--muted); }

/* ---------- 06 start ---------- */
.start { display: flex; flex-direction: column; gap: clamp(1.5rem, 3.5vh, 2.6rem); }
.steps {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  border-left: 1px solid var(--line);
  padding-left: 1.05rem;
  max-width: 46rem;
}
.step { display: flex; gap: .8rem; font-size: var(--step--1); color: var(--muted); }
.step b {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--accent);
  font-weight: 500;
  letter-spacing: .06em;
  flex: none;
  width: 2.2rem;
  padding-top: .16rem;
  transition: color 700ms var(--ease);
}

.cmd {
  font-family: var(--font-mono);
  font-size: clamp(.76rem, .68rem + .4vw, .95rem);
  padding: .9rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-slab);
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: .8rem;
  max-width: 42rem;
  overflow-x: auto;
}
.cmd b { color: var(--accent); font-weight: 400; flex: none; transition: color 700ms var(--ease); }

.ends {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.8rem;
  border-top: 1px solid var(--line);
  padding-top: 1.4rem;
}
.ends__col { display: flex; flex-direction: column; gap: .45rem; }
.ends__col h4 {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-weight: 400;
  letter-spacing: .16em;
  color: var(--faint);
}
.ends__col a { font-size: var(--step--1); color: var(--muted); width: fit-content; transition: color var(--dur-fast) var(--ease); }
.ends__col a:hover { color: var(--accent); }
.ends__bar {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--faint);
}

/* ---------- responsive ---------- */
@media (max-width: 1080px) {
  .eco { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ends { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 860px) {
  .hero__grid { grid-template-columns: 1fr; align-items: start; }
  .corner--l { display: none; }
  .loop { grid-template-columns: 1fr; }
  .loop__mid { transform: rotate(90deg); }
  .eco { grid-template-columns: 1fr; }
  .ends { grid-template-columns: 1fr 1fr; }
}
</style>
