[CmdletBinding()]
param(
    [string]$RemoteUrl = 'https://github.com/Liming201909016/ESP.git',
    [string]$AuthorName = 'Liming',
    [string]$AuthorEmail = 'limzha@microsoft.com',
    [switch]$Push
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$git = Join-Path $env:LOCALAPPDATA 'Programs\MinGit\cmd\git.exe'
if (-not (Test-Path $git)) {
    throw 'Portable Git is not installed. Run scripts\Install-PortableGit.ps1 first.'
}

Set-Location $repoRoot
if (-not (Test-Path '.git')) {
    & $git init -b main
    if ($LASTEXITCODE -ne 0) { throw 'Git initialization failed.' }
}

& $git config user.name $AuthorName
& $git config user.email $AuthorEmail

$remoteNames = @(& $git remote)
if ($remoteNames -contains 'origin') {
    $existingRemote = & $git remote get-url origin
    if ($existingRemote -ne $RemoteUrl) {
        throw "Existing origin does not match the approved repository: $existingRemote"
    }
} else {
    & $git remote add origin $RemoteUrl
    if ($LASTEXITCODE -ne 0) { throw 'Adding the GitHub remote failed.' }
}

$forbiddenTrackedPaths = @('.venv/', 'artifacts/', '.vscode/tasks.json')
$candidatePaths = @(& $git ls-files --others --cached --exclude-standard)
foreach ($forbiddenPath in $forbiddenTrackedPaths) {
    if ($candidatePaths | Where-Object { $_ -eq $forbiddenPath.TrimEnd('/') -or $_.StartsWith($forbiddenPath) }) {
        throw "Forbidden generated or local path would be published: $forbiddenPath"
    }
}

$secretPattern = '(?i)(client[_-]?secret|api[_-]?key|access[_-]?token|password)\s*[:=]\s*["''][^"'']+["'']'
$textExtensions = @('.md', '.json', '.py', '.ps1', '.cjs', '.xml', '.cdsproj', '.txt', '.gitignore')
foreach ($relativePath in $candidatePaths) {
    $fullPath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path $fullPath -PathType Leaf)) { continue }
    if ($textExtensions -notcontains [IO.Path]::GetExtension($fullPath) -and [IO.Path]::GetFileName($fullPath) -ne '.gitignore') { continue }
    $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
    if ($content -match $secretPattern) {
        throw "Potential secret detected before publish: $relativePath"
    }
}

& (Join-Path $repoRoot 'scripts\Test-FoundationReadiness.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Foundation validation failed before publish.' }

& $git add .
if ($LASTEXITCODE -ne 0) { throw 'Git staging failed.' }
& $git diff --cached --check -- '*.py' '*.ps1' '*.json' '*.cjs' '*.xml' '*.txt' '.gitignore' '.gitattributes'
if ($LASTEXITCODE -ne 0) { throw 'Git staged diff validation failed.' }

$hasHead = Test-Path (Join-Path $repoRoot '.git\refs\heads\main')
if (-not $hasHead) {
    & $git commit -m 'Initial ESP Hackathon foundation'
    if ($LASTEXITCODE -ne 0) { throw 'Initial Git commit failed.' }
} elseif (@(& $git diff --cached --name-only).Count -eq 0) {
    Write-Output 'No staged changes require a commit.'
} else {
    & $git commit -m 'Update ESP Hackathon foundation'
    if ($LASTEXITCODE -ne 0) { throw 'Git commit failed.' }
}

& $git status --short --branch
& $git log -1 --oneline

if ($Push) {
    & $git push -u origin main
    if ($LASTEXITCODE -ne 0) { throw 'GitHub push failed.' }
    Write-Output "GitHub publish: PASS ($RemoteUrl)"
} else {
    Write-Output 'Local commit: PASS. Rerun with -Push to publish.'
}