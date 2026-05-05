# API Versioning

The current API contract is `v1`.

## Current Version

- Public checkout paths are mounted under `/api/v1`.
- `docs/api/openapi.yaml` describes the `v1` checkout contract.
- `apps/web/src/types/api.ts` is generated from that contract.

## Non-Breaking Changes

Non-breaking changes stay in `v1` and must update OpenAPI first.

Examples:

- Adding an optional request field.
- Adding an optional response field.
- Adding a new error response already represented by the standard error envelope.

## Breaking Changes

Breaking changes require a new versioned path and a migration plan.

Examples:

- Removing or renaming a field.
- Changing a field type.
- Changing a required field.
- Changing enum values or allowed state transitions.
- Changing endpoint semantics for the same method and path.

## Release Rules

- Do not introduce `v2` until a breaking change is approved.
- Do not change server behavior without updating `docs/api/openapi.yaml`.
- Regenerate frontend types with `pnpm run generate:api` after spec changes.
- Run `pnpm run check:api` before merging API contract changes.
*** Update File: C:\wamp64\www\shop-shop\.gitignore
@@
 !docs/api/usage.md
+!docs/api/versioning.md
 !docs/api/openapi.yaml
