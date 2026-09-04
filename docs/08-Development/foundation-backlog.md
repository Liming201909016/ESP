# ESP Foundation Development Backlog

**Version:** V1.0  
**Authorization:** Synthetic, non-sensitive data only

This backlog tracks the enterprise Power Platform foundation. Hackathon execution priority is governed by `hackathon-mvp-backlog.md`; blocked Dataverse or Connected Mode work must not delay the runnable local demo.

## Status values

- Done: implemented and executable validation passed.
- Ready: inputs and authority are sufficient to start.
- Blocked: a named prerequisite is missing.
- Pending Review: artifact exists but requires accountable-owner approval.

## F0 Toolchain and repository

| ID | Work item | Deliverable and acceptance | Dependency | Status |
|---|---|---|---|---|
| FND-001 | Foundation readiness validation | `Test-FoundationReadiness.ps1` validates package, workbook, contracts, tools, and gate state | None | Done |
| FND-002 | Solution manifest | Seven canonical Solutions and publisher settings validate in PlanOnly mode | None | Done |
| FND-003 | Environment policy template | DEV/TEST/PROD configuration parses, prohibits secrets, and restricts DEV data | None | Done |
| FND-004 | Data authority register | Storage authorities, owners, classifications, and retention gates are explicit | Owner input | Pending Review |
| FND-005 | Install Power Platform CLI | PAC 2.11.2 and `pac solution init` are available from the official user installation | None | Done |
| FND-006 | Finalize repository governance | Git and the public GitHub remote work; approve and record the `main` branch policy | Repository owner approval | Pending Review |
| FND-007 | Validate local Solution packaging | Seven unmanaged Solution ZIPs pack in dependency order with hashes and valid Solution.xml | FND-101 | Done |

## F1 Solution and Dataverse foundation

| ID | Work item | Deliverable and acceptance | Dependency | Status |
|---|---|---|---|---|
| FND-101 | Initialize Solution projects | Seven `.cdsproj` Solution folders generated and metadata validated against the approved publisher | FND-005, publisher review | Done |
| FND-102 | Define Solution dependency order | Dependency matrix generated and reviewed for cycles; no ALM-to-business dependency | Architecture Owner review | Done |
| FND-103 | Generate Dataverse build specification | 42 tables, 312 fields, 57 relationships, Choices, security, and Rules reproduce from source | None | Done |
| FND-104 | Implement ESPCore schema | Core tables, keys, relationships, ownership, and audit settings created in isolated DEV | FND-101, DG-004 review | Blocked |
| FND-105 | Implement remaining schema | Shared Assets, Governance, Evidence, Runtime, MVP, and Reporting components created | FND-104 | Blocked |
| FND-106 | Implement blocking rules | Dependency target, release, binding, evaluation, and evidence rules reject invalid records | FND-104 | Blocked |

## F2 Skill contracts and test assets

| ID | Work item | Deliverable and acceptance | Dependency | Status |
|---|---|---|---|---|
| FND-201 | Validate common Skill contract | Draft 2020-12 schema and 20 request/response fixtures pass | None | Done |
| FND-202 | Create Skill-specific examples | Boundary, error, policy-denial, Human Handoff, and Cannot Assess examples validate for all five Skills | Synthetic scenarios | Done |
| FND-203 | Create synthetic RG dataset | Versioned, hashed, non-sensitive RG inputs and expert-label template | Domain SME review | Pending Review |
| FND-204 | Create synthetic APP dataset | Versioned, hashed, non-sensitive APP inputs and expert-label template | Domain SME review | Pending Review |
| FND-205 | Create evaluation runner | Executes contract and case assertions, pins artifacts, and emits Foundation/Pilot eligibility without promoting synthetic data | SME labels required for Pilot | Done |

## F3 Agent integration foundation

| ID | Work item | Deliverable and acceptance | Dependency | Status |
|---|---|---|---|---|
| FND-301 | Define Copilot Studio mapping | Five Agent Action and Power Automate flow mappings define contracts, oversight, and failure translation | Formal Runtime Owner sign-off before TEST | Done |
| FND-302 | Create primary test Agent | Security Review Agent invokes pinned TEST Skill implementations | FND-101, TEST gate | Blocked |
| FND-303 | Create secondary Consumer | Architecture Review Consumer reuses the same approved Skill without copying assets | FND-302 | Blocked |
| FND-304 | Capture invocation evidence | Correlation, Binding, Deployment, versions, outcomes, telemetry, and Evidence Package references persist | FND-104, FND-302 | Blocked |

## F4 Governance experience and release

| ID | Work item | Deliverable and acceptance | Dependency | Status |
|---|---|---|---|---|
| FND-401 | Model-driven governance app | Owners can review demand, assets, evaluations, releases, deployments, bindings, and evidence | FND-105 | Blocked |
| FND-402 | Approval flows | Gate and release decisions retain approver, evidence, conditions, owner, and expiry | FND-105 | Blocked |
| FND-403 | Package and release automation | Managed downstream package, snapshot, deployment checks, and rollback evidence | FND-101, FND-106 | Blocked |
| FND-404 | Reporting semantic model | Reuse, quality, adoption, risk, cost, and value measures preserve source authority | FND-304 | Blocked |

## Immediate sequence

1. Continue the runnable local Hackathon backlog independently of tenant access.
2. Obtain an explicitly authorized Dataverse DEV environment before FND-104.
3. Complete Domain SME review for the synthetic RG and APP labels.
4. Approve and record the GitHub `main` branch policy.
5. Hold Connected TEST integration until DG-001 through DG-008 are Approved.
