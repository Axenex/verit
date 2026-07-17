# AGENTS.md

## VeritIDE product planning

Before rebranding to **veritIDE** or changing local-model / privacy behavior, read
[`VERITIDE_PREREQUISITES.md`](./VERITIDE_PREREQUISITES.md) (approved decisions: fresh `.veritide`
data, technical privacy guarantees, keep all Void features, opt-in network capability packs).

## Cursor Cloud specific instructions

Void is a fork of VS Code — an Electron desktop IDE with an AI agent layer. Most Void-specific
code lives in `src/vs/workbench/contrib/void/`. Standard developer setup/commands are documented
in `HOW_TO_CONTRIBUTE.md` (see "Developer Mode" and "Building Void from Terminal"); prefer that
as the source of truth. There is a single product (the desktop editor); no backend server or
database is required. The notes below only capture non-obvious, environment-specific gotchas for
this cloud VM.

### Node version
- The repo requires Node `20.18.2` (see `.nvmrc`), installed via `nvm`. A newer `node` shim on
  `PATH` (`/exec-daemon/node`, currently v22) takes precedence over `nvm`, so a plain `nvm use`
  is not enough. `~/.bashrc` prepends `$HOME/.nvm/versions/node/v20.18.2/bin` to `PATH` so
  interactive shells get Node 20. In non-interactive contexts, prepend it yourself:
  `export PATH="$HOME/.nvm/versions/node/v20.18.2/bin:$PATH"`. Confirm with `node -v` → `20.18.2`
  before installing/building; native-module/ABI errors usually mean the wrong Node is active.

### Build & run (dev mode)
- `npm run buildreact` — compiles the React + Tailwind bundles that Void mounts. Run it before
  first launch and after changing anything under `.../void/browser/react/`. Use
  `NODE_OPTIONS="--max-old-space-size=8192"` if it OOMs. The "imported ... but never used"
  messages are harmless tree-shaking notices.
- `npm run watch` — the main dev build (`watch-client` + `watch-extensions`). Leave it running;
  it recompiles `out/` on save. Initial full compile takes ~2–3 min. Ready when BOTH
  `watch-extensions` and `watch-client` report `Finished compilation ... with 0 errors`.
- `./scripts/code.sh` — launches the built Void desktop app from `out/`. In this VM run it as:
  `DISPLAY=:1 ./scripts/code.sh --no-sandbox --user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions <folder>`
  - A real X server (TigerVNC) is already running on `DISPLAY=:1` (1920x1200); no need to start Xvfb.
  - `--no-sandbox` is required (the Electron `chrome-sandbox` SUID binary isn't root-owned here).
  - The first launch runs `build/lib/preLaunch.js`, which downloads the Electron binary and
    built-in extensions (needs network); set `VSCODE_SKIP_PRELAUNCH=1` to skip it once cached.
  - `Failed to connect to the bus` (dbus) and "nonexistent file" errors in the log are harmless.
  - Reload the dev window with Ctrl+R (Cmd+R) to pick up recompiled changes.

### Critical gotcha: writable root `/node_modules` sink (watch build)
- `npm run watch` crashes on startup with `EACCES: permission denied, mkdir '/node_modules'`
  unless a writable `/node_modules` directory exists at the filesystem root. Cause: `posthog-node`
  ships a `.d.ts` that imports from its own raw `src/`, pulling dep `.ts` source into the TS
  program; gulp-tsb (watch mode) then tries to emit those files to a path that resolves to root
  `/node_modules`, which is unwritable.
- Fix (re-created idempotently by the startup update script): a writable `/node_modules` dir owned
  by the current user, e.g. `sudo mkdir -p /node_modules && sudo chown "$(id -u):$(id -g)" /node_modules`.
  It just absorbs the misdirected emit so the watcher stays alive. Do NOT delete it, and do NOT
  "fix" it by editing tracked source — it is not a Void source bug.

### First-run onboarding (reaching the editor)
- On first launch Void shows a "Welcome to Void" onboarding modal. The provider page's "Next" is
  gated on having at least one Chat model configured. The easiest no-key path is the **Local** tab:
  add any model (e.g. name `test-model`, provider Ollama) — that satisfies the requirement without
  an API key. Then continue → "Enter the Void". Real AI chat/apply/autocomplete need a valid
  provider API key (not configured in this VM). Onboarding completion is persisted in the
  `--user-data-dir`, so it only needs to be done once per user-data dir.

### Lint & test
- `npm run eslint` — runs over the whole repo but exits non-zero on an unmodified tree because of
  pre-existing warnings in committed source (e.g. `metricsMainService.ts` import-pattern warning,
  unused `eslint-disable` directives). A clean exit is not expected without changes.
- `npm run test-node` — Node unit tests via mocha (needs `out/` compiled first); ~4500 tests,
  ~11s, exits 0. Filter with `npm run test-node -- --grep <pattern>`.
- `npm run test-browser` / `npm run smoketest` — browser/electron and smoke tests (heavier;
  `test-browser` runs `playwright install` first).

### Windows installer (.exe) on this Linux cloud VM
- Production Windows installers require a **Windows** build host (GitLab `package:win32-x64` job or
  GitHub Actions `release.yml` on `windows-2022`). GitHub Actions may be unavailable if the account
  has billing issues.
- For local experimentation on this VM, set `VSCODE_BUILD_ROOT` to a writable parent directory
  (e.g. `export VSCODE_BUILD_ROOT=$HOME/dev`) so gulp output lands in `$VSCODE_BUILD_ROOT/VSCode-win32-x64`
  instead of `/VSCode-win32-x64` at the filesystem root.
- Build sequence: `npm run buildreact` → `npm run download-builtin-extensions` →
  `npm run gulp vscode-win32-x64` (may warn on `rcedit` under Wine; the app bundle still packages) →
  copy `build/win32/inno_updater.exe` + `vcruntime140.dll` into `tools/` →
  `npm run gulp vscode-win32-x64-system-setup` (and/or `-user-setup`). Requires `wine` + `wine32:i386`
  (`dpkg --add-architecture i386 && apt-get install wine wine32:i386`).
- Installer output: `.build/win32-x64/system-setup/VoidSetup.exe` (~106 MB). Test under Wine with a
  fresh prefix: `WINEPREFIX=~/.wine-void-install wine dist/VoidSetup-x64-system.exe /SILENT /DIR=C:\\Void`.
  A full native Windows install (Start Menu, file associations, auto-update) only works on real Windows.
