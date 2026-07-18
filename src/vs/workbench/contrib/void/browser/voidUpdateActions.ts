/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import Severity from '../../../../base/common/severity.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { INotificationActions, INotificationHandle, INotificationService } from '../../../../platform/notification/common/notification.js';
import { IMetricsService } from '../common/metricsService.js';
import { IVoidUpdateService } from '../common/voidUpdateService.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import * as dom from '../../../../base/browser/dom.js';
import { IUpdateService } from '../../../../platform/update/common/update.js';
import { VoidCheckUpdateRespose } from '../common/voidUpdateServiceTypes.js';
import { IAction } from '../../../../base/common/actions.js';
import { IVoidSettingsService } from '../common/voidSettingsService.js';

const VERITIDE_RELEASES_URL = 'https://github.com/Axenex/verit/releases';
const VERITIDE_REPO_URL = 'https://github.com/Axenex/verit';




const notifyUpdate = (res: VoidCheckUpdateRespose & { message: string }, notifService: INotificationService, updateService: IUpdateService): INotificationHandle => {
	const message = res?.message || `This is a very old version of veritIDE. Please download the latest release from [GitHub](${VERITIDE_RELEASES_URL}).`

	let actions: INotificationActions | undefined

	if (res?.action) {
		const primary: IAction[] = []

		if (res.action === 'reinstall') {
			primary.push({
				label: `Reinstall`,
				id: 'void.updater.reinstall',
				enabled: true,
				tooltip: '',
				class: undefined,
				run: () => {
					const { window } = dom.getActiveWindow()
					window.open(VERITIDE_RELEASES_URL)
				}
			})
		}

		if (res.action === 'download') {
			primary.push({
				label: `Download`,
				id: 'void.updater.download',
				enabled: true,
				tooltip: '',
				class: undefined,
				run: () => {
					updateService.downloadUpdate()
				}
			})
		}


		if (res.action === 'apply') {
			primary.push({
				label: `Apply`,
				id: 'void.updater.apply',
				enabled: true,
				tooltip: '',
				class: undefined,
				run: () => {
					updateService.applyUpdate()
				}
			})
		}

		if (res.action === 'restart') {
			primary.push({
				label: `Restart`,
				id: 'void.updater.restart',
				enabled: true,
				tooltip: '',
				class: undefined,
				run: () => {
					updateService.quitAndInstall()
				}
			})
		}

		primary.push({
			id: 'void.updater.site',
			enabled: true,
			label: `veritIDE on GitHub`,
			tooltip: '',
			class: undefined,
			run: () => {
				const { window } = dom.getActiveWindow()
				window.open(VERITIDE_REPO_URL)
			}
		})

		actions = {
			primary: primary,
			secondary: [{
				id: 'void.updater.close',
				enabled: true,
				label: `Keep current version`,
				tooltip: '',
				class: undefined,
				run: () => {
					notifController.close()
				}
			}]
		}
	}
	else {
		actions = undefined
	}

	const notifController = notifService.notify({
		severity: Severity.Info,
		message: message,
		sticky: true,
		progress: actions ? { worked: 0, total: 100 } : undefined,
		actions: actions,
	})

	return notifController
}
const notifyErrChecking = (notifService: INotificationService): INotificationHandle => {
	const message = `veritIDE could not check for updates. If this persists, reinstall from [GitHub releases](${VERITIDE_RELEASES_URL}).`
	const notifController = notifService.notify({
		severity: Severity.Info,
		message: message,
		sticky: true,
	})
	return notifController
}


const performVoidCheck = async (
	explicit: boolean,
	notifService: INotificationService,
	voidUpdateService: IVoidUpdateService,
	metricsService: IMetricsService,
	updateService: IUpdateService,
): Promise<INotificationHandle | null> => {

	const metricsTag = explicit ? 'Manual' : 'Auto'

	metricsService.capture(`veritIDE Update ${metricsTag}: Checking...`, {})
	const res = await voidUpdateService.check(explicit)
	if (!res) {
		const notifController = notifyErrChecking(notifService);
		metricsService.capture(`veritIDE Update ${metricsTag}: Error`, { res })
		return notifController
	}
	else {
		if (res.message) {
			const notifController = notifyUpdate(res, notifService, updateService)
			metricsService.capture(`veritIDE Update ${metricsTag}: Yes`, { res })
			return notifController
		}
		else {
			metricsService.capture(`veritIDE Update ${metricsTag}: No`, { res })
			return null
		}
	}
}


// Action
let lastNotifController: INotificationHandle | null = null


registerAction2(class extends Action2 {
	constructor() {
		super({
			f1: true,
			id: 'void.voidCheckUpdate',
			title: localize2('voidCheckUpdate', 'veritIDE: Check for Updates'),
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const voidUpdateService = accessor.get(IVoidUpdateService)
		const notifService = accessor.get(INotificationService)
		const metricsService = accessor.get(IMetricsService)
		const updateService = accessor.get(IUpdateService)

		const currNotifController = lastNotifController

		const newController = await performVoidCheck(true, notifService, voidUpdateService, metricsService, updateService)

		if (newController) {
			currNotifController?.close()
			lastNotifController = newController
		}
	}
})

// on mount
class VoidUpdateWorkbenchContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.void.voidUpdate'
	constructor(
		@IVoidUpdateService voidUpdateService: IVoidUpdateService,
		@IMetricsService metricsService: IMetricsService,
		@INotificationService notifService: INotificationService,
		@IUpdateService updateService: IUpdateService,
		@IVoidSettingsService voidSettingsService: IVoidSettingsService,
	) {
		super()

		let initId: number | null = null;
		let intervalId: number | null = null;

		const clearSchedulers = () => {
			const { window } = dom.getActiveWindow();
			if (initId !== null) {
				window.clearTimeout(initId);
				initId = null;
			}
			if (intervalId !== null) {
				window.clearInterval(intervalId);
				intervalId = null;
			}
		};

		const scheduleAutoChecks = () => {
			clearSchedulers();
			if (!voidSettingsService.state.globalSettings.enableUpdateChecks) {
				return;
			}
			const { window } = dom.getActiveWindow();
			const autoCheck = () => {
				performVoidCheck(false, notifService, voidUpdateService, metricsService, updateService);
			};
			initId = window.setTimeout(() => autoCheck(), 5 * 1000);
			intervalId = window.setInterval(() => autoCheck(), 3 * 60 * 60 * 1000);
		};

		this._register(voidSettingsService.onDidChangeState(() => scheduleAutoChecks()));
		voidSettingsService.waitForInitState.then(() => scheduleAutoChecks()).catch(() => { /* non-fatal */ });
		this._register({ dispose: () => clearSchedulers() });
	}
}
registerWorkbenchContribution2(VoidUpdateWorkbenchContribution.ID, VoidUpdateWorkbenchContribution, WorkbenchPhase.BlockRestore);
