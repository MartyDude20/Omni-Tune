# build-helper.ps1 — builds vr-helper.exe and copies it to resources/
# Run from the project root in PowerShell:  .\build-helper.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root       = $PSScriptRoot
$vrHelper   = Join-Path $root "vr-helper"
$openvrDir  = Join-Path $vrHelper "openvr"
$resources  = Join-Path $root "resources"
$cmake      = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"

# ── 1. Download OpenVR SDK if not present ───────────────────────────────────
if (-not (Test-Path "$openvrDir\headers\openvr.h")) {
    Write-Host "Downloading OpenVR SDK..." -ForegroundColor Cyan
    $zip = Join-Path $env:TEMP "openvr.zip"
    Invoke-WebRequest -Uri "https://github.com/ValveSoftware/openvr/archive/refs/tags/v2.5.1.zip" -OutFile $zip
    $tmpExtract = Join-Path $env:TEMP "openvr_sdk"
    if (Test-Path $tmpExtract) { Remove-Item $tmpExtract -Recurse -Force }
    Expand-Archive -Path $zip -DestinationPath $tmpExtract

    $sdkRoot = Join-Path $tmpExtract "openvr-2.5.1"
    Copy-Item "$sdkRoot\headers\openvr.h"              "$openvrDir\headers\openvr.h"          -Force
    Copy-Item "$sdkRoot\lib\win64\openvr_api.lib"      "$openvrDir\lib\win64\openvr_api.lib"  -Force
    Copy-Item "$sdkRoot\bin\win64\openvr_api.dll"      "$openvrDir\bin\win64\openvr_api.dll"  -Force
    Remove-Item $tmpExtract -Recurse -Force
    Remove-Item $zip -Force
    Write-Host "OpenVR SDK extracted." -ForegroundColor Green
} else {
    Write-Host "OpenVR SDK already present." -ForegroundColor Green
}

# ── 2. CMake configure + build ───────────────────────────────────────────────
$buildDir = Join-Path $vrHelper "build"
Write-Host "Configuring CMake..." -ForegroundColor Cyan
& $cmake -B $buildDir -S $vrHelper -G "Visual Studio 17 2022" -A x64
if ($LASTEXITCODE -ne 0) { throw "CMake configure failed" }

Write-Host "Building..." -ForegroundColor Cyan
& $cmake --build $buildDir --config Release
if ($LASTEXITCODE -ne 0) { throw "CMake build failed" }

# ── 3. Copy outputs to resources/ ───────────────────────────────────────────
New-Item -ItemType Directory -Path $resources -Force | Out-Null
Copy-Item "$buildDir\Release\vr-helper.exe"       "$resources\vr-helper.exe"   -Force
Copy-Item "$openvrDir\bin\win64\openvr_api.dll"   "$resources\openvr_api.dll"  -Force

Write-Host "Done. vr-helper.exe and openvr_api.dll are in resources/." -ForegroundColor Green
