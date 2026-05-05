# API Contract

`docs/api/openapi.yaml` is the single source of truth for the public API contract.

## Rules

- OpenAPI defines system behavior for documented API routes.
- Any API behavior change must update `docs/api/openapi.yaml` in the same change.
- API handlers must not expose undocumented request fields, response fields, paths, path parameters, status enums, or state transitions.
- Frontend API types must be generated from `docs/api/openapi.yaml`.
- Frontend code must consume generated API types instead of duplicating request or response shapes.
- No undocumented checkout endpoints are allowed.

## Versioning

- The current API version is `v1`, mounted under `/api/v1`.
- Do not introduce `v2` until a breaking API change is intentionally accepted.
- Non-breaking additions stay in `v1` and must be represented in OpenAPI before use.
- Breaking changes require a new versioned path and a migration plan.

## Drift Check

Run the read-only checker before changing checkout routes or the spec:

```sh
pnpm exec tsx scripts/check-api-drift.ts
```

The checker compares implemented checkout routes with `docs/api/openapi.yaml` and reports missing endpoints, method mismatches, and path parameter mismatches.
