# VeritIDE — Prerequisites & Build Guide

**Status:** Approved planning document (no rebrand until explicitly started).  
**Purpose:** Guide humans and AI agents building VeritIDE so decisions stay consistent and iteration is not blocked by avoidable constraints.

---

## North star

| Principle | Meaning |
|-----------|---------|
| **Local-first** | Users run their own models. Cloud is optional, never required for core coding. |
| **Low friction** | Adding a local model: **< 60s** (technical user), **< 3 min** (first-timer). |
| **Privacy by architecture** | No outbound network use except what the user explicitly configures or opts into. |
| **Compounding ABI** | Model capabilities improve via config/data/packs—not only via app releases. |
| **Keep Void features** | All existing Void IDE capabilities ship in VeritIDE v1 (see §4). |

---

## 1. Product identity (locked)

| Field | Value |
|-------|-------|
| Display name | `veritIDE` |
| Executable | `veritIDE.exe` / `veritIDE` (`nameShort`) |
| Install folder (Windows) | `C:\Program Files\veritIDE` |
| CLI / application name | `veritide` (`applicationName`, lowercase) |
| User data folder | **`.veritide`** (fresh start — **no migration** from `.void-editor`) |
| URL protocol | `veritide://` |
| Registry / mutex (examples) | `VeritIDE`, `veritide` |
| Settings export | `veritide-settings.json` (when implemented) |

**Rebrand implementation (later):** `product.json` → installer (`build/win32/code.iss`) → user-facing strings (onboarding, settings, errors). Internal paths (`contrib/void/`, `void-*` CSS) may remain in v1.

**Publisher / URLs:** TBD (e.g. `Axenex/verit` GitHub); set before installer publish.

---

## 2. Technical guarantees (privacy architecture)

VeritIDE is positioned as a **privacy-first, self-hosted coding platform**. These are **architectural requirements**, not marketing copy.

### 2.1 Default deny for network

| Rule | Requirement |
|------|-------------|
| **No silent outbound calls** | App must not phone home, telemetry, or cloud LLM APIs unless user configured a provider or opted in. |
| **User-configured endpoints only** | LLM traffic goes only to URLs the user set (Ollama, vLLM, LM Studio, custom base URL, or explicit API keys). |
| **No bundled cloud keys** | No default API keys or proxy to vendor inference. |
| **Opt-in for extras** | Capability packs, update checks, extension marketplace, and similar fetches require **explicit user consent** (see §2.2). |

### 2.2 Opt-in network features (allowed when user agrees)

| Feature | Default | Notes |
|---------|---------|-------|
| **Capability packs** | Off | User may enable fetch from network; offline bundled fallback always available. |
| **Extension marketplace** | User choice | VS Code gallery is standard Void behavior—disclose in settings. |
| **App updates** | TBD | If enabled, single clear toggle; no background analytics. |
| **Remote SSH / WSL** | User-initiated | Only to hosts user connects to. |
| **MCP servers** | User-configured | Only endpoints user adds. |

### 2.3 Implementation checklist (for agents)

- [ ] Audit outbound HTTP at startup and on LLM send paths.
- [ ] Remove or gate hardcoded referrers (e.g. `voideditor.com` in provider headers) → veritIDE or omit.
- [ ] Settings: **Privacy** section listing every network surface and its toggle.
- [ ] Document in README: what can call the network and how to run fully offline.

---

## 3. Feature scope — must keep (Void parity v1)

All Void IDE features remain in VeritIDE unless explicitly deprecated later:

| Area | Include |
|------|---------|
| AI Chat | Sidebar, threads, model selection |
| Apply / Fast Apply | Code application from chat |
| Quick Edit (Ctrl+K) | Inline edit |
| Autocomplete | FIM-capable models |
| SCM integration | AI-assisted git |
| MCP | Model Context Protocol servers |
| Onboarding | Provider setup (rebranded to veritIDE) |
| Settings | Models, providers, feature options, import/export |
| Extension marketplace | VS Code compatible gallery |
| Remote SSH / WSL | Open-remote extensions |
| Built-in editor | Full VS Code fork surface (terminal, debug, etc.) |

**Out of scope for v1 rebrand:** Renaming internal `void` module paths or CSS prefixes.

---

## 4. Local model flows — requirements

### 4.1 Target journeys

| Journey | Success criteria |
|---------|------------------|
| **Ollama** | Install → pull model → veritIDE auto-detects within ~5s → Chat works |
| **vLLM / LM Studio** | Default endpoint pre-filled → refresh lists models → enable for Chat |
| **OpenAI-compatible (local)** | Base URL only; **no fake API key** required for local servers |
| **No server yet** | Onboarding allows entering IDE with clear “provider offline” messaging |

### 4.2 Known friction to fix (priority order)

| P0 | Fix |
|----|-----|
| Treat `openAICompatible` as **first-class local** | Same UX as Ollama; autodetect where possible |
| Drop API-key gate for local OpenAI-compatible servers | Empty key OK when endpoint is localhost/LAN |
| **Health check UI** | Reachable / not reachable + retry (not silent polling) |
| **Unified “Add local model”** | Provider → endpoint → detect or name → enable Chat |
| **Unknown model defaults** | Sensible context + tools for agent; banner to tune capabilities |
| **veritIDE copy** | No “Void” in onboarding/settings/errors |

| P1 | Fix |
|----|-----|
| In-app Ollama pull (optional) | Beyond external links |
| Capability presets | Coding / Chat / Agent toggles vs raw JSON only |
| Form-based capability overrides | Reduce JSON-only overrides |

### 4.3 Key files (for agents)

```
src/vs/workbench/contrib/void/common/voidSettingsTypes.ts
src/vs/workbench/contrib/void/common/voidSettingsService.ts
src/vs/workbench/contrib/void/common/modelCapabilities.ts
src/vs/workbench/contrib/void/common/refreshModelService.ts
src/vs/workbench/contrib/void/browser/react/src/void-onboarding/VoidOnboarding.tsx
src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx
src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts
```

---

## 5. Capabilities ABI — exponential improvement

**ABI** = contract between veritIDE and models (context window, tools, FIM, reasoning, streaming).

### 5.1 Problems today

- Capabilities live in compiled `modelCapabilities.ts` (~1.6k lines).
- New models require code changes and rebuild.
- Unrecognized models get weak defaults (broken agent/autocomplete).
- Overrides are JSON-only with fixed `modelOverrideKeys`.

### 5.2 Target architecture

| Layer | Description |
|-------|-------------|
| **Bundled catalog** | Shipped JSON/YAML with `capabilitiesSchemaVersion` |
| **User overrides** | `~/.veritide/capabilities/` or workspace `.veritide/` |
| **Opt-in remote packs** | Fetch updated capability definitions when user enables |
| **Precedence** | user > workspace > remote pack (if opted in) > bundled > heuristic fallback |
| **Hot reload** | Reload window or explicit “Refresh capabilities” without full reinstall |

### 5.3 Definition of done (ABI v1)

- [ ] New model name works via settings + bundled/heuristic defaults without TypeScript edit.
- [ ] User can drop a capability JSON file and see effect after reload.
- [ ] Optional: fetch capability pack from network when toggle is on.
- [ ] One doc page: “Add a model veritIDE doesn’t know yet.” → see [`docs/add-model.md`](docs/add-model.md)

---

## 6. Build & distribution prerequisites

| Item | Notes |
|------|-------|
| Node | **20.18.2** (`.nvmrc`) |
| React UI | `npm run buildreact` before package |
| Windows package | `npm run gulp vscode-win32-x64` |
| Windows installer | `vscode-win32-x64-system-setup` / `-user-setup` |
| Cloud Linux VM | `export VSCODE_BUILD_ROOT=$HOME/dev`; Wine + `wine32:i386` for Inno Setup |
| CI | GitLab Windows job or local Windows; GitHub Actions if billing allows |

See `AGENTS.md` and `HOW_TO_CONTRIBUTE.md` for environment gotchas.

---

## 7. Implementation phases (execute in order)

| Phase | Scope | Depends on |
|-------|--------|------------|
| **A — Rebrand** | `product.json`, installer, user-visible strings → veritIDE; fresh `.veritide` | This doc approved ✓ |
| **B — Local model UX** | P0 items in §4.2 | Phase A optional parallel |
| **C — Privacy hardening** | Network audit, opt-in toggles, header cleanup | Phase A |
| **D — ABI v1** | External capability catalog + overrides + opt-in packs | Phase B |
| **E — Polish** | P1 local UX, in-app Ollama pull, capability forms | Phase D |

**Do not** mix large rebrand + ABI refactor in one PR unless explicitly requested.

---

## 8. AI agent instructions

When working on VeritIDE:

1. **Read this file first** before rebrand or model-flow changes.
2. **Product name:** `veritIDE` (no hyphen) in all user-visible text after Phase A.
3. **Fresh data:** Use `.veritide` only; do not migrate `.void-editor` automatically.
4. **Privacy:** No new silent outbound calls; gate optional network behind settings.
5. **Features:** Do not remove Void capabilities (§3) without explicit approval.
6. **Local models:** Prefer runtime config over hardcoded model tables.
7. **Test path:** Add local model → enable Chat → send message → (optional) tool call.
8. **Scope:** Small, focused PRs per phase.

---

## 9. Decisions log

| Question | Decision | Date |
|----------|----------|------|
| User data folder | Fresh `.veritide`, no migration | 2026-07-17 |
| Privacy | Technical guarantees; no outbound except user config + opt-in | 2026-07-17 |
| Feature scope | Keep all Void features in v1 | 2026-07-17 |
| Capability packs | OK to fetch from network when user opts in | 2026-07-17 |
| Product name | `veritIDE` (no hyphen) | 2026-07-17 |

---

## 10. Still TBD

- Publisher name and support URL for Windows installer
- App update channel and default (on/off)
- Capability pack hosting URL (when opt-in is implemented)
- App icon / installer artwork (veritIDE branding assets)
