# ESP Lifecycle Models

**Version:** V1.0

## Asset identity

```text
Draft → In Review → Approved → Deprecated → Retired
```

Identity metadata may change with audit. Approved versions remain immutable.

## Version lifecycle

```text
Draft → In Review → Approved → Pilot → Production → Deprecated → Retired
```

Pilot and Production are used only where operational state is meaningful. A version cannot enter Approved without owner, contract, dependencies, evaluation evidence, limitations, and approval.

## Implementation and release

Implementation Version: Draft, Validated, Approved, Deprecated, Retired.  
Package: Built, Validated, Approved, Superseded, Retired.  
Deployment: Planned, Deploying, Succeeded, Failed, Rolled Back, Retired.  
Binding: Draft, Active, Suspended, Expired, Retired.

## Evaluation and evidence

Evaluation Run: Planned, Running, Completed, Failed, Cancelled.  
Gate: Approved, Conditionally Approved, Rejected, Requires Remediation.  
Evidence review: Unreviewed, In Review, Verified, Rejected, Archived.

## Retirement

Retirement requires impact analysis, replacement where applicable, Consumer migration, binding removal, identity/connection cleanup, retained evidence, and approval.
