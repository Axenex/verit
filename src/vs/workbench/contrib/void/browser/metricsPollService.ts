/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';

import * as dom from '../../../../base/browser/dom.js';
import { IMetricsService } from '../common/metricsService.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';



export interface IMetricsPollService {
	readonly _serviceBrand: undefined;
}


const PING_EVERY_MS = 15 * 1000 * 60  // 15 minutes

export const IMetricsPollService = createDecorator<IMetricsPollService>('voidMetricsPollService');
class MetricsPollService extends Disposable implements IMetricsPollService {
	_serviceBrand: undefined;

	static readonly ID = 'voidMetricsPollService';

	private intervalID: number | null = null;
	private pingCounter = 1;

	constructor(
		@IMetricsService private readonly metricsService: IMetricsService,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
	) {
		super();

		const startOrStop = () => {
			if (this.voidSettingsService.state.globalSettings.enableUsageMetrics) {
				this._startPolling();
			} else {
				this._stopPolling();
			}
		};

		this._register(this.voidSettingsService.onDidChangeState(() => startOrStop()));
		this.voidSettingsService.waitForInitState.then(() => startOrStop()).catch(() => { /* non-fatal */ });
	}

	private _startPolling() {
		if (this.intervalID !== null) {
			return;
		}
		const { window } = dom.getActiveWindow();
		this.intervalID = window.setInterval(() => {
			this.metricsService.capture('Alive', { iv1: this.pingCounter });
			this.pingCounter += 1;
		}, PING_EVERY_MS);
	}

	private _stopPolling() {
		if (this.intervalID === null) {
			return;
		}
		const { window } = dom.getActiveWindow();
		window.clearInterval(this.intervalID);
		this.intervalID = null;
	}

	override dispose() {
		this._stopPolling();
		super.dispose();
	}


}

registerWorkbenchContribution2(MetricsPollService.ID, MetricsPollService, WorkbenchPhase.BlockRestore);
