# ESP Design Package Change Log

## V1.0

**Status:** Freeze Candidate  
**Date:** 2026-09-03

### Added

- Microsoft Global Hackathon 2026 project brief, runnable MVP delivery profile, demo script, and Hackathon-first backlog;
- explicit Skill Router and many-to-many Skill/Plugin model with four MVP Plugin contracts;
- mandatory local Demo Mode and optional Power Platform Connected Mode distinction;
- technical feasibility assessment and accepted local TypeScript stack ADR;
- modular architecture specifications;
- Dataverse Build Workbook;
- architecture baseline and change-control rules;
- object relationship, lifecycle, and dependency reference models;
- Security Review MVP use cases, evaluation cases, seed data, and Runbook catalog;
- Prompt Asset and Prompt Asset Version as governed first-class assets;
- Dependency Snapshot, Deployment, Consumer Binding, Invocation Index, Evidence Package, Operational Evidence, and Value Assessment Reference.
- Agent Skill validation architecture and machine-readable Logical Skill contract;
- Development Readiness Gate and Architecture Approval Record;
- complete Dataverse workbook generator covering the V1.0 control chain;
- Runbook admission controls and evaluation threshold register.

### Changed

- separated the runnable Hackathon vertical slice from the 42-table, seven-Solution enterprise scale-out baseline;
- made local synthetic Demo Mode the Hackathon delivery priority so tenant availability cannot block judging;
- changed Connected Mode tools from opaque JSON string parameters to typed Copilot inputs with an internally validated envelope;
- required explicit five-stage orchestration and structured rendering for evidence, risk, and report outputs;
- standardized the canonical name to `Business Objective`;
- standardized the Dataverse table name to `esp_businessobjective`;
- replaced per-invocation dynamic binding with deployment/configuration-time binding for the MVP;
- separated stable Logical Skill contracts from runtime-specific Implementation Versions;
- clarified that Dataverse stores metadata and references rather than full prompt bodies, documents, secrets, or raw telemetry;
- standardized MVP dependencies as version pinned and release snapshotted.
- expanded the Dataverse Build Workbook from a partial model to 42 tables, 312 columns, 57 governed relationships, and 6 blocking rules;
- added complete Choice catalogs, object-specific lifecycle fields, evaluation pinning, and invocation-backed Operational Evidence sources;
- added executable positive and negative contract fixtures for all five MVP Skills;
- added governed External Reference dependencies, direct Evaluation Run version pins, closed nested contract objects, and response fixtures;
- made Foundation development the only permitted work before Development Gate approval.

### Deprecated terminology

- `BusinessObjective`
- `Business Objective Reference`

### Security Review MVP baseline

Initial Logical Skills:

- Document Intake
- Evidence Extraction
- Security Review
- Risk Rating
- Report Generation

### Known V1.1 candidates

- final decision on Outcome Observation as a separate object;
- complete Workflow Definition physical standard;
- expanded governance physical tables for exceptions, retirement, and policy binding;
- automated consumer impact analysis and regression;
- common conceptual Asset pattern documentation.

## Historical baseline lineage

### V0.7 Architecture Review Baseline

Established the four architecture views, platform boundary, Canonical Model, and Logical Skill versus Implementation separation.

### V0.8 Solution Design Baseline

Formalized Deployment, identity and trust, invocation/evidence/value objects, dependency modes, and runtime interaction paths.

### V0.9 Data Dictionary Baseline

Mapped the canonical model to Dataverse entities, business keys, ownership, relationships, storage boundaries, and implementation sequencing.
