/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { ProviderName } from './voidSettingsTypes.js';
import { VoidStaticModelInfo } from './modelCapabilities.js';

export type ModelCatalogEntry = Partial<VoidStaticModelInfo>;

export interface ModelCapabilityCatalog {
	capabilitiesSchemaVersion: number;
	models: Partial<Record<ProviderName, Record<string, ModelCatalogEntry>>>;
}

const BUNDLED_CATALOG: ModelCapabilityCatalog = {
	capabilitiesSchemaVersion: 1,
	models: {
		ollama: {
			'llama3': { contextWindow: 8192, supportsSystemMessage: 'system-role', supportsFIM: false, specialToolFormat: 'openai-style' },
			'codellama': { contextWindow: 16384, supportsSystemMessage: 'system-role', supportsFIM: true, specialToolFormat: 'openai-style' },
			'qwen2.5-coder': { contextWindow: 32768, supportsSystemMessage: 'system-role', supportsFIM: true, specialToolFormat: 'openai-style' },
		},
		openAICompatible: {
			'*': { contextWindow: 32768, supportsSystemMessage: 'system-role', supportsFIM: true, specialToolFormat: 'openai-style' },
		},
		vLLM: {
			'*': { contextWindow: 32768, supportsSystemMessage: 'system-role', supportsFIM: true, specialToolFormat: 'openai-style' },
		},
		lmStudio: {
			'*': { contextWindow: 32768, supportsSystemMessage: 'system-role', supportsFIM: false, specialToolFormat: 'openai-style' },
		},
	},
};

let activeCatalog: ModelCapabilityCatalog = BUNDLED_CATALOG;

const mergeCatalogs = (base: ModelCapabilityCatalog, overlay: ModelCapabilityCatalog): ModelCapabilityCatalog => {
	const models = { ...base.models } as ModelCapabilityCatalog['models'];
	for (const providerName of Object.keys(overlay.models) as ProviderName[]) {
		models[providerName] = {
			...(models[providerName] ?? {}),
			...(overlay.models[providerName] ?? {}),
		};
	}
	return {
		capabilitiesSchemaVersion: Math.max(base.capabilitiesSchemaVersion, overlay.capabilitiesSchemaVersion),
		models,
	};
};

export const getActiveCapabilityCatalog = (): ModelCapabilityCatalog => activeCatalog;

export const setActiveCapabilityCatalog = (catalog: ModelCapabilityCatalog): void => {
	activeCatalog = catalog;
};

export const mergeIntoActiveCapabilityCatalog = (overlay: ModelCapabilityCatalog): void => {
	activeCatalog = mergeCatalogs(activeCatalog, overlay);
};

export const resetActiveCapabilityCatalog = (): void => {
	activeCatalog = BUNDLED_CATALOG;
};

/** Lookup bundled/user/remote catalog entry (exact name, then wildcard *). */
export const lookupCatalogCapabilities = (
	providerName: ProviderName,
	modelName: string,
): ModelCatalogEntry | null => {
	const providerCatalog = activeCatalog.models[providerName];
	if (!providerCatalog) {
		return null;
	}
	const lower = modelName.toLowerCase();
	for (const key of Object.keys(providerCatalog)) {
		if (key.toLowerCase() === lower) {
			return providerCatalog[key] ?? null;
		}
	}
	return providerCatalog['*'] ?? null;
};

export const parseCapabilityCatalogJson = (text: string): ModelCapabilityCatalog => {
	const parsed = JSON.parse(text) as ModelCapabilityCatalog;
	if (!parsed?.models || typeof parsed.capabilitiesSchemaVersion !== 'number') {
		throw new Error('Invalid capability catalog JSON');
	}
	return parsed;
};
