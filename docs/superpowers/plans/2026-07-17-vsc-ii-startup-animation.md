# VSC-II Startup Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a full-screen retro VSC-II ASCII boot animation on every app launch, visually matching the VSCS-II / 80s terminal aesthetic, then fade out when the workbench is ready.

**Architecture:** Pure TypeScript workbench contribution (no React — faster cold start). DOM overlay at `z-index: 2147483646`, CRT CSS, line-by-line boot log + animated ASCII art from `veritideStartupArt.ts`. Dismiss after `LifecyclePhase.Restored` and a minimum display time (~2.8s). Skip on click/Escape.

**Tech Stack:** VS Code workbench contributions, `ILifecycleService`, CSS animations, TypeScript DOM.

## Global Constraints

- Product name in boot copy: **veritIDE** (per `VERITIDE_PREREQUISITES.md`); logo art: **VSC-II**
- Show on **every** window launch (not gated by onboarding)
- Do not remove existing Void features or onboarding
- Follow existing void contrib patterns (`voidOnboardingService.ts`, `void.contribution.ts`)
- No new silent outbound network calls

---

### Task 1: VSC-II ASCII art and boot script constants

**Files:**
- Create: `src/vs/workbench/contrib/void/browser/veritideStartupArt.ts`

**Interfaces:**
- Produces: `VSC_II_ASCII_ART: string[]`, `BOOT_LOG_LINES: string[]`, `STARTUP_MIN_MS: number`

- [ ] **Step 1: Create art module**

```typescript
export const STARTUP_MIN_MS = 2800;
export const VSC_II_ASCII_ART: string[] = [ /* 6-line block VSC-II logo */ ];
export const BOOT_LOG_LINES: string[] = [
  'LUNAMOTH SECURE KERNEL ............... OK',
  'PRIVACY ENFORCEMENT MODULE ........... OK',
  'LOCAL MODEL INTERFACE ................ OK',
  'LOADING veritIDE WORKBENCH ............',
];
```

- [ ] **Step 2: Commit**

```bash
git add src/vs/workbench/contrib/void/browser/veritideStartupArt.ts
git commit -m "feat(startup): add VSC-II ASCII art and boot log constants"
```

---

### Task 2: CRT startup splash styles

**Files:**
- Create: `src/vs/workbench/contrib/void/browser/media/veritide-startup.css`
- Modify: `src/vs/workbench/contrib/void/browser/void.contribution.ts` (import css)

- [ ] **Step 1: Add CRT overlay CSS** (scanlines, phosphor glow `#33ff66`, flicker keyframes, progress bar)

- [ ] **Step 2: Import in void.contribution.ts**

```typescript
import './media/veritide-startup.css'
```

- [ ] **Step 3: Commit**

---

### Task 3: Startup splash workbench contribution

**Files:**
- Create: `src/vs/workbench/contrib/void/browser/veritideStartupSplash.ts`
- Modify: `src/vs/workbench/contrib/void/browser/void.contribution.ts`

**Interfaces:**
- Consumes: `VSC_II_ASCII_ART`, `BOOT_LOG_LINES`, `STARTUP_MIN_MS` from Task 1
- Produces: `VeritideStartupSplashContribution` registered at `WorkbenchPhase.BlockRestore`

- [ ] **Step 1: Implement contribution** — build overlay, typewriter boot log, reveal ASCII art line-by-line, block progress bar, skip handlers

- [ ] **Step 2: Register**

```typescript
import './veritideStartupSplash.js'
```

- [ ] **Step 3: Manual test** — `DISPLAY=:1 ./scripts/code.sh --no-sandbox ...` → splash shows every launch

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(startup): VSC-II full-screen boot animation on every launch"
```

---

### Task 4: Push and PR

- [ ] Push branch `Axen/vsc-ii-startup-aac8`
- [ ] Open PR against `main`
