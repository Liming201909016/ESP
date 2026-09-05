# ESP Repository Policy

**Repository:** `https://github.com/Liming201909016/ESP`  
**Default branch:** `main`  
**Owner:** Liming  
**Status:** Approved for Hackathon publication

## Main Branch Controls

- Changes enter `main` through a pull request.
- `Validate ESP / Build, test, evaluate, and audit` must pass before merge.
- One approving review is required.
- Stale approvals are dismissed when new commits are pushed.
- The latest push must be approved by someone other than its author.
- Force pushes and branch deletion are prohibited.
- Administrators are subject to the same controls.
- All review conversations must be resolved before merge.

## Validation Scope

The required workflow installs pinned Node.js and Python dependencies, builds the application, runs API/production/browser tests, executes the independent synthetic evaluation, and rejects production dependency audits with high or critical advisories.

## Exceptions

Emergency changes require a documented reason, accountable owner, validation evidence, and a follow-up pull request restoring the normal control path. This policy does not authorize Connected TEST, Pilot, Production, customer data, or production credentials.