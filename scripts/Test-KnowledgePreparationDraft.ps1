[CmdletBinding()]
param(
    [string]$NodePath = 'node'
)

$ErrorActionPreference = 'Stop'
$root = Join-Path (Split-Path -Parent $PSScriptRoot) 'test-data\knowledge-preparation\v0.1.0'
$schemaPath = Join-Path $root 'contract.schema.json'
$inputs = Get-Content (Join-Path $root 'runtime-inputs.json') -Raw | ConvertFrom-Json
$labels = Get-Content (Join-Path $root 'acceptance-labels.json') -Raw | ConvertFrom-Json
$examples = Get-Content (Join-Path $root 'contract-examples.json') -Raw | ConvertFrom-Json

function Assert-DraftSchema {
    param($Message, [bool]$ExpectedValid = $true)
    $valid = Test-Json -Json ($Message | ConvertTo-Json -Depth 50) -SchemaFile $schemaPath -ErrorAction SilentlyContinue
    if ($valid -ne $ExpectedValid) { throw "Unexpected schema verdict for $($Message.messageType) / $($Message.caseId)" }
}

function Assert-ConsumerExample {
    param($Output, $Responses, $Tasks)
    Assert-DraftSchema $Output
    $matchingResponses = @($Responses | Where-Object { $_.invocationId -ceq $Output.packageInvocationId })
    if ($matchingResponses.Count -ne 1) { throw 'Consumer package invocation must resolve exactly once.' }
    $response = $matchingResponses[0]
    foreach ($field in @('caseId', 'consumerCode', 'consumerBindingCode', 'outcome')) {
        if ($response.$field -cne $Output.$field) { throw "Consumer/package identity mismatch: $field" }
    }
    $task = $Tasks.($Output.consumerCode)
    if (!$task) { throw 'Consumer task is undefined.' }
    $requiredFactIds = @($response.package.facts | Where-Object { $_.field -cin $task.requiredFieldsWhenAvailable } | ForEach-Object { $_.factId })
    $usedFactIds = @()
    foreach ($item in $Output.items) {
        if ($item.kind -cne $task.kind) { throw 'Consumer task kind mismatch.' }
        foreach ($factId in $item.factIds) {
            $facts = @($response.package.facts | Where-Object { $_.factId -ceq $factId })
            if ($facts.Count -ne 1) { throw 'Consumer fact must resolve exactly once.' }
            $usedFactIds += $factId
        }
    }
    if ($usedFactIds.Count -ne $requiredFactIds.Count) { throw 'Consumer task fact coverage mismatch.' }
    foreach ($factId in $requiredFactIds) {
        if (@($usedFactIds | Where-Object { $_ -ceq $factId }).Count -ne 1) { throw 'Consumer task fact coverage mismatch.' }
    }
    $requiredQuestions = @()
    foreach ($gap in $response.package.gaps) { $requiredQuestions += "Gap:$gap" }
    foreach ($conflict in $response.package.conflicts) { $requiredQuestions += "Conflict:$($conflict.field)" }
    foreach ($limitation in $response.package.limitations) { $requiredQuestions += "Limitation:$limitation" }
    $observedQuestions = @($Output.questions | ForEach-Object { "$($_.reason):$($_.reference)" })
    if ($observedQuestions.Count -ne $requiredQuestions.Count) { throw 'Consumer question coverage mismatch.' }
    foreach ($question in $requiredQuestions) {
        if (@($observedQuestions | Where-Object { $_ -ceq $question }).Count -ne 1) { throw 'Consumer question reference mismatch.' }
    }
}

function Assert-ConsumerRejection {
    param($Output, $Responses, $Tasks, [string]$ExpectedError)
    Assert-DraftSchema $Output
    try {
        Assert-ConsumerExample $Output $Responses $Tasks
    } catch {
        if ($_.Exception.Message -cne $ExpectedError) { throw }
        return
    }
    throw "Semantic mutation was not rejected: $ExpectedError"
}

if ($inputs.fixtureVersion -ne '0.1.0' -or $labels.fixtureVersion -ne $inputs.fixtureVersion -or $inputs.synthetic -ne $true) {
    throw 'Fixture version or synthetic boundary is invalid.'
}
if ($labels.runtimeAccessAllowed -ne $false -or $labels.heldOut -ne $false -or $labels.status -ne 'PendingIndependentReview') {
    throw 'Development fixtures must not claim independent acceptance or runtime label access.'
}
$caseIds = @($inputs.cases.request.caseId)
$labelIds = @($labels.cases.caseId)
if ($caseIds.Count -ne 7 -or $labelIds.Count -ne 7 -or @($caseIds | Sort-Object -Unique).Count -ne 7 -or @($labelIds | Sort-Object -Unique).Count -ne 7) {
    throw 'Expected seven unique input and label cases.'
}
if (Compare-Object $caseIds $labelIds) { throw 'Input and label case IDs differ.' }
if ($examples.status -ne 'AuthoredExamplesNotRuntimeResults' -or @($examples.consumerOutputs).Count -ne 3 -or @($examples.invalidRequests).Count -ne 3) {
    throw 'Expected authored examples, three Consumer outputs, and three invalid requests.'
}
if (Compare-Object @($labels.consumerCodes) @('CON-SEC-REVIEW-AGENT', 'CON-ARCH-REVIEW')) { throw 'Both Consumer tasks are required.' }
foreach ($case in $inputs.cases) {
    Assert-DraftSchema $case.request
    $sourceIds = @($case.request.sources.sourceId)
    if (@($sourceIds | Sort-Object -Unique).Count -ne $sourceIds.Count) { throw 'Duplicate source IDs.' }
    if (Compare-Object $sourceIds @($case.adapterHarness.access.PSObject.Properties.Name)) { throw 'Harness access must cover exactly the requested sources.' }
    if ($case.adapterHarness.dependency -notin @('Available', 'Unavailable')) { throw 'Unknown dependency state.' }
    foreach ($sourceId in $sourceIds) {
        if ($case.adapterHarness.access.$sourceId -notin @('Allowed', 'Denied')) { throw 'Unknown source access decision.' }
    }
    foreach ($sourceId in $case.adapterHarness.unreadableSourceIds) {
        if ($sourceId -notin $sourceIds) { throw 'Unknown unreadable source.' }
    }
    $label = $labels.cases | Where-Object { $_.caseId -eq $case.request.caseId }
    foreach ($fact in $label.facts) {
        $source = $case.request.sources | Where-Object { $_.sourceId -eq $fact.sourceId }
        if (!$source -or $case.adapterHarness.access.($fact.sourceId) -ne 'Allowed' -or $fact.sourceId -in $case.adapterHarness.unreadableSourceIds) {
            throw 'Expected fact references unavailable content.'
        }
        if ($fact.field -notin $case.request.requestedFields -or $fact.locator -ne ('/' + $fact.field)) { throw 'Invalid draft fact field or locator.' }
        $actualValue = ConvertTo-Json -InputObject $source.body.($fact.field) -Depth 20 -Compress
        $expectedValue = ConvertTo-Json -InputObject $fact.value -Depth 20 -Compress
        if ($actualValue -cne $expectedValue) { throw "Label/source disagreement in $($label.caseId) / $($fact.field)" }
    }
}

Assert-DraftSchema $examples.preparationResponse
Assert-DraftSchema $examples.deniedResponse
$architectureResponse = $examples.preparationResponse | ConvertTo-Json -Depth 50 | ConvertFrom-Json
foreach ($property in $examples.architectureInvocation.PSObject.Properties) {
    $architectureResponse.($property.Name) = $property.Value
}
Assert-DraftSchema $architectureResponse
foreach ($field in @('correlationId', 'invocationId', 'consumerCode', 'consumerBindingCode')) {
    if ($architectureResponse.$field -eq $examples.preparationResponse.$field) { throw "Consumer identity is not distinct: $field" }
}
foreach ($fact in $examples.preparationResponse.package.facts) {
    $expectedFact = @($labels.cases | Where-Object { $_.caseId -eq 'KP-001' }).facts | Where-Object { $_.field -eq $fact.field }
    if (!$expectedFact -or (ConvertTo-Json -InputObject $expectedFact.value -Compress) -cne (ConvertTo-Json -InputObject $fact.value -Compress)) {
        throw 'Response example does not retain the expected typed source value.'
    }
    foreach ($evidenceId in $fact.evidenceIds) {
        $evidence = @($examples.preparationResponse.evidence | Where-Object { $_.evidenceId -eq $evidenceId })
        if ($evidence.Count -ne 1 -or $evidence[0].type -ne 'Fact' -or $evidence[0].locator -ne ('/' + $fact.field)) { throw 'Unresolved fact evidence example.' }
        $source = @($examples.preparationResponse.package.sources | Where-Object { $_.sourceId -eq $evidence[0].sourceId })
        if ($source.Count -ne 1 -or $source[0].sourceVersion -ne $evidence[0].sourceVersion -or $source[0].sha256 -ne $evidence[0].contentHash) { throw 'Source version/hash example mismatch.' }
    }
}
$responses = @($examples.preparationResponse, $architectureResponse, $examples.deniedResponse)
foreach ($output in $examples.consumerOutputs) {
    Assert-ConsumerExample $output $responses $labels.consumerTasks
}
$emptyItems = $examples.consumerOutputs[0] | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$emptyItems.items = @()
Assert-ConsumerRejection $emptyItems $responses $labels.consumerTasks 'Consumer task fact coverage mismatch.'
$wrongCase = $examples.consumerOutputs[0] | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$wrongCase.caseId = 'KP-002'
Assert-ConsumerRejection $wrongCase $responses $labels.consumerTasks 'Consumer/package identity mismatch: caseId'
$fabricatedQuestion = $examples.consumerOutputs[2] | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$fabricatedQuestion.questions[0].reference = 'InventedLimitation'
Assert-ConsumerRejection $fabricatedQuestion $responses $labels.consumerTasks 'Consumer question reference mismatch.'
$hiddenLimitation = $examples.consumerOutputs[2] | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$hiddenLimitation.questions = @()
Assert-ConsumerRejection $hiddenLimitation $responses $labels.consumerTasks 'Consumer question coverage mismatch.'
$suppressedStop = $examples.consumerOutputs[2] | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$suppressedStop.outcome = 'Success'
Assert-ConsumerRejection $suppressedStop $responses $labels.consumerTasks 'Consumer/package identity mismatch: outcome'
$partialBrief = $examples.consumerOutputs[1] | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$partialBrief.items[0].factIds = @('F-SYSTEM')
Assert-ConsumerRejection $partialBrief $responses $labels.consumerTasks 'Consumer task fact coverage mismatch.'
foreach ($message in $examples.invalidRequests) { Assert-DraftSchema $message $false }
$wrongPin = $examples.preparationResponse | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$wrongPin.pins.implementationVersion = 'Latest'
Assert-DraftSchema $wrongPin $false
$deniedFacts = $examples.deniedResponse | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$deniedFacts.package.facts = @($examples.preparationResponse.package.facts[0])
Assert-DraftSchema $deniedFacts $false
$wrongType = $examples.preparationResponse | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$wrongType.package.facts[2].value = 'Reader'
Assert-DraftSchema $wrongType $false
$autoApproved = $examples.consumerOutputs[0] | ConvertTo-Json -Depth 50 | ConvertFrom-Json
$autoApproved.humanReviewRequired = $false
Assert-DraftSchema $autoApproved $false

$runtimeExporter = Join-Path $PSScriptRoot 'knowledge-preparation\runtime-schema-candidates.mjs'
$runtimeJson = & $NodePath $runtimeExporter
if ($LASTEXITCODE -ne 0) { throw "Runtime response export failed with exit code $LASTEXITCODE" }
$runtimeCandidates = $runtimeJson | ConvertFrom-Json
$runtimeResponses = @($runtimeCandidates.responses)
$runtimeConsumerOutputs = @($runtimeCandidates.consumerOutputs)
if ($runtimeResponses.Count -ne 14) { throw "Expected fourteen runtime responses, found $($runtimeResponses.Count)." }
if ($runtimeConsumerOutputs.Count -ne 14) { throw "Expected fourteen runtime Consumer outputs, found $($runtimeConsumerOutputs.Count)." }
foreach ($response in $runtimeResponses) { Assert-DraftSchema $response }
foreach ($output in $runtimeConsumerOutputs) {
    Assert-DraftSchema $output
    Assert-ConsumerExample $output $runtimeResponses $labels.consumerTasks
}

Write-Output 'Knowledge Preparation draft: PASS (7 requests, 3 response examples, 3 Consumer outputs, 7 schema-negative examples).'
Write-Output 'Consumer semantic checks: PASS (6 schema-valid mutations rejected for their expected failure reasons).'
Write-Output 'Runtime response schema checks: PASS (14 actual preparation responses and 14 actual Consumer outputs).'
Write-Output 'Scope: development fixture and runtime response validation only. Runtime label isolation, held-out acceptance, Consumer usefulness, and publication remain unverified.'