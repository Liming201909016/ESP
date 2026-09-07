# ESP Hackathon Demo Script

**Target duration:** 5 minutes

## 1. Problem, 30 seconds

Show two enterprise Copilots that would normally copy the same document-intake logic. Explain that copied prompts and tools cannot be independently versioned, evaluated, or traced.

## 2. One Copilot, 45 seconds

Open the ESP Security Review Copilot in Demo Mode. Select `SYN-RG-001` and ask for a review. Point out the single entry experience and Correlation ID.

## 3. Skills and Plugins, 75 seconds

Open the execution trace. Show five stable Skills using four reusable Plugins. Highlight that Document Intake and Evidence Extraction share `PLG-DOC-SOURCE`, while every Skill uses `PLG-EVIDENCE`.

## 4. Evidence and human accountability, 75 seconds

Open a finding and its Evidence Item. Show the pinned source and Runbook version. Review the proposed risk and confirm or modify it as the analyst. Emphasize that the model proposal is not the final decision.

## 5. Failure behavior, 45 seconds

Run `SYN-RG-002` or `SYN-APP-002`. Show `NeedsInformation` for missing material or demonstrate that the prompt-injection text is ignored and recorded as a safe outcome.

## 6. Evaluation and reuse, 45 seconds

Show the automated Evaluation Run and mandatory assertion result. Select **Prove governed reuse** and compare the Security Review Copilot with the Architecture Review Workflow. Point out that each has a distinct Consumer Binding, Correlation ID, and Invocation ID while both resolve `LS-SEC-DOC-INTAKE` v1.0.0, the same implementation, and the same pinned Document Source and Evidence Plugin versions without copying assets.

## 7. Close, 25 seconds

Summarize the pattern: build a governed Skill once, plug it into any Copilot, and retain the evidence needed to trust and improve it. Briefly show the enterprise Dataverse and seven-Solution architecture as the scale-out path, not as a dependency of the demo.

## Demo safeguards

- use only included synthetic data;
- label mock Plugins and Demo Mode clearly;
- do not claim production deployment, customer validation, or approved quality thresholds;
- keep a recorded fallback demo in case the connected tenant is unavailable;
- verify the one-command startup and evaluation immediately before presenting.
