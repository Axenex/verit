# AGENTS.md

## Cursor Cloud specific instructions

Void is a fork of VS Code — an Electron desktop IDE. Most Void-specific code lives in
`src/vs/workbench/contrib/void/`. Standard developer setup/commands are documented in
`HOW_TO_CONTRIBUTE.md` (see "Developer Mode" and "Building Void from Terminal"); prefer
that as the source of truth. The notes below only capture non-obvious, environment-specific
gotchas for this cloud VM.

### Node version
- The repo requires Node `20.18.2` (see `.nvmrc`). It is installed via `nvm` and prepended to
  `PATH` in `~/.bashrc`, so interactive shells already use it. The VM also has a newer `node`
  shim on `PATH` (`/exec-daemon/node`); the `~/.bashrc` prepend and the startup update script
  both ensure Node 20 wins. If you ever see native-module/ABI errors, confirm `node -v` is
  `20.18.2` before rebuilding.

### Build & run (dev mode)
- `npm run buildreact` — compiles the React + Tailwind bundles (Void mounts React; must be run
  before/after changing anything under `.../void/browser/react/`). Use
  `NODE_OPTIONS="--max-old-space-size=8192"` if it OOMs.
- `npm run watch` — the main dev build (watch-client + watch-extensions). Leave it running; it
  recompiles `out/` on save. Initial full compile takes ~2–3 min. It's ready when you see
  `Finished compilation with 0 errors` for both `watch-client` and `watch-extensions`.
- `./scripts/code.sh` — launches the built Void desktop app from `out/`. In this VM run it as:
  `DISPLAY=:1 VSCODE_SKIP_PRELAUNCH=1 ./scripts/code.sh --no-sandbox --user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions <folder>`
  - A virtual X display is already running on `:1` (1920x1200).
  - `--no-sandbox` is required (the Electron `chrome-sandbox` SUID binary isn't root-owned here).
  - The `dbus`/`Failed to connect to the bus` errors in the log are harmless in this container.
  - Reload the dev window with Ctrl+R (Cmd+R) to pick up recompiled changes.

### Critical gotcha: writable `/node_modules` sink (watch build)
- `npm run watch` crashes on startup with `EACCES: permission denied, mkdir '/node_modules'`
  unless a writable `/node_modules` directory exists at the filesystem root. Cause: the
  published `posthog-node@4.14.0` dependency ships a malformed `lib/index.d.ts` that imports
  from its own raw `src/` (`posthog-node/src/extensions/error-tracking/types`), pulling dep
  `.ts` source into the TS program; gulp-tsb (watch mode) then tries to emit those files to an
  output path that resolves to root `/node_modules`, which is unwritable.
- Fix (already applied in the VM and re-created idempotently by the startup update script):
  a writable `/node_modules` dir owned by the current user. It just absorbs the misdirected
  emit so the watcher stays alive. Do NOT delete it. This is not a Void source bug — do not
  "fix" it by editing tracked source.

### First-run onboarding (reaching the editor)
- On first launch Void shows a modal "Welcome to Void" onboarding that covers the whole window
  (standard shortcuts like Ctrl+N do nothing until it's dismissed). The "Add a Provider" page's
  "Next" button is gated: it requires at least one Chat model to be configured. Entering any
  20+ character placeholder API key for a cloud provider registers default models and unblocks
  "Next" → "Enter the Void". Real AI features (chat/apply) need a valid provider API key, which
  is not configured in this VM. Onboarding completion is persisted (encrypted) in the
  `--user-data-dir`, so it only needs to be done once per user-data dir.

### Lint & test
- `npm run eslint` — runs over the whole repo and works, but exits non-zero because of
  pre-existing warnings in committed source (e.g. `metricsMainService.ts` import-pattern
  warning, unused `eslint-disable` directives). A clean exit is not expected on an unmodified
  tree.
- `npm run test-node` — Node unit tests via mocha (needs `out/` compiled first). Filter with
  `npm run test-node -- --grep <pattern>` for a quick subset.
- `npm run test-browser` / `npm run smoketest` — browser/electron and smoke tests (heavier).
