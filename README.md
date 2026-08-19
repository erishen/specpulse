# SpecPulse

Build React UIs from natural language. An LLM turns your request into a declarative UI spec, a generator compiles that spec into a real React component, and a Vite preview shows it live.

```
prompt ──► LLM ──► UI spec (JSON tree) ──► React component ──► Vite preview
         (src/agent)   (src/spec)        (src/generator)       (preview/)
```

## Features

- **Design system + 4 themes** — `preview/src/index.css` is token-driven; every
  `Page` takes a `theme` prop (`light` / `dark` / `midnight` / `aurora`) and the
  whole palette restyles (glassmorphism cards, dark-aware tables/badges/steps…).
- **Incremental adjust** — keep a page and iterate with the Adjust box ("make the title
  blue", "add a Stat card under the hero"), instead of regenerating from scratch.
- **Element references** — in edit mode click any component to get its `#1.2`-style
  path reference (visible + copyable in the toolbar). Paste it into the Adjust box to
  target a specific element ("insert a button to the left of #1.2").
- **On-page click-to-edit** — the Edit button switches the preview into a spec-driven
  editor: click a component, edit its fields in the inspector, add / remove / reorder
  children, then Save to recompile `spec.json → App.tsx` without calling the LLM.
- **Reference-image generation** — upload a screenshot or mockup; a vision model
  reproduces a similar UI.

## Quick start

```bash
cp .env.example .env        # add OPENAI_API_KEY
npm install                 # root deps
npm --prefix preview install  # preview deps
npm run preview             # terminal 1: vite preview on :5173
npm run build -- "a landing page for a cloud storage startup with navbar, hero heading, feature cards and a CTA button"
```

Interactive mode (keeps regenerating against the same preview):

```bash
npm run agent
```

Curated prompt examples: see `docs/examples.md` (also built into the desktop
console as clickable starter chips).

Offline pipeline smoke test (no LLM needed):

```bash
npm run ci                   # compiles tests/fixtures/pricing.json -> preview/src/App.tsx
```

## Desktop console (Electron)

Prompt on the left, live preview on the right, generation history kept in
localStorage. The preview is served by a vite dev server (:5278) spawned by the
Electron main process; the console UI runs on :5277.

```bash
npm --prefix desktop install     # includes electron (see note below)

npm run desktop                  # production: build console + open window
npm run desktop:dev              # dev mode: electron + console vite -- hot reload
# in dev you must also run the console vite server:
npm --prefix desktop run dev
```

- **Build flow (main → CLI → preview)**: pressing Generate in the console calls
  `IPC.build(prompt)`; the main process spawns `node --import tsx
  src/cli/build.ts "<prompt>"` (argv-only, never through a shell), which writes
  `preview/src/App.tsx`; the console bumps the iframe `?t=` query to reload.
- **Adjust**: an LLM diff against the current record's `spec.json`
  (`src/cli/adjust.ts`), keeping everything untouched unless asked. The selected
  element's `#ref` is auto-appended as context, and any `#1.2` references in the
  instruction are expanded into concrete node descriptions before the call.
- **Edit (in place)**: the console posts the record's spec to the preview
  iframe (`postMessage`); `preview/src/PreviewRoot.tsx` swaps the compiled `App`
  for the spec-driven `SpecEditor`. Saving writes `spec.json` and re-runs
  `src/cli/regenerate.ts` (pure compile, no LLM), then exits edit mode.
- **History**: every generation is also archived to `generated/<stamp>-<title>/`
  (`prompt.txt`, `spec.json`, `App.tsx`). The console lists these under Saved
  and any entry can be restored into the live preview. `generated/` is gitignored
  for privacy (records contain your raw prompts) — track it explicitly if you
  want the history versioned.
- **Export**: `src/cli/export.ts` bundles a record into a **dynamic** single-file
  HTML under `exports/` (gitignored): the page renders from `spec.json` at runtime,
  so you can edit the JSON and the page changes without rebuilding. The spec is
  also embedded in the HTML (so `file://` double-click still works) and shipped
  alongside as `exports/<id>/spec.json`. The raw generation prompt is **not**
  included in exports, so a publicly deployed export can't leak it.
- **First launch**: no `.env` yet → the console shows a hint instead of
  failing. Add `OPENAI_API_KEY` to the project root `.env` and regenerate.
- **electron binary note**: this repo pins `electron@37.10.3`. If the binary
  download stalls on your network (China mirrors), install with
  `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm --prefix desktop
  install`, or copy the installed `node_modules/electron` from
  `work/harness/datapulse/desktop` into `desktop/node_modules` and skip the npm
  postinstall.

## Layout

```
generated/<stamp>-<title>/   auto-archived history of every generation
                            (prompt.txt + spec.json + App.tsx; spec.json alone
                            is enough to regenerate — the generator is pure)
```

```
src/
  spec/types.ts        UI element vocabulary + UISpec type
  agent/agent.ts       LLM wrapper: natural language -> validated UISpec
  generator/reactGenerator.ts   UISpec -> App.tsx source (pure, deterministic)
  cli/build.ts         one-shot CLI: prompt -> component file
  cli/agent.ts         interactive REPL
  cli/ci.ts            offline smoke test
  cli/adjust.ts        incremental LLM adjust against an existing record
  cli/regenerate.ts    pure recompile: spec.json -> App.tsx (after on-page edits)
  cli/export.ts        bundle a record into a dynamic single-file HTML (renders spec.json)
preview/               Vite + React runtime that renders generated App.tsx
  src/ui.tsx           the design-system components the generator emits
  src/ui3d.tsx         react-three-fiber scene components (Scene3D, Box3D, …)
  src/uiShadcn.tsx     radix-based shadcn-style components
  src/SpecEditor.tsx   on-page click-to-edit (spec-driven, no LLM)
  src/PreviewRoot.tsx  switches compiled App <-> SpecEditor via console messages
desktop/               Electron console: UI + IPC main that spawns the CLI
tests/                 node:test + fixtures (TDD)
```

## Design

- **Separate concerns**: agent (LLM) / spec (data) / generator (compile) / preview (runtime). Swap any layer.
- **JSON-in, JSX-out**: the generator is pure and deterministic, so it is unit-testable without an LLM.
- **Small vocabulary**: DOM = `Page, Navbar, Heading, Hero, Paragraph, Button,
  Input, Textarea, Card, List, Badge, Divider, Form, Link, Image, Avatar, Stat,
  Progress, Alert, Table, Checkbox, Select, Quote, CodeBlock, Steps, Timeline,
  Footer, Row, Grid`; 3D (react-three-fiber) = `Scene3D, Box3D, Sphere3D, Torus3D,
  Plane3D, Cylinder3D, Cone3D, Icosahedron3D, TorusKnot3D`; plus `uiShadcn.tsx`
  for radix-based extras. Extend `SUPPORTED_TYPES` + the matching runtime file to
  grow capability.
- **`onClick` is declared, not executed**: props may reference handler names; a real agent wiring pass would bind them to app state.

## Security & privacy

The desktop console hardens its renderer and the (LLM-generated, untrusted) preview
content:

- **Electron**: `contextIsolation` + `nodeIntegration:false` + `sandbox:true`; a
  minimal preload exposes only 10 IPC methods. IPC args are bounded with
  `cleanString`, `generated/` access is path-traversal checked, and CLIs are
  spawned with argv arrays (never a shell).
- **postMessage**: the console only accepts messages from the preview origin
  (`http://localhost:5278`); the preview only trusts the console origin
  (dev `:5277` / packaged `file://` or `null`). Send targets stay `'*'` but receivers validate.
- **iframe**: `sandbox="allow-scripts allow-same-origin"` blocks top navigation,
  popups, forms and downloads from generated pages.
- **CSP**: both `preview/index.html` and `desktop/index.html` ship a CSP meta tag
  (`script-src 'self' 'unsafe-inline'`, images limited to `https:/data:/blob:`,
  `connect-src` limited to local ws for HMR). It survives single-file export.
- **Generator whitelist**: `href`/`src` props are sanitized at compile time
  (http(s), `data:image/*`, blob, `#`, relative only — `javascript:` etc. are
  dropped), and attribute/list values are escaped so a crafted spec can't break
  out of the emitted JSX.
- **Keys**: `get-env` returns masked keys, `.env` is gitignored, and no code path
  logs API keys.

Known, by-design exposure (this is a tool that sends your text to an LLM): prompts
are stored in plaintext (localStorage history + `generated/<id>/prompt.txt` +
`spec.json`) and shipped to the LLM provider; the reference-image feature sends the
local **file path** of the chosen image to the provider; generated pages may load
external `https:` images (exposing your IP to that host).

## Tests

```bash
npm test          # node:test, no network needed
npm run typecheck # tsc --noEmit (root + preview + desktop)
npm --prefix preview run build
npm --prefix desktop run build
```

## Roadmap

See `docs/TODO.md` for the prioritized backlog (editor undo/drag, spec snapshot +
rollback, LLM-output validation, browser-only mode, …).

Remaining ideas not tracked there yet:
- [ ] handler binding (map `onClick` to state/actions, not leave it inert)
- [ ] generated data-aware components (reuse datapulse tables/charts)
- [ ] capture screenshots for regression diffs
- [ ] code-split the 3D runtime behind a lazy `React.lazy(Scene3D)` so pages without 3D stay light