# ESP Dependency Model

**Version:** V1.0

## Purpose

Define governed references from Logical Skill or Implementation Versions to reusable asset versions.

## Targets

Knowledge Asset Version, Prompt Asset Version, Template Asset Version, Method Asset Version, Tool Contract Version, Workflow Definition Version, or External Reference. An External Reference is a governed ESP record containing the authoritative URI, immutable source version, artifact hash, authority, classification, lifecycle, and approval evidence; it does not copy the external content into Dataverse.

## Modes

- Version Pinned: exact version. Default for MVP.
- Immutable Snapshot: exact artifact content/hash frozen for release.
- Governed Latest: current approved version, permitted only with owner, authority, freshness, notification, and runtime source-version recording.

## Dependency record

Contains source version, dependency type, exactly one of the seven governed target lookups, mode, mandatory flag, usage role, compatibility constraint, classification, lifecycle, and approval where required. Synchronous validation blocks zero targets, multiple targets, or a Dependency Type that does not match the populated lookup.

## Snapshot

At package/release time resolve each target and record identity, resolved version, artifact URI, hash, resolution status, and generation method. Release is blocked if mandatory dependencies cannot be resolved or hashes fail.

## Impact analysis

Before deprecation or breaking change, list affected Implementation Versions, packages, deployments, bindings, Consumers, test sets, and owners. Consumers never silently follow an untested version.
