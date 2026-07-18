/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { getActiveWindow } from '../../../../base/browser/dom.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { STARTUP_MIN_MS } from './veritideStartupArt.js';
import { getVeritideStartupSplashState, showVeritideStartupSplash } from './veritideStartupSplashDom.js';

export class VeritideStartupSplashContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.veritideStartupSplash';

	constructor(
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
	) {
		super();
		this._coordinateDismiss();
	}

	private _coordinateDismiss(): void {
		const targetWindow = getActiveWindow();
		const state = getVeritideStartupSplashState(targetWindow) ?? showVeritideStartupSplash(targetWindow);

		const elapsed = performance.now() - state.startedAt;
		const remainingMin = Math.max(0, STARTUP_MIN_MS - elapsed);

		const minTimePromise = new Promise<void>(resolve => setTimeout(resolve, remainingMin));
		const restoredPromise = this.lifecycleService.when(LifecyclePhase.Restored);

		Promise.all([minTimePromise, restoredPromise]).then(() => state.dismiss());
	}
}

registerWorkbenchContribution2(
	VeritideStartupSplashContribution.ID,
	VeritideStartupSplashContribution,
	WorkbenchPhase.BlockRestore,
);
