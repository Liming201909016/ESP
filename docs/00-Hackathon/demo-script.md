# ESP Hackathon Demo Script

**Target duration:** 5 minutes

## 1. Problem, 30 seconds

Show two enterprise Copilots that would normally copy the same document-intake logic. Explain that copied prompts and tools cannot be independently versioned, evaluated, or traced.

## 2. One Copilot, 45 seconds

Open the ESP Security Review Copilot in Demo Mode. Select `SYN-RG-001` and ask for a review. Point out the single entry experience and Correlation ID.

## 3. Skills and Plugins, 75 seconds

Introduce the registry as **five governed Skills, four reusable Plugins, and one execution standard**. Explain: Skills define what the enterprise does; Plugins provide how systems connect; the execution standard keeps identity, versions, evidence, outcomes, errors, and oversight consistent. Use the Governance Control Plane to show pinned versions, two active Consumer Bindings, the Risk Rating approval gate, the 84/84 Foundation evaluation, and the explicit Pilot block. Open the execution trace and highlight that Document Intake and Evidence Extraction share `PLG-DOC-SOURCE`, while every Skill uses `PLG-EVIDENCE`.

## 4. Evidence and human accountability, 75 seconds

Open a finding and its Evidence Item. Show the pinned source and Runbook version. Review the proposed risk and confirm or modify it as the analyst. Emphasize that the model proposal is not the final decision.

## 5. Failure behavior, 45 seconds

Run one standard governed-stop scenario: `SYN-RG-003` for `RejectedByPolicy`, `SYN-APP-003` for execution-time `CannotAssess`, or `SYN-APP-004` for bounded `DependencyFailure`. Show the responsible Skill, Plugin, retryability, retained Evidence, and Partial Decision Lineage. Use `SYN-RG-002` for `NeedsInformation` or `SYN-APP-002` for prompt-injection handling when more time is available.

## 6. Evaluation and reuse, 45 seconds

Open the independent Evaluation Run, point out its Run ID and pinned Skill, implementation, package, Binding, Deployment, and threshold versions, then expand a Case to show all twelve mandatory assertions. Emphasize that Evaluation execution is isolated and does not create operational Reviews. Select **Prove governed reuse** and compare the Security Review Copilot with the Architecture Review Workflow as the secondary Consumer. Point out that each has a distinct Consumer Binding, Correlation ID, and Invocation ID while both resolve `LS-SEC-DOC-INTAKE` v1.0.0, the same implementation, and the same pinned Document Source and Evidence Plugin versions without copying assets.

## 7. Close, 25 seconds

Summarize the pattern: build a governed Skill once, plug it into any Copilot, and retain the evidence needed to trust and improve it. Briefly show the enterprise Dataverse and seven-Solution architecture as the scale-out path, not as a dependency of the demo.

## Demo safeguards

- use only included synthetic data;
- label mock Plugins and Demo Mode clearly;
- do not claim production deployment, customer validation, or approved quality thresholds;
- keep a recorded fallback demo in case the connected tenant is unavailable;
- verify the one-command startup and evaluation immediately before presenting.
