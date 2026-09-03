[CmdletBinding()]
param(
    [switch]$PlanOnly,
    [string]$ManifestPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'config\solution-manifest.json'),
    [string]$SolutionRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'src\solutions'),
    [string]$OutputRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'artifacts\solutions')
)

$ErrorActionPreference = 'Stop'
$pacInstallRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\PowerAppsCLI'
if (-not (Get-Command pac -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $pacInstallRoot 'pac.cmd'))) {
    $env:PATH = "$pacInstallRoot;$env:PATH"
}
if (-not (Get-Command pac -ErrorAction SilentlyContinue)) {
    throw 'Power Platform CLI is required.'
}
if (-not (Test-Path $ManifestPath)) {
    throw "Solution manifest does not exist: $ManifestPath"
}

$manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$solutions = @($manifest.solutions)
if (-not $PlanOnly -and -not (Test-Path $OutputRoot)) {
    New-Item -ItemType Directory -Path $OutputRoot | Out-Null
}

foreach ($solution in $solutions) {
    $solutionName = [string]$solution.uniqueName
    $sourcePath = Join-Path (Join-Path $SolutionRoot $solutionName) 'src'
    $solutionXml = Join-Path $sourcePath 'Other\Solution.xml'
    $outputPath = Join-Path $OutputRoot "${solutionName}_unmanaged.zip"
    if (-not (Test-Path $solutionXml)) {
        throw "Solution source is incomplete: $solutionName"
    }
    if ($PlanOnly) {
        Write-Output ([pscustomobject]@{
            Solution = $solutionName
            DependsOn = @($solution.dependsOn) -join ', '
            Source = $sourcePath
            Output = $outputPath
        })
        continue
    }
    if (Test-Path $outputPath) {
        Remove-Item $outputPath -Force
    }
    pac solution pack --zipfile $outputPath --folder $sourcePath --packagetype Unmanaged
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $outputPath)) {
        throw "Solution pack failed: $solutionName"
    }
    Write-Output ([pscustomobject]@{
        Solution = $solutionName
        Output = $outputPath
        SizeBytes = (Get-Item $outputPath).Length
        Sha256 = (Get-FileHash $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
    })
}

$action = if ($PlanOnly) { 'plan' } else { 'pack' }
Write-Output "Solution $action`: PASS ($($solutions.Count) solutions)"