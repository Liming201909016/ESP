[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$docsRoot = Join-Path $repoRoot 'docs'
$python = Join-Path $repoRoot '.venv\Scripts\python.exe'
$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()
$pacInstallRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\PowerAppsCLI'
if (-not (Get-Command pac -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $pacInstallRoot 'pac.cmd'))) {
    $env:PATH = "$pacInstallRoot;$env:PATH"
}
$portableGitRoot = Join-Path $env:LOCALAPPDATA 'Programs\MinGit\cmd'
if (-not (Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $portableGitRoot 'git.exe'))) {
    $env:PATH = "$portableGitRoot;$env:PATH"
}
$nodeRoot = Split-Path (Get-Command node -ErrorAction SilentlyContinue).Source -ErrorAction SilentlyContinue
$npm = if ($nodeRoot) { Join-Path $nodeRoot 'npm.cmd' } else { $null }

function Add-CheckError {
    param([string]$Message)
    $errors.Add($Message)
}

if (-not (Test-Path $python)) {
    Add-CheckError 'Workspace Python environment is missing: .venv\Scripts\python.exe'
}

$requiredFiles = @(
    'docs\README.md',
    'docs\MANIFEST.txt',
    'docs\02-Data-Design\dataverse-build-workbook.xlsx',
    'docs\02-Data-Design\dataverse-build-workbook.20260903T022215Z.d9eab55d.artifactvalidatepass',
    'docs\04-Governance\development-readiness-gate.md',
    'docs\05-Asset-Standards\schemas\logical-skill-contract.schema.json',
    'docs\05-Asset-Standards\validate_contract_examples.py',
    'test-data\security-review\dataset.schema.json',
    'test-data\security-review\v1.0.0\dataset.json',
    'test-data\security-review\v1.0.0\manifest.json',
    'scripts\Build-SyntheticDatasetManifest.py'
    'config\agent-skill-mapping.json'
    'scripts\Pack-PowerPlatformSolutions.ps1'
    'scripts\Validate-HackathonDocumentation.py'
)
foreach ($relativePath in $requiredFiles) {
    if (-not (Test-Path (Join-Path $repoRoot $relativePath))) {
        Add-CheckError "Required file is missing: $relativePath"
    }
}

if ($errors.Count -eq 0) {
    if (-not $npm -or -not (Test-Path $npm)) {
        Add-CheckError 'Node/npm toolchain is missing.'
    } elseif (-not (Test-Path (Join-Path $repoRoot 'node_modules'))) {
        $warnings.Add('Node dependencies are not installed; run npm.cmd install before application validation.')
    } else {
        & $npm run build
        if ($LASTEXITCODE -ne 0) { Add-CheckError 'Hackathon application build failed.' }
        & $npm test
        if ($LASTEXITCODE -ne 0) { Add-CheckError 'Hackathon application tests failed.' }
    }

    $solutionManifest = Get-Content (Join-Path $repoRoot 'config\solution-manifest.json') -Raw | ConvertFrom-Json
    foreach ($solutionDefinition in $solutionManifest.solutions) {
        $solutionName = [string]$solutionDefinition.uniqueName
        $solutionRoot = Join-Path $repoRoot "src\solutions\$solutionName"
        $projectFiles = @(Get-ChildItem $solutionRoot -Filter *.cdsproj -ErrorAction SilentlyContinue)
        $solutionXmlPath = Join-Path $solutionRoot 'src\Other\Solution.xml'
        if ($projectFiles.Count -ne 1 -or -not (Test-Path $solutionXmlPath)) {
            Add-CheckError "Solution project is incomplete: $solutionName"
            continue
        }
        [xml]$solutionXml = Get-Content $solutionXmlPath
        $manifestNode = $solutionXml.ImportExportXml.SolutionManifest
        if ([string]$manifestNode.UniqueName -ne $solutionName -or [string]$manifestNode.Publisher.UniqueName -ne [string]$solutionManifest.publisher.name -or [string]$manifestNode.Publisher.CustomizationPrefix -ne [string]$solutionManifest.publisher.prefix) {
            Add-CheckError "Solution metadata does not match the manifest: $solutionName"
        }
    }

    $skillMapping = Get-Content (Join-Path $repoRoot 'config\agent-skill-mapping.json') -Raw | ConvertFrom-Json
    $expectedSkills = @('LS-SEC-DOC-INTAKE', 'LS-SEC-EVIDENCE-EXTRACT', 'LS-SEC-REVIEW', 'LS-SEC-RISK-RATING', 'LS-SEC-REPORT-GEN') | Sort-Object
    $actualSkills = @($skillMapping.skills | ForEach-Object { [string]$_.skillCode }) | Sort-Object
    if (Compare-Object $expectedSkills $actualSkills) {
        Add-CheckError 'Agent Skill mapping must contain each MVP Skill exactly once.'
    }
    $actionNames = @($skillMapping.skills | ForEach-Object { [string]$_.actionName })
    if ($actionNames.Count -ne (@($actionNames | Sort-Object -Unique)).Count -or @($actionNames | Where-Object { $_ -notmatch '^esp_[a-z0-9_]+$' }).Count -gt 0) {
        Add-CheckError 'Agent action names must be unique and use the esp_ lowercase prefix.'
    }
    if (@($skillMapping.skills | Where-Object { $_.writesBusinessSystem -ne $false }).Count -gt 0) {
        Add-CheckError 'Security Review MVP Skill mappings must not write to business systems.'
    }
    if ($skillMapping.workflowControl -ne 'ExplicitOrchestratingAgentFlow' -or $skillMapping.criticalResponseMode -ne 'StructuredResponseOrAdaptiveCard') {
        Add-CheckError 'Connected Mode must use explicit workflow control and structured critical responses.'
    }
    if (-not (Test-Path (Join-Path $repoRoot ([string]$skillMapping.internalEnvelopeSchema)))) {
        Add-CheckError 'Agent Skill mapping references a missing internal envelope schema.'
    }

    $actual = Get-ChildItem $docsRoot -Recurse -File |
        ForEach-Object { $_.FullName.Substring($docsRoot.Length + 1).Replace('\', '/') } |
        Where-Object { $_ -ne 'MANIFEST.txt' -and $_ -notmatch '(^|/)__pycache__/' -and $_ -notmatch '\.pyc$' } |
        Sort-Object
    $listed = Get-Content (Join-Path $docsRoot 'MANIFEST.txt') |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ } |
        Sort-Object
    $manifestDifference = Compare-Object $listed $actual
    if ($manifestDifference) {
        Add-CheckError 'MANIFEST.txt does not match the files in docs.'
    }

    $workbookPath = Join-Path $docsRoot '02-Data-Design\dataverse-build-workbook.xlsx'
    $markerPath = Join-Path $docsRoot '02-Data-Design\dataverse-build-workbook.20260903T022215Z.d9eab55d.artifactvalidatepass'
    $marker = Get-Content $markerPath -Raw | ConvertFrom-Json
    $workbookHash = (Get-FileHash $workbookPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($workbookHash -ne $marker.input.sha256) {
        Add-CheckError 'Dataverse workbook hash does not match its validation marker.'
    }
    if ($marker.result -ne 'valid' -or $marker.summary.errorCount -ne 0) {
        Add-CheckError 'Dataverse workbook validation marker is not valid.'
    }

    & $python (Join-Path $docsRoot '05-Asset-Standards\validate_contract_examples.py')
    if ($LASTEXITCODE -ne 0) {
        Add-CheckError 'Logical Skill contract examples failed validation.'
    }
    & $python (Join-Path $repoRoot 'scripts\Build-SyntheticDatasetManifest.py') --check
    if ($LASTEXITCODE -ne 0) {
        Add-CheckError 'Synthetic Security Review dataset failed validation.'
    }
    & $python (Join-Path $repoRoot 'scripts\Run-SyntheticEvaluation.py')
    if ($LASTEXITCODE -ne 0) {
        Add-CheckError 'Synthetic Foundation evaluation failed.'
    }
    & $python (Join-Path $repoRoot 'scripts\Validate-HackathonDocumentation.py')
    if ($LASTEXITCODE -ne 0) {
        Add-CheckError 'Hackathon documentation failed validation.'
    }
}

foreach ($tool in @('pac', 'git')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        $warnings.Add("Optional development tool is not available: $tool")
    }
}

$gate = Get-Content (Join-Path $docsRoot '04-Governance\development-readiness-gate.md') -Raw -Encoding UTF8
if ($gate -match '\*\*Gate status:\*\* Pending Sign-off') {
    $warnings.Add('Development Readiness Gate is pending; TEST integration remains blocked.')
}

foreach ($warning in $warnings) {
    Write-Warning $warning
}

if ($errors.Count -gt 0) {
    foreach ($checkError in $errors) {
        Write-Error $checkError
    }
    exit 1
}

Write-Output "Foundation readiness checks: PASS ($($warnings.Count) warning(s))"