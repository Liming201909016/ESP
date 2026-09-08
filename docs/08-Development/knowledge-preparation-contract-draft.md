# Knowledge Preparation Contract And Acceptance Draft

**Work item:** KPR-001

**Version:** 0.1.0

**Status:** Proposed; architecture, domain, and independent acceptance review pending. No runtime registration, approval, or publication is implied.

## Draft Artifacts And Verification

- [Draft JSON Schema](../../test-data/knowledge-preparation/v0.1.0/contract.schema.json): closed request, preparation response, evidence, and Consumer output shapes; no changes to the canonical five-Skill schema.
- [Runtime input fixtures](../../test-data/knowledge-preparation/v0.1.0/runtime-inputs.json): seven synthetic cases, with adapter harness configuration separate from each request. Case IDs are fixture identities, not outcome selectors; future runtime must derive outcomes from content and trusted adapter observations.
- [Acceptance labels](../../test-data/knowledge-preparation/v0.1.0/acceptance-labels.json): expected typed facts, source locators, gaps, conflicts, outcomes, forbidden reads, injection handling, and two downstream task obligations. These labels are for the independent evaluator only.
- [Contract examples](../../test-data/knowledge-preparation/v0.1.0/contract-examples.json): authored success and access-denial responses, Consumer outputs, a SHA-256 test vector, and invalid requests. The Architecture response is derived from the same preparation example using its distinct invocation identity; the validator checks both full envelopes. This derivation is fixture construction, not an executable reuse demonstration.
- [Draft validator](../../scripts/Test-KnowledgePreparationDraft.ps1): PowerShell 7 `Test-Json` schema checks and fixture consistency checks. Run from the repository root with `./scripts/Test-KnowledgePreparationDraft.ps1`; do not bypass organizational execution policy.

On 2026-09-08 the draft checks passed for seven requests, three response examples, three Consumer outputs, and seven schema-negative examples. The happy-path SHA-256 test vector was computed using browser Web Crypto over the documented canonical bytes. The PowerShell checker does not recompute canonical hashes, execute the Skill/Consumers, enforce runtime label-file isolation, or run a held-out acceptance set. Those remain KPR-002 through KPR-004 work. Test counts refer to authored examples, not independent runtime evaluation.

The same checker also rejects six schema-valid Consumer mutations for specific expected reasons: empty task items, a mismatched case ID, an invented question reference, a missing limitation, a stop changed to Success, and an architecture brief missing its region fact. Consumer references are case-sensitive and must resolve exactly once; required task facts and gap/conflict/limitation questions cannot be omitted or duplicated. These are semantic regression tests of authored examples, not evidence that the two Consumers have been implemented or independently accepted.

## Unregistered Local Experiment

On 2026-09-08 the user explicitly authorized local synthetic implementation before formal review, without runtime registration, tenant connections, publication, or changes to the existing Skill contracts. This authorizes an experiment only; architecture approval and independent acceptance remain pending.

- [Preparation runtime](../../scripts/knowledge-preparation/runtime.mjs) accepts a request and trusted adapter context. It imports the existing Document Source and Evidence Plugins, authorizes all sources before document access, derives typed facts and conflicts from content, and emits source hashes, evidence references, and explicit governed stops. It does not load acceptance labels, register a Skill, persist operational Reviews, or expose a public endpoint. Evidence is an in-memory experimental output, not an approved durable evidence store.
- [Runtime development tests](../../scripts/knowledge-preparation/runtime.test.mjs) define thirteen tests: seven fixture cases plus canonical hashing, source mutation, deny-before-read, adapter exceptions, conflict/gap precedence, and invalid requests. Labels are loaded by tests, not by the runtime module. This is not OS-enforced label isolation or a held-out acceptance runner.

Run in an authorized Node.js >=24 environment, from the repository root:

```powershell
node --test scripts/knowledge-preparation/runtime.test.mjs
```

The same test command is available as `npm run test:knowledge-preparation` in [package.json](../../package.json). The existing [Validate ESP workflow](../../.github/workflows/validate.yml) now includes the PowerShell draft validator and the Node experiment tests after build and before the existing application tests. Neither step uses `continue-on-error`, deploys code, or accesses the Hosted Demo. The workflow retains its existing `contents: read` permission.

These CI changes remain local and unexecuted. On 2026-09-08 the user explicitly chose not to commit, push, or create a PR for remote validation. Local checks passed for the npm command, referenced test file, CI command references, and draft regression suite; editor diagnostics found no errors in the workflow or package manifest. These checks do not validate GitHub Actions execution. When an approved execution environment becomes available, retain the actual commit, run URL, and per-test results before changing KPR-002 status. No branch or remote operation is authorized by this note.

Execution remains **blocked and unverified** on this workstation. An official Node v24.20.0 x64 standalone executable downloaded to the temporary directory matched SHA-256 `5c976096e04e5c2c1f091938926234cc9fbebfe9787ddd149351b3b0ecc707b5`, but Windows refused to start it with "This program is blocked by group policy." No alternate path, execution-policy change, or policy bypass was attempted. Obtain an administrator-approved Node environment or use an authorized CI runner before claiming runtime results. Static editor diagnostics and patch-format checks passed; neither executes the thirteen tests. Consumer runtime implementation, response Schema checks against actual outputs, independent acceptance, and publication remain pending.

### Development Execution Update - 2026-09-08

The user subsequently approved the existing signed OpenJS Node 24.19.0 installation and Microsoft Store PowerShell 7.6.5 for local KPR execution in the authoritative `D:\Ai-Code\ESP` worktree. Development validation passed 15 focused runtime tests, 22 combined runtime/Consumer tests, and fourteen actual preparation responses plus fourteen actual Consumer outputs passed Schema/semantic checks. A permission-isolated exporter and separate evaluator passed 165/165 development assertions, and 14/14 acceptance-mechanics tests rejected required corruptions, mutation/cardinality failures, and invalid held-out reviewer manifests without changing operational Reviews. The first D-drive acceptance run exposed and failed on a loose-ref-only source identity lookup; packed-ref support was added and the expanded suite passed on rerun.

This does not complete KPR-001 or formal KPR-004. The evaluated fixtures remain visible development fixtures, no independent reviewer supplied held-out cases, and no Business Owner/Domain SME approval or value threshold is recorded. Registration, publication, Git operations, and Azure deployment remain unauthorized.

## Decision Requested

Prepare a reusable knowledge package from authorized synthetic structured documents for Security Review Copilot and Architecture Review Workflow. Reuse the Document Source and Evidence adapter responsibilities, but do not extend or reinterpret the existing Document Intake v1.0.0 contract silently.

The proposed experiment uses a standalone draft envelope identified by `experiment: knowledge-preparation` and `contractVersion: 0.1.0`, not a canonical Skill code. The existing five-Skill schema is unchanged. Before runtime registration, the Architecture Owner must decide whether this is a new Logical Skill or an explicitly versioned existing capability, record its identity and compatibility mapping, and review the source/evidence boundary. Approval remains pending; authoring local synthetic contracts and fixtures is Foundation work only.

## Narrow Input Boundary

The first slice supports JSON documents only. Required preparation fields are `system`, `region`, and `permissions`; values retain their JSON types. Free-form notes are untrusted content, not executable instructions. PDF/OCR, embeddings, search indexes, generic ingestion, and external connectors are out of scope.

Runtime inputs contain only case ID, requested fields, source references and bodies, and an adapter harness configuration. The harness is test infrastructure, not a public caller-controlled authorization object. A future adapter must obtain access decisions from the trusted execution context; a consumer cannot grant itself access or inject dependency status. Neither Skill implementation nor either Consumer may read the acceptance-label file.

Each readable source has an ID, version, a JSON body, and a locator namespace using RFC 6901 JSON Pointers. Source hashes are SHA-256 of canonical JSON: recursively sort object keys, preserve array order, serialize compact UTF-8 without BOM, and reject non-finite numbers. Fixtures use ASCII strings, integers, booleans, arrays, and objects to avoid cross-language number/Unicode ambiguity. Hash the entire source body, not just extracted fields. The preparation runner computes the hash independently of labels and returns it with the source version; acceptance recomputes it from the authorized input.

## Draft Package

The response contains `experiment`, `contractVersion`, `caseId`, `correlationId`, `invocationId`, `consumerCode`, `consumerBindingCode`, pinned implementation/Plugin versions, `outcome`, `package`, `evidence`, `events`, and `errors`. All object shapes are closed by the draft schema. IDs must be nonempty and unique within their namespace; cross-reference and permission checks belong to semantic acceptance, not JSON Schema alone.

The package contains:

- `facts`: typed field/value pairs and evidence references, with no synthesized value or model suggestion;
- `sources`: only accessed readable sources, each with ID, version, and content hash;
- `conflicts`: field and all competing fact IDs; retain both values, do not choose a winner;
- `gaps`: requested fields absent from all readable sources;
- `limitations`: explicit machine-readable limitations for missing, unreadable, denied, or conflicting material and dependency failures.

Evidence uses the existing `Fact` / `ToolResult` distinction. Fact evidence resolves to a retained source and JSON Pointer whose value equals the fact value. ToolResult evidence references an adapter operation, not invented source content. Events record actual adapter operations and outcomes. No report-ready flags, fabricated coverage percentages, or expected behaviors are accepted as observations.

## Outcome Precedence

Authorization is checked before reading any source. If any requested source is denied, return `RejectedByPolicy`, `PolicyDenial`, and empty package facts/sources. Denied content must not appear in outputs, hashes, logs, or evidence. Once authorization passes, a bounded adapter dependency failure returns `Failed` / `DependencyFailure`, with no successful package. An unreadable source returns `CannotAssess` / `MissingEvidence`; this first slice stops before extracting any facts. Missing requested fields return `NeedsInformation` / `MissingEvidence` and preserve available facts. Conflicting values return `CannotAssess` / `MissingEvidence`, retain competing facts and their evidence, and expose the conflict. Otherwise return `Success` with empty errors. Prompt injection alone does not fail valid preparation: ignore it, retain a ToolResult event, and never treat notes as a requested fact.

Where missing fields and conflicts coexist, `CannotAssess` takes precedence and both gaps and conflicts remain visible. Access denial and dependency/unreadable stops take precedence over both. `Success` means preparation succeeded, never that either business review or a release is approved.

## Two Consumer Tasks

Both Consumers bind to the same preparation implementation and Plugin pins. They receive the returned package, not source bodies or expected labels. Different Binding/Correlation/Invocation IDs are required, but are not sufficient evidence of reuse.

| Consumer | Concrete downstream task | Required output | Prohibited shortcut |
|---|---|---|---|
| Security Review Copilot | Summarize the declared permissions and identify preparation limitations for analyst review | A draft permission-review item linked to permission facts/evidence; explicit information requests for gaps/conflicts; human review required | Re-extracting raw documents, making a policy finding without an approved Runbook, or approving access |
| Architecture Review Workflow | Produce an architecture evidence brief for the declared system and region | A draft brief with citations to system/region facts; unresolved questions for gaps/conflicts; human review required | Assuming missing topology, choosing a disputed region, or copying preparation logic |

Each Consumer output records Consumer/Binding identity, package invocation ID, package outcome, draft status, human-review requirement, structured items with fact IDs, and questions linked to gaps/conflicts/limitations. Any non-Success preparation must result in an explicit `NeedsInformation`, `CannotAssess`, `RejectedByPolicy`, or `Failed` Consumer outcome, never a successful completed review. Human-readable phrasing is not an exact-string acceptance target; structured facts, references, and limitations are.

## Independent Acceptance Protocol

1. Freeze the fixture version, hashes, expected labels, allowed volatile fields, evaluator version, and Consumer task definitions before implementation. The checked-in fixtures are visible development examples, not a held-out set.
2. A reviewer other than the implementer supplies separately retained held-out source packages and expected labels before final acceptance. A fresh runtime process receives only runtime input files; the independent runner alone loads labels. File-access isolation must be tested, not assumed from folder names.
3. Export actual packages, events, errors, and both Consumer outputs. The acceptance runner resolves evidence to input source values, recomputes hashes, and compares required facts and outcomes. It must not import the Skill, read expected labels into runtime, or trust self-reported success metrics.
4. Run source-content mutation with unchanged labels: observed facts must change and stale expected values must fail. Run label-only mutation: runtime output stays identical except declared Correlation/Invocation IDs and dependent references; verdict must reflect the changed label.
5. Corrupt exported candidates by dropping a required fact, fabricating a source locator, suppressing a stop, and changing a pinned dependency. All four candidates must fail. Reject missing/duplicate/extra case IDs, missing Consumer outputs, and unresolved citations.
6. Verify both Consumers consume the package through their task outputs and retain limitations. A shared preparation fix must pass both Consumer regressions without duplicated extraction changes.
7. Retain raw inputs, candidate outputs, individual assertion failures, pin/hash manifest, isolation evidence, and reviewer decision. Contract/schema validation alone is not runtime acceptance, and runtime acceptance is not publication approval.

## Value Acceptance And Publication

Before measurement, the Business Owner and independent reviewer must name the task baseline, sample size, acceptable-output rubric, and minimum useful improvement. Compare shared preparation against the same tasks without it, including integration effort, shared-change maintenance effort, analyst time, correction count, and output acceptance rate. Include adapter/governance overhead. Values and thresholds are pending, not invented here.

Only after independent technical and value acceptance may KPR-006 add an immutable candidate manifest, named approval, explicit activation pins, compatibility checks through both Consumers, and tested rollback. No automatic `Latest`, customer data, Connected TEST, or production authorization follows from this draft.

## Review Checklist

| Decision | Accountable role | Current state |
|---|---|---|
| Capability identity and compatibility with existing Skill contracts | Architecture Owner | Pending assignment and decision |
| Preparation field scope and Consumer usefulness rubric | Business Owner and Domain SME | Pending assignment and review |
| Source authorization, evidence locator, and retention boundary | Security/Data Owner | Pending assignment and review |
| Held-out fixtures, label isolation, mutation checks, and value comparison | Independent acceptance reviewer | Pending assignment and review |
| Implementation readiness | Implementation Owner | Draft artifact checks pass; runtime toolchain, implementation, and independent acceptance pending |

KPR-001 is complete only after these decisions and artifact validation evidence are recorded. Do not mark it Done simply because this document and fixtures exist.