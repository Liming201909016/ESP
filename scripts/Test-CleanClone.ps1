[CmdletBinding()]
param(
    [string]$SourceRepository
)

$ErrorActionPreference = 'Stop'
if (-not $SourceRepository) {
    $SourceRepository = Split-Path -Parent $PSScriptRoot
}
$git = Join-Path $env:LOCALAPPDATA 'Programs\MinGit\cmd\git.exe'
$nodeRoot = Split-Path (Get-Command node -ErrorAction Stop).Source
$npm = Join-Path $nodeRoot 'npm.cmd'
$npx = Join-Path $nodeRoot 'npx.cmd'
$python = (Get-Command python -ErrorAction Stop).Source
$target = Join-Path $env:TEMP 'esp-clean-clone-validation'

if (Test-Path $target) {
    Remove-Item $target -Recurse -Force
}

& $git clone --quiet $SourceRepository $target
if ($LASTEXITCODE -ne 0) { throw 'Clean clone failed.' }

Push-Location $target
try {
    & $npm ci --no-audit --no-fund --loglevel=error
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed in clean clone.' }

    & $npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { throw 'Playwright Chromium setup failed in clean clone.' }

    & $python -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Python virtual environment creation failed in clean clone.' }
    & '.\.venv\Scripts\python.exe' -m pip install --disable-pip-version-check --quiet -r requirements-dev.txt
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed in clean clone.' }

    & $npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Application build failed in clean clone.' }
    & $npm test
    if ($LASTEXITCODE -ne 0) { throw 'Application tests failed in clean clone.' }
    & $npm run evaluate
    if ($LASTEXITCODE -ne 0) { throw 'Application evaluation failed in clean clone.' }

    Write-Output "Clean clone validation: PASS ($target)"
} finally {
    Pop-Location
}