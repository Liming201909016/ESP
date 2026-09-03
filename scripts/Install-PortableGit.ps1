[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$version = '2.55.0.5'
$expectedHash = '05843f9d6e60306c3ab886799e2c67200caab921571f10512df3493049179ddb'
$downloadUrl = "https://github.com/git-for-windows/git/releases/download/v2.55.0.windows.5/MinGit-$version-arm64.zip"
$archivePath = Join-Path $env:TEMP "MinGit-$version-arm64.zip"
$installPath = Join-Path $env:LOCALAPPDATA 'Programs\MinGit'

curl.exe -L --fail --output $archivePath $downloadUrl
if ($LASTEXITCODE -ne 0) {
    throw "MinGit download failed with exit code $LASTEXITCODE"
}

$actualHash = (Get-FileHash $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) {
    throw "MinGit hash mismatch: $actualHash"
}

if (Test-Path $installPath) {
    Remove-Item $installPath -Recurse -Force
}
Expand-Archive $archivePath $installPath

$git = Join-Path $installPath 'cmd\git.exe'
if (-not (Test-Path $git)) {
    throw "Git executable was not installed: $git"
}

& $git --version
if ($LASTEXITCODE -ne 0) {
    throw 'Portable Git validation failed.'
}
Write-Output "Portable Git installed: $git"