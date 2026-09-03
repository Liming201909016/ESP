[CmdletBinding()]
param(
    [switch]$PlanOnly,
    [string]$ManifestPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'config\solution-manifest.json'),
    [string]$OutputRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'src\solutions')
)

$ErrorActionPreference = 'Stop'
$pacInstallRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\PowerAppsCLI'
if (-not (Get-Command pac -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $pacInstallRoot 'pac.cmd'))) {
    $env:PATH = "$pacInstallRoot;$env:PATH"
}

if (-not (Test-Path $ManifestPath)) {
    throw "Solution manifest does not exist: $ManifestPath"
}

$manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$publisherName = [string]$manifest.publisher.name
$publisherPrefix = [string]$manifest.publisher.prefix
$solutions = @($manifest.solutions)

if ($publisherName -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
    throw 'Publisher name must contain only letters, digits, or underscore and cannot start with a digit.'
}
if ($publisherPrefix -notmatch '^[A-Za-z][A-Za-z0-9]{1,7}$' -or $publisherPrefix -match '^mscrm') {
    throw 'Publisher prefix must be 2-8 alphanumeric characters, start with a letter, and not start with mscrm.'
}
if ($solutions.Count -eq 0) {
    throw 'Solution manifest contains no solutions.'
}

$solutionNames = @($solutions | ForEach-Object { [string]$_.uniqueName })
if ($solutionNames.Count -ne (@($solutionNames | Sort-Object -Unique)).Count) {
    throw 'Solution unique names must not be duplicated.'
}
foreach ($solutionName in $solutionNames) {
    if ($solutionName -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
        throw "Invalid solution unique name: $solutionName"
    }
}

$solutionNameSet = @{}
for ($index = 0; $index -lt $solutionNames.Count; $index++) {
    $solutionNameSet[$solutionNames[$index]] = $index
}
foreach ($solution in $solutions) {
    $solutionName = [string]$solution.uniqueName
    foreach ($dependency in @($solution.dependsOn)) {
        $dependencyName = [string]$dependency
        if (-not $solutionNameSet.ContainsKey($dependencyName)) {
            throw "Solution $solutionName references unknown dependency: $dependencyName"
        }
        if ($solutionNameSet[$dependencyName] -ge $solutionNameSet[$solutionName]) {
            throw "Solution manifest order is invalid or circular: $solutionName depends on $dependencyName"
        }
    }
}

$pac = Get-Command pac -ErrorAction SilentlyContinue
if (-not $PlanOnly -and -not $pac) {
    throw 'Power Platform CLI is required. Install the Windows MSI from https://aka.ms/PowerAppsCLI and rerun this script.'
}

foreach ($solution in $solutions) {
    $solutionName = [string]$solution.uniqueName
    $solutionPath = Join-Path $OutputRoot $solutionName
    $arguments = @(
        'solution', 'init',
        '--publisher-name', $publisherName,
        '--publisher-prefix', $publisherPrefix,
        '--outputDirectory', $solutionPath
    )
    if ($PlanOnly) {
        Write-Output ([pscustomobject]@{
            Solution = $solutionName
            DependsOn = @($solution.dependsOn) -join ', '
            Purpose = [string]$solution.purpose
            OutputDirectory = $solutionPath
            Command = 'pac ' + ($arguments -join ' ')
        })
        continue
    }
    if (Test-Path $solutionPath) {
        throw "Refusing to overwrite existing solution directory: $solutionPath"
    }
    & $pac.Source @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "pac solution init failed for $solutionName with exit code $LASTEXITCODE"
    }
}

if ($PlanOnly) {
    Write-Output "Solution initialization plan: PASS ($($solutions.Count) solutions)"
} else {
    Write-Output "Solution initialization: PASS ($($solutions.Count) solutions)"
}