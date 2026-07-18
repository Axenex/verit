/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import {
	ASCII_LINE_DELAY_MS,
	BOOT_FOOTER_LINES,
	BOOT_LOG_DELAY_MS,
	BOOT_LOG_LINES,
	VSC_II_ASCII_ART,
	VSC_II_SUBTITLE,
} from './veritideStartupArt.js';

export const VERITIDE_SPLASH_ID = 'veritide-startup-splash';
const CRITICAL_STYLE_ID = 'veritide-startup-critical-css';

/** Inlined subset of veritide-startup.css — available before the workbench bundle loads. */
export const VERITIDE_STARTUP_CRITICAL_CSS = `
.veritide-startup-splash{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#000;color:#33ff66;font-family:'Courier New',Courier,'Lucida Console',monospace;font-size:14px;line-height:1.35;overflow:hidden;cursor:default;user-select:none;opacity:1;transition:opacity .55s ease-out}
.veritide-startup-splash.veritide-startup-splash--hiding{opacity:0;pointer-events:none}
.veritide-startup-splash::before{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0,rgba(0,0,0,.18) 1px,transparent 1px,transparent 3px);z-index:2}
.veritide-startup-splash::after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(0,0,0,.85);background:radial-gradient(ellipse at center,rgba(51,255,102,.07) 0%,transparent 65%);z-index:1;animation:veritide-crt-flicker 4s infinite}
@keyframes veritide-crt-flicker{0%,100%{opacity:1}50%{opacity:.97}52%{opacity:1}54%{opacity:.98}}
.veritide-startup-inner{position:relative;z-index:3;width:min(92vw,820px);padding:2rem 2.5rem;border:2px solid #33ff66;box-shadow:0 0 20px rgba(51,255,102,.35),inset 0 0 30px rgba(51,255,102,.05);background:rgba(0,12,0,.92);animation:veritide-border-pulse 2.5s ease-in-out infinite}
@keyframes veritide-border-pulse{0%,100%{box-shadow:0 0 20px rgba(51,255,102,.35),inset 0 0 30px rgba(51,255,102,.05)}50%{box-shadow:0 0 32px rgba(51,255,102,.5),inset 0 0 40px rgba(51,255,102,.08)}}
.veritide-startup-subtitle{text-align:center;letter-spacing:.35em;font-size:11px;margin-bottom:1.25rem;color:#22cc55;text-shadow:0 0 8px rgba(51,255,102,.6)}
.veritide-startup-log{min-height:7.5em;margin-bottom:1.25rem;font-size:13px;color:#2ee85f}
.veritide-startup-log-line{white-space:pre;opacity:0;animation:veritide-log-in .15s ease-out forwards}
@keyframes veritide-log-in{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
.veritide-startup-art{text-align:center;font-size:clamp(9px,1.55vw,15px);line-height:1.2;margin:1rem 0;color:#33ff66;text-shadow:0 0 10px rgba(51,255,102,.85),0 0 24px rgba(51,255,102,.35)}
.veritide-startup-art-line{white-space:pre;opacity:0;animation:veritide-art-in .2s ease-out forwards}
@keyframes veritide-art-in{from{opacity:0;filter:brightness(2)}to{opacity:1;filter:brightness(1)}}
.veritide-startup-progress-wrap{margin-top:1.25rem}
.veritide-startup-progress-label{font-size:11px;letter-spacing:.12em;margin-bottom:.35rem;color:#22cc55}
.veritide-startup-progress-bar{height:14px;border:1px solid #33ff66;background:#001100;padding:2px;box-shadow:inset 0 0 8px rgba(0,0,0,.8)}
.veritide-startup-progress-fill{height:100%;width:0%;background:repeating-linear-gradient(90deg,#33ff66 0,#33ff66 8px,#22aa44 8px,#22aa44 10px);box-shadow:0 0 12px rgba(51,255,102,.6);transition:width .08s linear}
.veritide-startup-footer{margin-top:1rem;text-align:center;font-size:10px;letter-spacing:.2em;color:#1a9944;opacity:0;animation:veritide-log-in .3s ease-out .2s forwards}
.veritide-startup-cursor{display:inline-block;width:.55em;animation:veritide-blink .9s step-end infinite}
@keyframes veritide-blink{0%,100%{opacity:1}50%{opacity:0}}
`;

export const VERITIDE_SPLASH_DISMISSED_EVENT = 'veritide-startup-splash-dismissed';

export type VeritideStartupSplashState = {
	readonly startedAt: number;
	dismissed: boolean;
	readonly dismiss: () => void;
	readonly whenDismissed: Promise<void>;
	readonly overlay: HTMLElement;
};

declare global {
	interface Window {
		__veritideStartupSplash?: VeritideStartupSplashState;
	}
}

export function getVeritideStartupSplashState(targetWindow: Window): VeritideStartupSplashState | undefined {
	return targetWindow.__veritideStartupSplash;
}

function injectCriticalCss(doc: Document): void {
	if (doc.getElementById(CRITICAL_STYLE_ID)) {
		return;
	}
	const style = doc.createElement('style');
	style.id = CRITICAL_STYLE_ID;
	style.textContent = VERITIDE_STARTUP_CRITICAL_CSS;
	doc.head.appendChild(style);
}

function createOverlay(doc: Document): HTMLElement {
	const overlay = doc.createElement('div');
	overlay.id = VERITIDE_SPLASH_ID;
	overlay.className = 'veritide-startup-splash';
	overlay.setAttribute('role', 'presentation');
	overlay.setAttribute('aria-hidden', 'true');
	overlay.dataset.veritideEarly = 'true';

	const inner = doc.createElement('div');
	inner.className = 'veritide-startup-inner';

	const subtitle = doc.createElement('div');
	subtitle.className = 'veritide-startup-subtitle';
	subtitle.textContent = VSC_II_SUBTITLE;
	inner.appendChild(subtitle);

	const log = doc.createElement('div');
	log.className = 'veritide-startup-log';
	inner.appendChild(log);

	const art = doc.createElement('pre');
	art.className = 'veritide-startup-art';
	inner.appendChild(art);

	const progressWrap = doc.createElement('div');
	progressWrap.className = 'veritide-startup-progress-wrap';
	const progressLabel = doc.createElement('div');
	progressLabel.className = 'veritide-startup-progress-label';
	progressLabel.textContent = 'SYSTEM INITIALIZATION';
	const progressBar = doc.createElement('div');
	progressBar.className = 'veritide-startup-progress-bar';
	const progressFill = doc.createElement('div');
	progressFill.className = 'veritide-startup-progress-fill';
	progressBar.appendChild(progressFill);
	progressWrap.appendChild(progressLabel);
	progressWrap.appendChild(progressBar);
	inner.appendChild(progressWrap);

	const footer = doc.createElement('div');
	footer.className = 'veritide-startup-footer';
	inner.appendChild(footer);

	overlay.appendChild(inner);
	doc.body.appendChild(overlay);

	return overlay;
}

function runSplashAnimation(
	targetWindow: Window,
	overlay: HTMLElement,
	schedule: (fn: () => void, ms: number) => void,
	isDismissed: () => boolean,
): void {
	const doc = targetWindow.document;
	const log = overlay.querySelector('.veritide-startup-log')!;
	const art = overlay.querySelector('.veritide-startup-art')!;
	const progressFill = overlay.querySelector('.veritide-startup-progress-fill') as HTMLElement;
	const footer = overlay.querySelector('.veritide-startup-footer')!;

	let logDelay = 0;
	for (const line of BOOT_LOG_LINES) {
		const delay = logDelay;
		schedule(() => {
			if (isDismissed()) {
				return;
			}
			const lineEl = doc.createElement('div');
			lineEl.className = 'veritide-startup-log-line';
			lineEl.textContent = line;
			if (line.includes('LOADING')) {
				const cursor = doc.createElement('span');
				cursor.className = 'veritide-startup-cursor';
				cursor.textContent = '_';
				lineEl.appendChild(cursor);
			}
			log.appendChild(lineEl);
		}, delay);
		logDelay += BOOT_LOG_DELAY_MS;
	}

	const artStart = BOOT_LOG_DELAY_MS * 2;
	let artDelay = artStart;
	for (const line of VSC_II_ASCII_ART) {
		const delay = artDelay;
		schedule(() => {
			if (isDismissed()) {
				return;
			}
			const lineEl = doc.createElement('div');
			lineEl.className = 'veritide-startup-art-line';
			lineEl.textContent = line;
			art.appendChild(lineEl);
		}, delay);
		artDelay += ASCII_LINE_DELAY_MS;
	}

	const progressDuration = VSC_II_ASCII_ART.length * ASCII_LINE_DELAY_MS + 400;
	const progressSteps = 24;
	for (let i = 1; i <= progressSteps; i++) {
		const delay = artStart + (progressDuration * i) / progressSteps;
		schedule(() => {
			if (!isDismissed()) {
				progressFill.style.width = `${Math.round((i / progressSteps) * 100)}%`;
			}
		}, delay);
	}

	schedule(() => {
		if (!isDismissed()) {
			(footer as HTMLElement).textContent = BOOT_FOOTER_LINES[1] ?? '';
		}
	}, artStart + progressDuration);
}

/**
 * Show the VSC-II startup splash immediately (safe to call before the workbench bundle loads).
 * Idempotent per window — returns the existing splash if already shown.
 */
export function showVeritideStartupSplash(targetWindow: Window): VeritideStartupSplashState {
	const existing = getVeritideStartupSplashState(targetWindow);
	if (existing && !existing.dismissed) {
		return existing;
	}

	injectCriticalCss(targetWindow.document);

	// Black shell while the CRT boot sequence runs (first launch has no saved parts splash).
	const shellStyle = targetWindow.document.createElement('style');
	shellStyle.className = 'initialShellColors';
	targetWindow.document.head.appendChild(shellStyle);
	shellStyle.textContent = 'body { background-color: #000000; color: #33ff66; margin: 0; padding: 0; }';

	const overlay = createOverlay(targetWindow.document);
	const timeouts: ReturnType<typeof setTimeout>[] = [];
	let dismissed = false;

	let resolveDismissed!: () => void;
	const whenDismissed = new Promise<void>(resolve => { resolveDismissed = resolve; });

	const dismiss = () => {
		if (dismissed) {
			return;
		}
		dismissed = true;
		overlay.classList.add('veritide-startup-splash--hiding');
		const tid = setTimeout(() => overlay.remove(), 560);
		timeouts.push(tid);
		resolveDismissed();
		targetWindow.dispatchEvent(new CustomEvent(VERITIDE_SPLASH_DISMISSED_EVENT));
	};

	const skipHandler = () => dismiss();
	overlay.addEventListener('click', skipHandler);
	targetWindow.addEventListener('keydown', skipHandler);

	const schedule = (fn: () => void, ms: number) => {
		timeouts.push(setTimeout(fn, ms));
	};

	runSplashAnimation(targetWindow, overlay, schedule, () => dismissed);

	const state: VeritideStartupSplashState = {
		startedAt: performance.now(),
		get dismissed() { return dismissed; },
		set dismissed(v: boolean) { dismissed = v; },
		dismiss,
		whenDismissed,
		overlay,
	};

	targetWindow.__veritideStartupSplash = state;
	performance.mark('code/didShowVeritideSplash');
	return state;
}
