/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable, toDisposable } from '../../../../base/common/lifecycle.js';
import { getActiveWindow } from '../../../../base/browser/dom.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import {
	ASCII_LINE_DELAY_MS,
	BOOT_FOOTER_LINES,
	BOOT_LOG_DELAY_MS,
	BOOT_LOG_LINES,
	STARTUP_MIN_MS,
	VSC_II_ASCII_ART,
	VSC_II_SUBTITLE,
} from './veritideStartupArt.js';

export class VeritideStartupSplashContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.veritideStartupSplash';

	private _dismissed = false;
	private readonly _timeouts: ReturnType<typeof setTimeout>[] = [];

	constructor(
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
	) {
		super();
		this._showSplash();
	}

	override dispose(): void {
		for (const t of this._timeouts) {
			clearTimeout(t);
		}
		this._timeouts.length = 0;
		super.dispose();
	}

	private _schedule(fn: () => void, ms: number): void {
		this._timeouts.push(setTimeout(fn, ms));
	}

	private _showSplash(): void {
		const targetWindow = getActiveWindow();
		const doc = targetWindow.document;

		const overlay = doc.createElement('div');
		overlay.className = 'veritide-startup-splash';
		overlay.setAttribute('role', 'presentation');
		overlay.setAttribute('aria-hidden', 'true');

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

		const dismiss = () => this._dismiss(overlay);
		const skipHandler = () => dismiss();
		overlay.addEventListener('click', skipHandler);
		targetWindow.addEventListener('keydown', skipHandler);

		this._register(toDisposable(() => {
			overlay.removeEventListener('click', skipHandler);
			targetWindow.removeEventListener('keydown', skipHandler);
			overlay.remove();
		}));

		// Boot log — type line by line
		let logDelay = 0;
		for (const line of BOOT_LOG_LINES) {
			const delay = logDelay;
			this._schedule(() => {
				if (this._dismissed) {
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

		// ASCII art — reveal after boot log starts
		const artStart = BOOT_LOG_DELAY_MS * 2;
		let artDelay = artStart;
		for (const line of VSC_II_ASCII_ART) {
			const delay = artDelay;
			this._schedule(() => {
				if (this._dismissed) {
					return;
				}
				const lineEl = doc.createElement('div');
				lineEl.className = 'veritide-startup-art-line';
				lineEl.textContent = line;
				art.appendChild(lineEl);
			}, delay);
			artDelay += ASCII_LINE_DELAY_MS;
		}

		// Progress bar fill
		const progressStart = artStart;
		const progressDuration = VSC_II_ASCII_ART.length * ASCII_LINE_DELAY_MS + 400;
		const progressSteps = 24;
		for (let i = 1; i <= progressSteps; i++) {
			const delay = progressStart + (progressDuration * i) / progressSteps;
			this._schedule(() => {
				if (!this._dismissed) {
					progressFill.style.width = `${Math.round((i / progressSteps) * 100)}%`;
				}
			}, delay);
		}

		// Footer skip hint
		this._schedule(() => {
			if (!this._dismissed) {
				footer.textContent = BOOT_FOOTER_LINES[1] ?? '';
			}
		}, artStart + progressDuration);

		// Dismiss when workbench restored AND minimum time elapsed
		const minTimePromise = new Promise<void>(resolve => this._schedule(() => resolve(), STARTUP_MIN_MS));
		const restoredPromise = this.lifecycleService.when(LifecyclePhase.Restored);

		Promise.all([minTimePromise, restoredPromise]).then(() => dismiss());
	}

	private _dismiss(overlay: HTMLElement): void {
		if (this._dismissed) {
			return;
		}
		this._dismissed = true;
		overlay.classList.add('veritide-startup-splash--hiding');
		this._schedule(() => overlay.remove(), 560);
	}
}

registerWorkbenchContribution2(
	VeritideStartupSplashContribution.ID,
	VeritideStartupSplashContribution,
	WorkbenchPhase.BlockRestore,
);
