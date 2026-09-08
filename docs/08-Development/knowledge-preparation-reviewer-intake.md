# Knowledge Preparation Independent Reviewer Intake

**Reviewer:** Wenxian
**Role:** Business Owner and reviewer, confirmed independent of implementation
**Status:** Seven implementation-authored reviewer seed inputs prepared; awaiting Wenxian modification, independent labels, frozen manifest, and measurements

## Purpose

Provide seven held-out Knowledge Preparation cases without converting development fixtures into acceptance evidence. The implementer must not author the source cases or expected labels and must not inspect label contents before the reviewer freezes their hashes.

## Required Files

Place these files outside the repository, currently `D:\ai-code\esp-temp`:

1. `runtime-inputs.held-out.json`
2. `acceptance-labels.held-out.json`
3. `reviewer-manifest.json`
4. `value-measurements.csv`, after paired tasks are performed

Do not copy the visible `v0.1.0` cases and relabel them as held-out. New cases may use the same structural envelope and field scope: `system`, `region`, and `permissions`.

## Seven-Case Coverage

The reviewer-owned set must contain exactly seven unique cases covering:

- complete material;
- missing required material;
- unreadable authorized source;
- denied source;
- conflicting facts;
- untrusted instruction in source content;
- bounded adapter dependency failure.

Runtime inputs contain source bodies and trusted adapter observations only. Acceptance labels contain expected facts, locators, outcomes, gaps, conflicts, limitations, forbidden reads, and the two Consumer task definitions. Runtime inputs must not contain expected outcomes or labels.

## Reviewer Manifest

After both files are final, calculate SHA-256 over their exact bytes and create:

```json
{
  "protocolVersion": "0.1.0",
  "reviewer": "Wenxian",
  "independentOfImplementation": true,
  "heldOut": true,
  "caseCount": 7,
  "runtimeInputSha256": "<64 lowercase hex characters>",
  "acceptanceLabelSha256": "<64 lowercase hex characters>"
}
```

Changing either held-out file after this step invalidates the manifest. The evaluator rejects missing independence, non-held-out declarations, wrong case count, and stale hashes.

## Execution Boundary

The candidate exporter receives only runtime inputs. Node Permission Model must deny it access to labels and the reviewer manifest. The evaluator runs separately and may read inputs, labels, candidate output, and reviewer manifest. It recomputes source hashes and validates both Consumer outputs.

No file is copied into an enterprise knowledge source, Dataverse, or the Hosted Demo. No customer or confidential data is permitted.

## Value Measurement

Use the same seven cases and both Consumer tasks in paired order:

- `SharedPreparation`: both Consumers use the common Knowledge Preparation package.
- `PerConsumerBaseline`: each Consumer performs its own bounded preparation for the same task.

Record one row per case, Consumer, and mode with:

```text
caseId,consumerCode,mode,integrationMinutes,maintenanceMinutes,analystMinutes,correctionCount,acceptableOutput,authorizationFailures,citationFailures,reviewerDecision,rationale
```

Continue requires:

- zero authorization failures;
- zero citation failures;
- no acceptable-output-rate regression;
- at least 30% lower combined integration plus shared-change maintenance effort.

The reviewer records `Continue`, `Revise`, or `Stop` only after all rows are complete. Synthetic technical success alone is not a value decision.

## Current Blocker

The supplied SharePoint library contains no held-out files at the time of this record. To support reviewer authoring, the implementation session created these external files under `D:\ai-code\esp-temp`:

- `runtime-inputs.reviewer-seed.json` - seven synthetic seed inputs, SHA-256 `b0098f9a9ee4fc466e130e91917e887e241d5fbc91a7a1d79a4e7a5f0304b036`;
- `acceptance-labels.reviewer-worksheet.json` - intentionally incomplete and `heldOut=false`, SHA-256 `d2f958999ef4369afca54c82edef7326aabd1b3a6e6984feb48166e29c792ecf`;
- `candidate.reviewer-seed.json` - runtime smoke output only, SHA-256 `5a4e6400e5a640fb23dc8e3c298660b5015310e9b558b942e1442e5662363156`;
- empty reviewer-manifest and value-measurement templates.

The permission-isolated exporter executed all seven seeds without reading the worksheet. Observed outcomes were `Success`, `NeedsInformation`, `CannotAssess`, `RejectedByPolicy`, `CannotAssess`, `Success`, and `Failed` through both Consumers. This proves seed executability only. Because the implementer authored the inputs and the worksheet contains no expected answers, these files are not held-out cases and no evaluator verdict was run.

Wenxian must independently replace or materially review every seed, complete and freeze the labels, set the final held-out metadata, and create a hash-bound reviewer manifest. KPR-004 remains Partial and KPR-005 remains Blocked until that occurs.

For workflow rehearsal only, implementation-authored simulated labels, measurements, and reports were generated beside the seeds. They are marked `SimulationOnly`, `measured=false`, `simulation=true`, and `heldOut=false`. Their successful simulation verdicts must not be copied into Wenxian's reviewer manifest or treated as reviewer evidence.

The complete rehearsal can be repeated with:

```powershell
npm run simulate:knowledge-preparation -- D:\ai-code\esp-temp
```

The command writes `simulation-summary.json`, verifies that the operational Review store hash is unchanged, and fails if any acceptance, value, publication, Git, or Azure boundary is represented as real.
