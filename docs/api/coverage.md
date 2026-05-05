# API Contract Coverage

| Endpoint | Covered | Used in funnel | Enforced |
| --- | --- | --- | --- |
| `POST /checkout/session` | Yes | Yes | Yes |
| `POST /checkout/complete` | Yes | Yes | Yes |
| `GET /checkout/status/{sessionId}` | Yes | Yes | Yes |
| `POST /carts` | Smoke only | Yes | Usage only |
| `GET /orders/{id}` | Partial | Yes | Usage only |
| `/kitchen/*` | Not covered | Yes | Usage only |
| Search route | Optional smoke URL | Yes | Usage only |

## Notes

- Runtime checkout coverage lives in `tests/api-contract.runtime.test.ts`.
- Funnel smoke coverage lives in `tests/funnel.smoke.test.ts`.
- Static contract gates are `check:api:drift`, `check:api:contract`, and `check:api:usage`.
- `/carts`, `/orders`, `/kitchen`, and search are not yet modeled in `docs/api/openapi.yaml`; current enforcement prevents raw funnel-critical fetch usage but does not validate their full OpenAPI schemas.
