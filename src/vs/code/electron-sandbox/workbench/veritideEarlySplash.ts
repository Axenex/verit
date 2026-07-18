/*---------------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------------*/

import { showVeritideStartupSplash } from '../../../workbench/contrib/void/browser/veritideStartupSplashDom.js';

/** VSC-II boot animation — shown on every window before the workbench bundle finishes loading. */
export function showVeritideEarlySplash(): void {
	performance.mark('code/willShowVeritideSplash');
	showVeritideStartupSplash(window);
}
