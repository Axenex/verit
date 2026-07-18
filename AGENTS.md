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

### Build with npm (canonical pipeline)
Source of truth: `HOW_TO_CONTRIBUTE.md` ("Developer Mode" / "Building Void from Terminal" /
"Building a Local Executible"). Summary, verified against `package.json` scripts:
1. `npm install` — installs deps and runs `build/npm/preinstall.js` (enforces Node version) and
   `postinstall.js`. Must be run with Node `20.18.2` active.
2. `npm run buildreact` — build the Void React UI (see below).
3. `npm run watch` — terminal equivalent of the editor's Ctrl+Shift+B build task; runs
   `watch-client` + `watch-extensions` gulp watchers. Done when BOTH report
   `Finished compilation ... with 0 errors`. One-shot alternative: `npm run compile`.
4. `./scripts/code.sh` (Linux/Mac) or `./scripts/code.bat` (Windows) — launch dev-mode app.
Common fixes from the doc: use Node `20.18.2` (`.nvmrc`, via nvm); no spaces in the repo path;
`"TypeError: Failed to fetch dynamically imported module"` means an import is missing its `.js`
suffix; React OOM → `NODE_OPTIONS="--max-old-space-size=8192" npm run buildreact`; missing styles
→ wait and reload; macOS libtool `-static` error → use GNU libtool; SUID `chrome-sandbox` error →
`sudo chown root:root .build/electron/chrome-sandbox && sudo chmod 4755 ...` (or `--no-sandbox`).

### Packaging a local executable (`npm run gulp`)
- After dev-mode setup, package with `npm run gulp vscode-<platform>-<arch>`:
  `vscode-win32-x64|arm64`, `vscode-darwin-arm64|x64`, `vscode-linux-x64|arm64`. Takes ~25 min.
- Output lands OUTSIDE the repo in a sibling folder (e.g. `../VSCode-win32-x64`). This repo's
  `build/gulpfile.vscode.win32.js` is patched to honor `VSCODE_BUILD_ROOT`, so set
  `export VSCODE_BUILD_ROOT=$HOME/dev` on this VM (repo parent `/` is unwritable).
- Windows installers: `npm run gulp vscode-win32-<arch>-system-setup` or `-user-setup` compile
  `build/win32/code.iss` with Inno Setup into `.build/win32-<arch>/{system,user}-setup/`.
  Since the veritIDE rebrand the installer basename is `VeritIDESetup` (`OutputBaseFilename` in
  `code.iss`); older artifacts were named `VoidSetup*.exe`.

### Upstream status: Void is DEPRECATED (announced 2026)
- Upstream Void (`voideditor/void`) is deprecated and no longer accepts contributions. It stays
  open source as a reference for VS Code forks; old versions remain downloadable from its
  Releases, and a "Void Forks" list tracks successor projects.
- Consequences for this fork (veritIDE): expect NO new upstream Void releases, rebases, or fixes.
  Do not plan work around upstream PRs or upstream auto-update infra
  (`voideditor/binaries` / `voideditor/versions` may go stale); auto-update must eventually point
  at our own repos (see the "search Void/voideditor and replace" note below). Treat the
  void-builder pipeline as reference material to fork, not a live service.
- Upstream's own summary of what is worth reusing when forking VS Code: the React + Tailwind
  mount (custom build-pipeline extension — plain VS Code can't do this); the GitHub Actions that
  package, sign, and auto-update (VS Code's own build pipeline is private); the from-scratch AI
  provider code (autocomplete/FIM, grammars for `<thinking>`/tool tags, IPC + CSP architecture);
  and the editing services `EditCodeService` (streaming diffs, token by token) and
  `VoidModelService` (background file edits synced with text buffers).

### Distribution pipeline (void-builder — upstream knowledge, now frozen by deprecation)
- Official Void releases were NOT built from this repo directly. They come from
  [`voideditor/void-builder`](https://github.com/voideditor/void-builder), a fork of VSCodium
  whose GitHub Actions workflows build all assets (.dmg, .zip, .exe, etc.), upload them to a
  release on `voideditor/binaries`, and write the latest version to a text file on
  `voideditor/versions` (which the app's auto-updater checks — VSCodium's update URLs were
  swapped from vscode to void).
- VSCodium `.patch` files are applied to the `void/` checkout during the workflow run; they strip
  telemetry and adjust auto-update logic (mostly stock VSCodium plus Void renames).
- The macOS workflow is `stable-macos.sh` (Linux/Windows are similar); `insider-*` and
  `stable-spearhead` workflows were deleted. To self-build: fork void-builder and run its
  workflows; to own auto-updates, search caps-sensitive "Void"/"voideditor" and replace with your
  own repos.
- Rebasing onto newer vscode/vscodium: every Void change is commented with caps-sensitive "Void"
  (images excepted), so rebase = copy the upstream repo and re-apply everything found by searching
  "Void"/"voideditor". Keep vscode and vscodium versions aligned.

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
- Installer output: `.build/win32-x64/system-setup/VeritIDESetup.exe` (~106 MB; named `VoidSetup.exe`
  before the veritIDE rebrand). Test under Wine with a fresh prefix:
  `WINEPREFIX=~/.wine-void-install wine .build/win32-x64/system-setup/VeritIDESetup.exe /SILENT /DIR=C:\\VeritIDE`.
  A full native Windows install (Start Menu, file associations, auto-update) only works on real Windows.
