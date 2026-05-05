# Contract Diff Visibility

Use this checklist whenever `docs/api/openapi.yaml` changes.

## Current Diff Status

Last synced: 2026-05-05.

No OpenAPI changes are included in this maintenance pass.

| Change type | Current change |
| --- | --- |
| Added endpoints | None |
| Removed endpoints | None |
| Changed request fields | None |
| Changed response fields | None |
| Changed enums | None |
| Changed status codes | None |
| Changed state transitions | None |

## Report Format

```md
## API Contract Diff

Added endpoints:
- METHOD /path

Removed endpoints:
- METHOD /path

Changed request fields:
- Schema.field: old -> new

Changed response fields:
- Schema.field: old -> new

Changed enums:
- Schema: added VALUE, removed VALUE

Changed status codes:
- METHOD /path: added 409, removed 404

Changed state transitions:
- Status: OLD -> NEW
```

## Required Checks

- `pnpm run generate:api`
- `pnpm run check:api`
- `pnpm run test:api`
- Update `docs/api/coverage-report.md`
- Update `docs/api/drift-risk.md`

## Decision Rules

- Removed endpoints or required fields are breaking changes.
- Enum removals are breaking changes.
- New optional response fields are non-breaking.
- New required request fields require a versioning decision.
