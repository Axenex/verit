/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IPathService } from '../../../services/path/common/pathService.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { joinPath } from '../../../../base/common/resources.js';
import { IVoidSettingsService } from './voidSettingsService.js';
import { mergeIntoActiveCapabilityCatalog, parseCapabilityCatalogJson, resetActiveCapabilityCatalog } from './capabilityCatalog.js';

export interface ICapabilityCatalogService {
	readonly _serviceBrand: undefined;
	refreshCatalogs(): Promise<void>;
}

export const ICapabilityCatalogService = createDecorator<ICapabilityCatalogService>('capabilityCatalogService');

export class CapabilityCatalogService extends Disposable implements ICapabilityCatalogService {
	_serviceBrand: undefined;

	constructor(
		@IFileService private readonly fileService: IFileService,
		@IPathService private readonly pathService: IPathService,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
	) {
		super();
		this._register(this.voidSettingsService.onDidChangeState(() => {
			this.refreshCatalogs().catch(() => { /* non-fatal */ });
		}));
		this.voidSettingsService.waitForInitState.then(() => this.refreshCatalogs()).catch(() => { /* non-fatal */ });
	}

	async refreshCatalogs(): Promise<void> {
		resetActiveCapabilityCatalog();

		const home = await this.pathService.userHome();
		const userCatalogUri = joinPath(home, '.veritide', 'capabilities', 'user-catalog.json');
		if (await this.fileService.exists(userCatalogUri)) {
			try {
				const content = await this.fileService.readFile(userCatalogUri);
				mergeIntoActiveCapabilityCatalog(parseCapabilityCatalogJson(content.value.toString()));
			} catch (e) {
				console.warn('[veritIDE] Failed to load user capability catalog:', e);
			}
		}

		const { enableCapabilityPacks, capabilityPackUrl } = this.voidSettingsService.state.globalSettings;
		if (enableCapabilityPacks && capabilityPackUrl?.trim()) {
			try {
				const res = await fetch(capabilityPackUrl);
				if (res.ok) {
					const text = await res.text();
					mergeIntoActiveCapabilityCatalog(parseCapabilityCatalogJson(text));
				}
			} catch (e) {
				console.warn('[veritIDE] Failed to fetch remote capability pack:', e);
			}
		}
	}
}

registerSingleton(ICapabilityCatalogService, CapabilityCatalogService, InstantiationType.Delayed);
