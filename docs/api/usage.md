# API Usage Rules

The checkout API contract is defined by `docs/api/openapi.yaml`.

## Frontend Rules

- Do not call `fetch('/api/...')` from components.
- Do not hard-code checkout endpoint URLs in components.
- Checkout API calls must go through `apps/web/src/api/client.ts`.
- Request and response types must come from `apps/web/src/types/api.ts`.
- Generated API types must be regenerated with `pnpm run generate:api` after changing `docs/api/openapi.yaml`.

## Contract Rules

- Endpoint paths, path params, request bodies, response bodies, errors, enums, and state transitions come from OpenAPI.
- No duplicate checkout request or response interfaces outside generated types.
- Runtime client helpers may be thin wrappers only: base URL, auth headers, idempotency headers, JSON parsing, and typed return values.
- Business logic does not belong in the API client.
