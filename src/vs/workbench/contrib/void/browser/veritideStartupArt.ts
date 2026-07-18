/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

/** Minimum time the VSC-II splash stays visible (ms). */
export const STARTUP_MIN_MS = 2800;

/** Line-by-line reveal delay for ASCII art (ms). */
export const ASCII_LINE_DELAY_MS = 120;

/** Delay between boot log lines (ms). */
export const BOOT_LOG_DELAY_MS = 180;

/**
 * Large block ASCII "VSC-II" logo — retro VSCS-II / Lunamoth terminal aesthetic.
 * Revealed line-by-line during startup.
 */
export const VSC_II_ASCII_ART: readonly string[] = [
	'██╗   ██╗███████╗ ██████╗      ██╗██╗',
	'██║   ██║██╔════╝██╔════╝     ███║██║',
	'██║   ██║███████╗██║    █████╗╚██║██║',
	'╚██╗ ██╔╝╚════██║██║    ╚════╝ ██║██║',
	' ╚████╔╝ ███████║╚██████╗     ██║██║',
	'  ╚═══╝  ╚══════╝ ╚═════╝     ╚═╝╚═╝',
];

export const VSC_II_SUBTITLE = 'VERY SECURE CODING SYSTEM  MK.II';

/** Boot sequence log lines (typed before the logo finishes). */
export const BOOT_LOG_LINES: readonly string[] = [
	'LUNAMOTH SECURE KERNEL ............... OK',
	'PRIVACY ENFORCEMENT MODULE ........... OK',
	'LOCAL MODEL INTERFACE ................ OK',
	'CENSORSHIP BYPASS .................... OK',
	'LOADING veritIDE WORKBENCH ............',
];

export const BOOT_FOOTER_LINES: readonly string[] = [
	'',
	'PRESS ANY KEY OR CLICK TO SKIP',
];
