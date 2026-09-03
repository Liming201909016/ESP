# Security Review MVP Seed Data Definition

**Version:** V1.0

## Logical Skills

- LS-SEC-DOC-INTAKE, Document Intake, 1.0.0
- LS-SEC-EVIDENCE-EXTRACT, Evidence Extraction, 1.0.0
- LS-SEC-REVIEW, Security Review, 1.0.0
- LS-SEC-RISK-RATING, Risk Rating, 1.0.0
- LS-SEC-REPORT-GEN, Report Generation, 1.0.0

## Initial assets

Prompt Assets: document intake, evidence extraction, control assessment, risk rating, report generation.  
Method Assets: request classification, material completeness, evidence extraction, security review, risk rating, report assembly.  
Template Assets: normalized context schema, Evidence Item schema, finding schema, analyst review screen, review report.  
Knowledge Assets: approved RG and APP Runbooks plus explicitly approved advisory baselines.

## Runtime records

Create Implementation and Implementation Version records, Runtime Profile, version-pinned Dependencies, Package Version, Dependency Snapshot, Release Record, TEST Deployment, primary Consumer, secondary Consumer, and Consumer Bindings.

## Governance records

Create Evaluation Profile, approved test-set reference, Gate Decision, Approval Records, Identity and Policy Bindings, classification, and retention policy.

## Rules

All codes are immutable. Versions are SemVer. Approved versions require hashes and approvals. Seed artifacts contain no secrets or customer-sensitive production content.
