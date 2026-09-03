# ESP Design Package V1.0 Delivery Notes

## 1. Delivery purpose

This package supports two related deliveries: a runnable Microsoft Global Hackathon 2026 MVP and the enterprise Dataverse/Power Platform baseline. It gives demo developers, architects, Dataverse builders, Power Platform developers, governance reviewers, and security SMEs a common set of names, boundaries, relationships, and acceptance rules.

The Hackathon MVP proves the core value with synthetic data and a local Demo Mode. The enterprise baseline defines how the same contracts and identifiers scale to connected environments. Enterprise approval gates do not prevent local synthetic development, but they continue to block customer data, TEST/Pilot claims, and production deployment.

## 2. Required reading by role

### Architecture and product owners

Read `01-Architecture`, `06-Reference-Models`, and `04-Governance` to confirm scope, canonical objects, lifecycle, dependencies, and change control.

### Dataverse builders

Read the architecture object definitions, then use `02-Data-Design/dataverse-build-workbook.xlsx` as the construction input. Validate business keys, relationships, security roles, audit fields, and seed data before creating tables.

### Agent and flow developers

Read `technical-architecture.md`, `runtime-architecture.md`, `agent-skill-validation.md`, `logical-skill-contract-standard.md`, `dependency-model.md`, and the Security Review MVP companion documents. Runtime components must validate the approved contract, reference approved versions, and cannot create uncontrolled copies of shared assets.

### Security and evaluation reviewers

Review the authority hierarchy, Human Oversight requirements, evidence rules, adversarial cases, and Runbook catalog before approving a pilot.

## 3. Handoff conditions

### Required before Hackathon demo

- one-command Demo Mode startup from a clean workspace;
- one Copilot-style entry, Skill Router, five registered Skills, and four Plugins;
- synthetic RG and APP cases with visible Demo/Mock labels;
- evidence links, analyst disposition, draft report, and execution trace;
- automated contract and Foundation evaluation passing;
- no tenant, customer-data, secret, or production-connection dependency;
- rehearsed five-minute demo and recorded fallback.

### Required before connected enterprise build

- approved Development Readiness Gate and effective Architecture Approval Record;
- named Business Owner, Capability Owner, Domain SME, and Implementation Owner;
- confirmation of the Security Review MVP scope;
- approval of the canonical terminology and object relationships;
- review of the Dataverse Build Workbook;
- approval of source-data classifications and authorized repositories.

### Required before pilot

- approved RG and APP Runbook versions and owners;
- validated Logical Skill contracts and Agent implementation mappings;
- approved Prompt, Method, and Template Asset Versions;
- expert-labelled evaluation cases and thresholds;
- active TEST Deployment and Consumer Binding;
- successful primary Agent and second-Consumer Evaluation Runs;
- Identity and Policy Bindings;
- evidence retention and telemetry references;
- analyst review workflow.

### Required before production

- managed solution release evidence;
- approved Gate Decision and Release Record;
- tested rollback target;
- production security and DLP approvals;
- support ownership and escalation path;
- business-owned baseline and value-measurement approach.

## 4. MVP boundaries

The Hackathon and enterprise Security Review MVPs are read-only and draft-producing. They do not autonomously approve or reject requests, modify business systems, create tickets, contact applicants, or infer missing evidence. Missing or unverifiable evidence must produce `Needs Information` or `Cannot Assess`.

The Hackathon MVP is not a full implementation of all canonical objects, Dataverse tables, Solutions, approvals, reports, or integrations. Mock Plugins prove contracts and orchestration only and must be visibly distinguished from connected enterprise Plugins.

## 5. Change control

Do not change canonical objects, responsibilities, cardinalities, Solution dependencies, business contracts, identity boundaries, evidence boundaries, storage authority, or write/execute behavior directly in implementation. Submit an Architecture Change Review and update all affected documents.

## 6. Delivery status

Architecture completeness: complete, pending sign-off  
Dataverse construction input: structurally validated, pending Dataverse Lead review  
Hackathon Demo Mode: approved for synthetic, non-sensitive implementation  
Hackathon Connected Mode: optional and environment-dependent  
TEST integration, Pilot, and Production: blocked until the applicable gates are approved  
Final production authorization: not implied by this package
