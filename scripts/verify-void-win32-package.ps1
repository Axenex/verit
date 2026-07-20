# Verifies a packaged Void win32 build includes AI IDE features and (optionally)
# that Inno Setup installer EXEs were produced.
#
# Usage:
#   pwsh scripts/verify-void-win32-package.ps1 -AppDir ..\VSCode-win32-x64
#   pwsh scripts/verify-void-win32-package.ps1 -AppDir ..\VSCode-win32-x64 -RequireInstallers
#   pwsh scripts/verify-void-win32-package.ps1 -AppDir 'C:\Program Files\Void' -DistDir dist

param(
	[Parameter(Mandatory = $true)]
	[string] $AppDir,

	[string] $DistDir = '',

	[switch] $RequireInstallers
)

$ErrorActionPreference = 'Stop'

function Assert-Path([string] $Path, [string] $Label) {
	if (-not (Test-Path -LiteralPath $Path)) {
		throw "Missing $Label`: $Path"
	}
	Write-Host "OK  $Label => $Path"
}

function Assert-WorkbenchContains([string] $WorkbenchJs, [string[]] $Needles) {
	# Stream-scan to avoid loading the full ~16MB bundle into memory twice.
	$bytes = [System.IO.File]::ReadAllBytes($WorkbenchJs)
	$text = [System.Text.Encoding]::UTF8.GetString($bytes)
	foreach ($needle in $Needles) {
		if ($text.IndexOf($needle, [System.StringComparison]::Ordinal) -lt 0) {
			throw "Workbench bundle missing Void feature marker: $needle"
		}
		Write-Host "OK  workbench contains '$needle'"
	}
}

Assert-Path $AppDir 'app directory'

$exe = Join-Path $AppDir 'Void.exe'
$productJson = Join-Path $AppDir 'resources\app\product.json'
$workbenchJs = Join-Path $AppDir 'resources\app\out\vs\workbench\workbench.desktop.main.js'

Assert-Path $exe 'Void.exe'
Assert-Path $productJson 'product.json'
Assert-Path $workbenchJs 'workbench.desktop.main.js'

$product = Get-Content -Raw -LiteralPath $productJson | ConvertFrom-Json
foreach ($field in @('nameShort', 'nameLong', 'voidVersion', 'voidRelease', 'applicationName', 'win32DirName', 'urlProtocol')) {
	if (-not $product.$field) {
		throw "product.json missing required field: $field"
	}
	Write-Host "OK  product.$field = $($product.$field)"
}

if ($product.nameShort -ne 'Void' -or $product.nameLong -ne 'Void') {
	throw "Unexpected product branding: nameShort=$($product.nameShort) nameLong=$($product.nameLong)"
}

# Markers that must survive minify for Void AI features to be present.
Assert-WorkbenchContains $workbenchJs @(
	'voidOnboarding',
	'void-settings',
	'sendLLMMessage',
	'EditCodeService',
	'Welcome to Void',
	'Fast Apply',
	'void-onboarding',
	'ModelDropdown',
	'toolsService',
	'mcpService',
	'chatThread',
	'QuickEdit',
	'ollama',
	'Anthropic'
)

# React entry bundles are required before packaging; if present under src they
# were compiled. After minify they live inside workbench.desktop.main.js.
$reactOut = Join-Path $PSScriptRoot '..\src\vs\workbench\contrib\void\browser\react\out'
if (Test-Path -LiteralPath $reactOut) {
	$entries = @(
		'sidebar-tsx\index.js',
		'void-settings-tsx\index.js',
		'void-onboarding\index.js',
		'quick-edit-tsx\index.js',
		'void-editor-widgets-tsx\index.js',
		'void-tooltip\index.js',
		'diff\index.js'
	)
	foreach ($rel in $entries) {
		Assert-Path (Join-Path $reactOut $rel) "react out $rel"
	}
} else {
	Write-Host "SKIP react/out tree (not present next to sources; OK for installed packages)"
}

if ($RequireInstallers) {
	if (-not $DistDir) {
		throw '-RequireInstallers needs -DistDir (folder containing VoidSetup-x64.exe)'
	}
	Assert-Path (Join-Path $DistDir 'VoidSetup-x64.exe') 'system installer'
	Assert-Path (Join-Path $DistDir 'VoidUserSetup-x64.exe') 'user installer'
}

Write-Host ''
Write-Host 'Void win32 package verification passed.'
