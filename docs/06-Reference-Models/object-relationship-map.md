# ESP Object Relationship Map

**Version:** V1.0

```text
Business Objective
└─ Use Case
   ├─ Capability Assessment
   ├─ Consumer
   └─ Use Case Skill Requirement
      └─ Logical Skill
         └─ Logical Skill Version
            ├─ Implementation
            │  └─ Implementation Version
            │     ├─ Dependency → Asset Version
            │     └─ Package Version
            │        └─ Dependency Snapshot
            │           └─ Release Record
            │              └─ Deployment
            │                 └─ Consumer Binding
            │                    └─ Invocation Index
            │                       └─ Evidence Package
            │                          └─ Evidence Item
            └─ Evaluation Profile → Evaluation Run → Gate Decision

Operational Evidence aggregates Invocation and disposition measures through Operational Evidence Source records, each of which identifies one Invocation Index record.
Value Assessment Reference links evidence to the business-owned decision.
```

## Supporting control relationships

```text
Runtime Profile
├─ Implementation Version
└─ Deployment

Consumer Binding
├─ Identity Binding → Identity Profile
├─ Policy Binding
└─ Evaluation Run

Package Version → Evaluation Run → Gate Decision → Approval Record
Release Record → Approval Record
```

Capability Assessment and Use Case Skill Requirement belong to a Use Case. A Use Case Skill Requirement pins a Logical Skill Version. Evaluation Profile belongs to a Logical Skill Version. Operational Evidence identifies its Use Case and Logical Skill Version; detailed invocation and disposition facts remain reachable through referenced Invocation Index and Evidence Package records.

## Asset versions

Knowledge, Prompt, Template, Method, Tool Contract, and Workflow Definition each have stable identity and immutable versions. Dependencies and snapshots point to versions, never mutable identity alone.

An approved External Reference may also be a Dependency target. Its governed record pins external URI, source version, hash, authority, and classification while leaving content in the authoritative external store.

## Cardinality rules

Stable asset 1:N versions; Logical Skill Version 1:N Implementations and Evaluation Profiles; Implementation 1:N versions; Implementation Version 1:N dependencies and Package Versions; Package Version 1:N Dependency Snapshots, Release Records, and Evaluation Runs; Release 1:N Deployments; Consumer 1:N Bindings; Deployment 1:N Bindings; Binding 1:N Invocations; Invocation 1:N Evidence Packages and Operational Evidence Sources; Evidence Package 1:N Evidence Items; Operational Evidence 1:N Operational Evidence Sources; Evaluation Profile 1:N Evaluation Runs; Evaluation Run 1:N Gate Decisions.

A Dependency has exactly one governed target: one of six versioned asset types or one External Reference. Gate and Release approvals are optional while Draft and mandatory before promotion. Consumer Binding requires one Consumer, Deployment, Logical Skill Version, and Implementation Version.
