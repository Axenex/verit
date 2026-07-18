
/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { defaultModelsOfProvider, defaultProviderSettings, ModelOverrides } from './modelCapabilities.js';
import { ToolApprovalType } from './toolsServiceTypes.js';
import { VoidSettingsState } from './voidSettingsService.js'


type UnionOfKeys<T> = T extends T ? keyof T : never;



export type ProviderName = keyof typeof defaultProviderSettings
export const providerNames = Object.keys(defaultProviderSettings) as ProviderName[]

export const localProviderNames = ['ollama', 'vLLM', 'lmStudio', 'openAICompatible'] satisfies ProviderName[] // all local names
export const nonlocalProviderNames = providerNames.filter((name) => !(localProviderNames as string[]).includes(name)) // all non-local names

type CustomSettingName = UnionOfKeys<typeof defaultProviderSettings[ProviderName]>
type CustomProviderSettings<providerName extends ProviderName> = {
	[k in CustomSettingName]: k extends keyof typeof defaultProviderSettings[providerName] ? string : undefined
}
export const customSettingNamesOfProvider = (providerName: ProviderName) => {
	return Object.keys(defaultProviderSettings[providerName]) as CustomSettingName[]
}



export type VoidStatefulModelInfo = { // <-- STATEFUL
	modelName: string,
	type: 'default' | 'autodetected' | 'custom';
	isHidden: boolean, // whether or not the user is hiding it (switched off)
}



type CommonProviderSettings = {
	_didFillInProviderSettings: boolean | undefined, // undefined initially, computed when user types in all fields
	models: VoidStatefulModelInfo[],
}

export type SettingsAtProvider<providerName extends ProviderName> = CustomProviderSettings<providerName> & CommonProviderSettings

// part of state
export type SettingsOfProvider = {
	[providerName in ProviderName]: SettingsAtProvider<providerName>
}


export type SettingName = keyof SettingsAtProvider<ProviderName>

type DisplayInfoForProviderName = {
	title: string,
	desc?: string,
}

export const displayInfoOfProviderName = (providerName: ProviderName): DisplayInfoForProviderName => {
	if (providerName === 'anthropic') {
		return { title: 'Anthropic', }
	}
	else if (providerName === 'openAI') {
		return { title: 'OpenAI', }
	}
	else if (providerName === 'deepseek') {
		return { title: 'DeepSeek', }
	}
	else if (providerName === 'openRouter') {
		return { title: 'OpenRouter', }
	}
	else if (providerName === 'godmode') {
		return { title: 'G0DM0D3', }
	}
	else if (providerName === 'ollama') {
		return { title: 'Ollama', }
	}
	else if (providerName === 'vLLM') {
		return { title: 'vLLM', }
	}
	else if (providerName === 'liteLLM') {
		return { title: 'LiteLLM', }
	}
	else if (providerName === 'lmStudio') {
		return { title: 'LM Studio', }
	}
	else if (providerName === 'openAICompatible') {
		return { title: 'OpenAI-Compatible', }
	}
	else if (providerName === 'gemini') {
		return { title: 'Gemini', }
	}
	else if (providerName === 'groq') {
		return { title: 'Groq', }
	}
	else if (providerName === 'xAI') {
		return { title: 'Grok (xAI)', }
	}
	else if (providerName === 'mistral') {
		return { title: 'Mistral', }
	}
	else if (providerName === 'googleVertex') {
		return { title: 'Google Vertex AI', }
	}
	else if (providerName === 'microsoftAzure') {
		return { title: 'Microsoft Azure OpenAI', }
	}
	else if (providerName === 'awsBedrock') {
		return { title: 'AWS Bedrock', }
	}

	throw new Error(`descOfProviderName: Unknown provider name: "${providerName}"`)
}

export const subTextMdOfProviderName = (providerName: ProviderName): string => {

	if (providerName === 'anthropic') return 'Get your [API Key here](https://console.anthropic.com/settings/keys).'
	if (providerName === 'openAI') return 'Get your [API Key here](https://platform.openai.com/api-keys).'
	if (providerName === 'deepseek') return 'Get your [API Key here](https://platform.deepseek.com/api_keys).'
	if (providerName === 'openRouter') return 'Get your [API Key here](https://openrouter.ai/settings/keys). Read about [rate limits here](https://openrouter.ai/docs/api-reference/limits).'
	if (providerName === 'godmode') return 'Connect to [G0DM0D3.ai](https://godmod3.ai), an OpenAI-compatible gateway to 50+ models. You need **two keys**: a G0DM0D3 API key (Bearer auth) and an [OpenRouter API key](https://openrouter.ai/settings/keys) (passed per-request as `openrouter_api_key`). If you already configured OpenRouter below, you can leave the OpenRouter key blank here. Read the [API docs](https://github.com/elder-plinius/G0DM0D3/blob/main/API.md).'
	if (providerName === 'gemini') return 'Get your [API Key here](https://aistudio.google.com/apikey). Read about [rate limits here](https://ai.google.dev/gemini-api/docs/rate-limits#current-rate-limits).'
	if (providerName === 'groq') return 'Get your [API Key here](https://console.groq.com/keys).'
	if (providerName === 'xAI') return 'Get your [API Key here](https://console.x.ai).'
	if (providerName === 'mistral') return 'Get your [API Key here](https://console.mistral.ai/api-keys).'
	if (providerName === 'openAICompatible') return `Use any OpenAI-compatible local or remote endpoint (llama.cpp, vLLM, LM Studio, etc.). API key is optional for localhost/LAN endpoints.`
	if (providerName === 'googleVertex') return 'You must authenticate before using Vertex with veritIDE. Read more about endpoints [here](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/call-vertex-using-openai-library), and regions [here](https://cloud.google.com/vertex-ai/docs/general/locations#available-regions).'
	if (providerName === 'microsoftAzure') return 'Read more about endpoints [here](https://learn.microsoft.com/en-us/rest/api/aifoundry/model-inference/get-chat-completions/get-chat-completions?view=rest-aifoundry-model-inference-2024-05-01-preview&tabs=HTTP), and get your API key [here](https://learn.microsoft.com/en-us/azure/search/search-security-api-keys?tabs=rest-use%2Cportal-find%2Cportal-query#find-existing-keys).'
	if (providerName === 'awsBedrock') return 'Connect via a LiteLLM proxy or the AWS [Bedrock-Access-Gateway](https://github.com/aws-samples/bedrock-access-gateway). LiteLLM Bedrock setup docs are [here](https://docs.litellm.ai/docs/providers/bedrock).'
	if (providerName === 'ollama') return 'Read more about custom [Endpoints here](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-expose-ollama-on-my-network).'
	if (providerName === 'vLLM') return 'Read more about custom [Endpoints here](https://docs.vllm.ai/en/latest/getting_started/quickstart.html#openai-compatible-server).'
	if (providerName === 'lmStudio') return 'Read more about custom [Endpoints here](https://lmstudio.ai/docs/app/api/endpoints/openai).'
	if (providerName === 'liteLLM') return 'Read more about endpoints [here](https://docs.litellm.ai/docs/providers/openai_compatible).'

	throw new Error(`subTextMdOfProviderName: Unknown provider name: "${providerName}"`)
}

type DisplayInfo = {
	title: string;
	placeholder: string;
	isPasswordField?: boolean;
}
export const displayInfoOfSettingName = (providerName: ProviderName, settingName: SettingName): DisplayInfo => {
	if (settingName === 'apiKey') {
		return {
			title: 'API Key',

			// **Please follow this convention**:
			// The word "key..." here is a placeholder for the hash. For example, sk-ant-key... means the key will look like sk-ant-abcdefg123...
			placeholder: providerName === 'anthropic' ? 'sk-ant-key...' : // sk-ant-api03-key
				providerName === 'openAI' ? 'sk-proj-key...' :
					providerName === 'deepseek' ? 'sk-key...' :
						providerName === 'openRouter' ? 'sk-or-key...' : // sk-or-v1-key
							providerName === 'gemini' ? 'AIzaSy...' :
								providerName === 'groq' ? 'gsk_key...' :
								providerName === 'godmode' ? 'godmode-key...' :
									providerName === 'openAICompatible' ? 'sk-key...' :
										providerName === 'xAI' ? 'xai-key...' :
											providerName === 'mistral' ? 'api-key...' :
												providerName === 'googleVertex' ? 'AIzaSy...' :
													providerName === 'microsoftAzure' ? 'key-...' :
														providerName === 'awsBedrock' ? 'key-...' :
															'',

			isPasswordField: true,
		}
	}
	else if (settingName === 'openRouterApiKey') {
		return {
			title: 'OpenRouter API Key',
			placeholder: 'sk-or-key...',
			isPasswordField: true,
		}
	}
	else if (settingName === 'endpoint') {
		return {
			title: providerName === 'ollama' ? 'Endpoint' :
				providerName === 'vLLM' ? 'Endpoint' :
					providerName === 'lmStudio' ? 'Endpoint' :
						providerName === 'godmode' ? 'baseURL' :
						providerName === 'openAICompatible' ? 'baseURL' : // (do not include /chat/completions)
							providerName === 'googleVertex' ? 'baseURL' :
								providerName === 'microsoftAzure' ? 'baseURL' :
									providerName === 'liteLLM' ? 'baseURL' :
										providerName === 'awsBedrock' ? 'Endpoint' :
											'(never)',

			placeholder: providerName === 'ollama' ? defaultProviderSettings.ollama.endpoint
				: providerName === 'vLLM' ? defaultProviderSettings.vLLM.endpoint
					: providerName === 'godmode' ? defaultProviderSettings.godmode.endpoint
					: providerName === 'openAICompatible' ? 'http://127.0.0.1:8080/v1'
						: providerName === 'lmStudio' ? defaultProviderSettings.lmStudio.endpoint
							: providerName === 'liteLLM' ? 'http://localhost:4000'
								: providerName === 'awsBedrock' ? 'http://localhost:4000/v1'
									: '(never)',


		}
	}
	else if (settingName === 'headersJSON') {
		return { title: 'Custom Headers', placeholder: '{ "X-Request-Id": "..." }' }
	}
	else if (settingName === 'region') {
		// vertex only
		return {
			title: 'Region',
			placeholder: providerName === 'googleVertex' ? defaultProviderSettings.googleVertex.region
				: providerName === 'awsBedrock'
					? defaultProviderSettings.awsBedrock.region
					: ''
		}
	}
	else if (settingName === 'azureApiVersion') {
		// azure only
		return {
			title: 'API Version',
			placeholder: providerName === 'microsoftAzure' ? defaultProviderSettings.microsoftAzure.azureApiVersion
				: ''
		}
	}
	else if (settingName === 'project') {
		return {
			title: providerName === 'microsoftAzure' ? 'Resource'
				: providerName === 'googleVertex' ? 'Project'
					: '',
			placeholder: providerName === 'microsoftAzure' ? 'my-resource'
				: providerName === 'googleVertex' ? 'my-project'
					: ''

		}

	}
	else if (settingName === '_didFillInProviderSettings') {
		return {
			title: '(never)',
			placeholder: '(never)',
		}
	}
	else if (settingName === 'models') {
		return {
			title: '(never)',
			placeholder: '(never)',
		}
	}

	throw new Error(`displayInfo: Unknown setting name: "${settingName}"`)
}


const defaultCustomSettings: Record<CustomSettingName, undefined> = {
	apiKey: undefined,
	openRouterApiKey: undefined,
	endpoint: undefined,
	region: undefined, // googleVertex
	project: undefined,
	azureApiVersion: undefined,
	headersJSON: undefined,
}


const modelInfoOfDefaultModelNames = (defaultModelNames: string[]): { models: VoidStatefulModelInfo[] } => {
	return {
		models: defaultModelNames.map((modelName, i) => ({
			modelName,
			type: 'default',
			isHidden: defaultModelNames.length >= 10, // hide all models if there are a ton of them, and make user enable them individually
		}))
	}
}

// used when waiting and for a type reference
export const defaultSettingsOfProvider: SettingsOfProvider = {
	anthropic: {
		...defaultCustomSettings,
		...defaultProviderSettings.anthropic,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.anthropic),
		_didFillInProviderSettings: undefined,
	},
	openAI: {
		...defaultCustomSettings,
		...defaultProviderSettings.openAI,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.openAI),
		_didFillInProviderSettings: undefined,
	},
	deepseek: {
		...defaultCustomSettings,
		...defaultProviderSettings.deepseek,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.deepseek),
		_didFillInProviderSettings: undefined,
	},
	gemini: {
		...defaultCustomSettings,
		...defaultProviderSettings.gemini,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.gemini),
		_didFillInProviderSettings: undefined,
	},
	xAI: {
		...defaultCustomSettings,
		...defaultProviderSettings.xAI,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.xAI),
		_didFillInProviderSettings: undefined,
	},
	mistral: {
		...defaultCustomSettings,
		...defaultProviderSettings.mistral,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.mistral),
		_didFillInProviderSettings: undefined,
	},
	liteLLM: {
		...defaultCustomSettings,
		...defaultProviderSettings.liteLLM,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.liteLLM),
		_didFillInProviderSettings: undefined,
	},
	lmStudio: {
		...defaultCustomSettings,
		...defaultProviderSettings.lmStudio,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.lmStudio),
		_didFillInProviderSettings: undefined,
	},
	groq: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.groq,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.groq),
		_didFillInProviderSettings: undefined,
	},
	openRouter: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.openRouter,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.openRouter),
		_didFillInProviderSettings: undefined,
	},
	godmode: { // aggregator (serves models from multiple providers via G0DM0D3.ai)
		...defaultCustomSettings,
		...defaultProviderSettings.godmode,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.godmode),
		_didFillInProviderSettings: undefined,
	},
	openAICompatible: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.openAICompatible,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.openAICompatible),
		_didFillInProviderSettings: undefined,
	},
	ollama: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.ollama,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.ollama),
		_didFillInProviderSettings: undefined,
	},
	vLLM: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.vLLM,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.vLLM),
		_didFillInProviderSettings: undefined,
	},
	googleVertex: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.googleVertex,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.googleVertex),
		_didFillInProviderSettings: undefined,
	},
	microsoftAzure: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.microsoftAzure,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.microsoftAzure),
		_didFillInProviderSettings: undefined,
	},
	awsBedrock: { // aggregator (serves models from multiple providers)
		...defaultCustomSettings,
		...defaultProviderSettings.awsBedrock,
		...modelInfoOfDefaultModelNames(defaultModelsOfProvider.awsBedrock),
		_didFillInProviderSettings: undefined,
	},
}


export type ModelSelection = { providerName: ProviderName, modelName: string }

export const modelSelectionsEqual = (m1: ModelSelection, m2: ModelSelection) => {
	return m1.modelName === m2.modelName && m1.providerName === m2.providerName
}

// this is a state
export const featureNames = ['Chat', 'Ctrl+K', 'Autocomplete', 'Apply', 'SCM'] as const
export type ModelSelectionOfFeature = Record<(typeof featureNames)[number], ModelSelection | null>
export type FeatureName = keyof ModelSelectionOfFeature

export const displayInfoOfFeatureName = (featureName: FeatureName) => {
	// editor:
	if (featureName === 'Autocomplete')
		return 'Autocomplete'
	else if (featureName === 'Ctrl+K')
		return 'Quick Edit'
	// sidebar:
	else if (featureName === 'Chat')
		return 'Chat'
	else if (featureName === 'Apply')
		return 'Apply'
	// source control:
	else if (featureName === 'SCM')
		return 'Commit Message Generator'
	else
		throw new Error(`Feature Name ${featureName} not allowed`)
}


// the models of these can be refreshed (in theory all can, but not all should)
export const refreshableProviderNames = localProviderNames
export type RefreshableProviderName = typeof refreshableProviderNames[number]

// manual-only refresh (no auto-polling) — remote providers where we should not hit the API every 5s
export const manuallyRefreshableProviderNames = ['godmode'] as const satisfies ProviderName[]
export type ManuallyRefreshableProviderName = typeof manuallyRefreshableProviderNames[number]
export type ModelRefreshProviderName = RefreshableProviderName | ManuallyRefreshableProviderName

/** True when endpoint points at localhost or a private LAN address. */
export const isLocalEndpoint = (endpoint: string): boolean => {
	if (!endpoint?.trim()) {
		return false;
	}
	try {
		const url = new URL(endpoint.includes('://') ? endpoint : `http://${endpoint}`);
		const host = url.hostname.toLowerCase();
		if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
			return true;
		}
		if (/^10\.\d+\.\d+\.\d+$/.test(host)) {
			return true;
		}
		if (/^192\.168\.\d+\.\d+$/.test(host)) {
			return true;
		}
		if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)) {
			return true;
		}
		return false;
	} catch {
		return false;
	}
};

/** Whether required provider fields are filled (local OpenAI-compatible may omit apiKey). */
export const providerSettingsAreFilled = (providerName: ProviderName, settings: SettingsOfProvider[ProviderName]): boolean => {
	for (const key of Object.keys(defaultProviderSettings[providerName])) {
		const val = (settings as Record<string, unknown>)[key];
		if (providerName === 'openAICompatible' && key === 'apiKey') {
			const endpoint = String((settings as SettingsAtProvider<'openAICompatible'>).endpoint ?? '');
			if (isLocalEndpoint(endpoint)) {
				continue;
			}
		}
		if (providerName === 'godmode' && key === 'openRouterApiKey') {
			// optional — falls back to the OpenRouter provider key at request time
			continue;
		}
		if (!val) {
			return false;
		}
	}
	return true;
};

// models that come with download buttons
export const hasDownloadButtonsOnModelsProviderNames = ['ollama'] as const satisfies ProviderName[]





// use this in isFeatuerNameDissbled
export const isProviderNameDisabled = (providerName: ProviderName, settingsState: VoidSettingsState) => {

	const settingsAtProvider = settingsState.settingsOfProvider[providerName]
	const isAutodetected = (refreshableProviderNames as string[]).includes(providerName)

	const isDisabled = settingsAtProvider.models.length === 0
	if (isDisabled) {
		return isAutodetected ? 'providerNotAutoDetected' : (!settingsAtProvider._didFillInProviderSettings ? 'notFilledIn' : 'addModel')
	}
	return false
}

export const isFeatureNameDisabled = (featureName: FeatureName, settingsState: VoidSettingsState) => {
	// if has a selected provider, check if it's enabled
	const selectedProvider = settingsState.modelSelectionOfFeature[featureName]

	if (selectedProvider) {
		const { providerName } = selectedProvider
		return isProviderNameDisabled(providerName, settingsState)
	}

	// if there are any models they can turn on, tell them that
	const canTurnOnAModel = !!providerNames.find(providerName => settingsState.settingsOfProvider[providerName].models.filter(m => m.isHidden).length !== 0)
	if (canTurnOnAModel) return 'needToEnableModel'

	// if there are any providers filled in, then they just need to add a model
	const anyFilledIn = !!providerNames.find(providerName => settingsState.settingsOfProvider[providerName]._didFillInProviderSettings)
	if (anyFilledIn) return 'addModel'

	return 'addProvider'
}







export type ChatMode = 'agent' | 'gather' | 'normal'


export type GlobalSettings = {
	autoRefreshModels: boolean;
	aiInstructions: string;
	enableAutocomplete: boolean;
	syncApplyToChat: boolean;
	syncSCMToChat: boolean;
	enableFastApply: boolean;
	chatMode: ChatMode;
	autoApprove: { [approvalType in ToolApprovalType]?: boolean };
	showInlineSuggestions: boolean;
	includeToolLintErrors: boolean;
	isOnboardingComplete: boolean;
	disableSystemMessage: boolean;
	autoAcceptLLMChanges: boolean;
	/** Opt-in: anonymous usage metrics (default off). */
	enableUsageMetrics: boolean;
	/** Opt-in: automatic update checks (default off). */
	enableUpdateChecks: boolean;
	/** Opt-in: fetch capability packs from the network (default off). */
	enableCapabilityPacks: boolean;
	/** URL for remote capability pack when enableCapabilityPacks is true. */
	capabilityPackUrl: string;
}

export const defaultGlobalSettings: GlobalSettings = {
	autoRefreshModels: true,
	aiInstructions: '',
	enableAutocomplete: false,
	syncApplyToChat: true,
	syncSCMToChat: true,
	enableFastApply: true,
	chatMode: 'agent',
	autoApprove: {},
	showInlineSuggestions: true,
	includeToolLintErrors: true,
	isOnboardingComplete: false,
	disableSystemMessage: false,
	autoAcceptLLMChanges: false,
	enableUsageMetrics: false,
	enableUpdateChecks: false,
	enableCapabilityPacks: false,
	capabilityPackUrl: 'https://raw.githubusercontent.com/Axenex/verit/main/resources/capabilities/veritide-model-catalog.json',
}

export type GlobalSettingName = keyof GlobalSettings
export const globalSettingNames = Object.keys(defaultGlobalSettings) as GlobalSettingName[]












export type ModelSelectionOptions = {
	reasoningEnabled?: boolean;
	reasoningBudget?: number;
	reasoningEffort?: string;
}

export type OptionsOfModelSelection = {
	[featureName in FeatureName]: Partial<{
		[providerName in ProviderName]: {
			[modelName: string]: ModelSelectionOptions | undefined
		}
	}>
}





export type OverridesOfModel = {
	[providerName in ProviderName]: {
		[modelName: string]: Partial<ModelOverrides> | undefined
	}
}


const overridesOfModel = {} as OverridesOfModel
for (const providerName of providerNames) { overridesOfModel[providerName] = {} }
export const defaultOverridesOfModel = overridesOfModel



export interface MCPUserStateOfName {
	[serverName: string]: MCPUserState | undefined;
}

export interface MCPUserState {
	isOn: boolean;
}
