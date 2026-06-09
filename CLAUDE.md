# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ⚠️ **Fonte oficial de verdade: [`Melhorias/DIRETRIZ_OFICIAL_V1.md`](Melhorias/DIRETRIZ_OFICIAL_V1.md).**
> Este arquivo é subordinado a ela. Status/roadmap abaixo podem estar desatualizados —
> a diretriz prevalece. Veja também `AGENTS.md` (instruções para agentes), `README.md`,
> `docs/ROADMAP.md` e `CHANGELOG.md` (atualize-o quando a mudança alterar comportamento/status).

## What this is

AIMalexi RPG is a browser-based character sheet tool for **Call of Cthulhu 7th Edition** (PT-BR). Main HTML pages: `index.html` (portal), `investigator.html` (player sheet), `keeper.html` (GM tool), `guia-iniciante.html` (beginner guide), and `compendium.html` (reference). Deployed as a static site on GitHub Pages. **PT-BR is canonical** for all UI strings, game data, and most code comments.

## Running locally

No build step, no npm. Just open files:

```sh
# Option A — direct file (most things work)
open index.html

# Option B — local server (required for service worker/PWA testing)
python -m http.server 8765
# then open http://localhost:8765/
```

## Tests

```sh
node js/tests/runner.js
```

Zero-dep Node runner + 21 `test-*.js` suites, gated in CI via `.github/workflows/ci.yml` (Node 20, no npm install). All passing as of 2026-06-09 (~955 assertions; the exact count varies by ±1 between runs because some assertions are conditional on dice results). There are **no filter flags** — all suites always run together, and suite files cannot run standalone (they depend on globals provided by the runner). To add a suite, create `js/tests/test-*.js` and register it in the list inside `runner.js`. Manual browser test: `test-engine.html`.

## Deployment

Push to `main`. GitHub Pages serves from the root of `main` automatically. After adding any new JS/CSS file, add its path to `PRECACHE_URLS` in `sw.js` **and** bump `CACHE_VERSION` (currently `"v75"`). The SW uses cache-first with no `skipWaiting` (intentional - avoids interrupting a live session).

Commit convention (per `AGENTS.md`): small thematic commits, `docs:`/`fix:`-style prefixes with PT-BR descriptions.

## Architecture

All code lives under the `window.CoC` global namespace. No modules, no bundler. **HTML `<script>` order is the dependency graph** — wrong order fails silently. Order in `investigator.html`: data → engine → shared → i18n → core (signals → bus → store → schema → persist-middleware → event-log → event-ontology → render-pipeline → state-machine → executor) → views → Supabase SDK (CDN) → campaign → orchestrator (`investigator.js`) → player-sync.

```
js/engine/              ← pure functions, stable
  coc7e-rules.js        ← CoC 7e derived stats, RPN arithmetic parser (no eval)
  dice.js               ← crypto.getRandomValues (never Math.random)
  storage.js            ← IndexedDB with localStorage fallback, cache-first reads
  name-generator.js

js/core/                ← reactive core (LIVE)
  actions.js            ← action types + SACRED set (GM-only in multiplayer)
  event-ontology.js     ← SINGLE SOURCE OF TRUTH: catalog of every action with
                          aggregate/domain/renders/persists/sacred metadata;
                          RENDER_MAP (action → views) is derived from it.
                          New actions MUST be registered here.
  store.js              ← signals by slice + store.dispatch() (the real dispatcher)
  executor.js           ← entry point for domain actions: asks state-machine for
                          cascading effects, batches them in a render transaction
  state-machine.js      ← evaluates cascades (e.g. APPLY_DAMAGE → majorWound/unconscious)
  render-pipeline.js    ← subscribes to bus, re-renders views per RENDER_MAP
  persist-middleware.js ← subscribes to bus, debounced save via storage.js
  event-log.js          ← subscribes to bus, append-only log (session export/replay)
  schema.js             ← normalizeCharacter(): never throws, coerces/migrates on
                          every load & JSON import, records _meta.schemaWarnings
  bus.js · signals.js   ← event bus · bridge to vendored Preact Signals

js/views/               ← 18 sheet-section views (identity, attributes, skills, combat…)
js/shared/              ← ui-components, media-picker (Blobs), sanity-fx, validators, pdf-export

js/campaign/            ← multiplayer (LIVE code; see stubs warning below)
  transport.js (BroadcastChannel) · supabase-transport.js (Realtime)
  campaign-persistence.js · outbox-indexeddb.js · supabase-persistence-adapter.js
                        ← event-sourced durability: offline events queue in the
                          outbox, drain to Supabase on reconnect (schema: supabase/schema.sql)
  pin-system.js (6-digit crypto PIN) · campaign-store.js · player-sync.js (late-join)

js/vendor/              ← vendored, never edit (signals-core.js, supabase.js)
js/dev/                 ← trace.js, perf.js
data/                   ← plain JS objects, safe to edit (skills, occupations, bestiary…)
js/config.js            ← Supabase URL/anon key + useSupabase flag (currently true — go-live)
```

`keeper.html`/`js/keeper.js` (~1,100 lines) is **standalone** — it does not use the store/executor/views; its tabs live in top-level `js/keeper-*.js` modules. The compendium is `js/compendium/compendium.js`.

### Data flow (actual)

```
UI → CoC.core.executor.execute(action)
   → state-machine.evaluate() returns cascading effects
   → executor opens a render-pipeline transaction
   → store.dispatch() per action → reducer → signal.set()
   → bus.publish("store:dispatch", …)
   → subscribers react: render-pipeline (views), persist-middleware (save), event-log (append)
```

There is **no middleware chain** — coordination is event-driven off the bus. Views are registered manually in `investigator.js` `boot()` (`view.init()` + `pipeline.register(name, renderFn)`) and subscribe to the bus for transversal events; views never subscribe to signals directly.

The runtime is always the local Store. The UI **never reads from Supabase**. Supabase is transport/persistence only.

### Skeleton stubs — do not confuse with live code

`js/core/dispatch.js` (`window.CoC.dispatch = null`), `js/core/lifecycle.js` (registered but unused), and the entire `js/sync/` directory are **placeholders** from earlier milestones. The live multiplayer code is `js/campaign/`.

## Hard constraints (from `Melhorias/CONSTITUICAO_OPERACIONAL_V1.md`)

- **Zero eval.** Arithmetic is parsed via the Shunting-Yard RPN in `coc7e-rules.js`.
- **Zero `Math.random`.** All dice use `crypto.getRandomValues` via `dice.js`.
- **Offline-first.** Every critical action must work without network. Sync is opportunistic.
- **1–2 taps max** for any critical action. No deep menus or bureaucratic modals.
- **No VTT features:** no maps, tokens, dynamic lighting, or chat. Narrative over technology.
- **State tiers:** if it doesn't survive a page reload, it does not go in the main Store (use local component state instead).
- **Sacred actions** (defined as `SACRED` in `js/core/actions.js`: APPLY_DAMAGE, HEAL_DAMAGE, LOSE_SANITY, RECOVER_SANITY, SPEND_MAGIC, RESTORE_MAGIC, RESOLVE_COMBAT, ADD_STATUS, REMOVE_STATUS): in multiplayer, only the GM's authoritative client applies these.
- **`skipWaiting` disabled in SW** — intentional, do not change without understanding the session impact.
- **Never reproduce proprietary CoC text** (long rules passages, official adventures, art). Original summaries and minimal mechanical data only.

Extra care required (per `AGENTS.md`): `js/engine/coc7e-rules.js`, `js/engine/dice.js`, `data/`, the storage schema in `js/engine/storage.js`, `js/config.js`/Supabase flows, and character export/import. Audit existing behavior before changing it.

## Key storage details

- Schema version tracked in `storage.js` as `SAVE_SCHEMA_VERSION` (currently `3`). Increment and add a migration block in `runMigrations()` whenever the persisted data structure changes.
- Storage key prefix: `"aimalexi-rpg/"`.
- Blob assets (banner/portrait images) stored separately via `saveBlob`/`getBlob` and loaded lazily on boot.
- `schema.js` handles in-memory normalization on load/import; `storage.js` migrations handle the persisted shape — they are complementary.

## Current status

> ⚠️ Superseded by `Melhorias/DIRETRIZ_OFICIAL_V1.md` (phases G→B→M→RI→RK…). Real state as of 2026-06-09:
- Reactive core, views strangled out of `investigator.js`, append-only event log — **done**.
- **Fase M (durable free multiplayer)** — in progress: event-sourcing foundation in place (`campaign-persistence` + outbox + Supabase adapter, `useSupabase: true` in `js/config.js`); keeper/investigator redesigns (RI/RK) also in progress.

Known rule bugs backlog: `Melhorias/TODO_AUDIT_CoC7e.md`. Architecture history: `Melhorias/ARQUITETURA_V3.md`.
