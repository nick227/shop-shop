# Investigate: Fastify `inject` hang on successful dispatch

**Status:** open  
**Severity:** test / DX (does not block production dispatch logic)  
**Bypass:** `apps/server/src/__tests__/delivery-dispatch-lifecycle.test.ts` calls `dispatchOrderDelivery` directly instead of `POST /api/v1/orders/:orderId/dispatch` so the suite stays green.

## Observed behavior

- `dispatchOrderDelivery` completes in ~300ms when invoked directly.
- `app.inject({ method: 'POST', url: '/api/v1/orders/:id/dispatch', ... })` on the **success path (201)** hangs until Vitest hits the default timeout (~5s then ~30s if raised).
- Same pattern affects **`order-dispatch.route.test.ts`** — the case that expects **201** and a created `DeliveryJob`.

So the smell is **route / plugin / test-app lifecycle**, not the DoorDash mock adapter or core DB service.

## First-pass inspection (route + service)

**Success handler pattern — OK.** The route ends with a single return and no extra awaited work after send:

```69:70:apps/server/src/routes/order-dispatch.route.ts
      return reply.code(201).send({ deliveryJob: toDeliveryJobResponse(deliveryJob) })
```

**API response:** `deliveryJob` is now an explicit **`DeliveryJobResponse`** (see `apps/server/src/resources/delivery-job.resource.ts`) — plain JSON, ISO date strings, **no `providerPayload`** on this route.

**Dispatch service — no realtime on this path.** `dispatchOrderDelivery` only runs Prisma reads/writes and `getDeliveryProviderAdapter(...).createDelivery`; it does **not** call `OrderService`, `publishOrderStatusChanged`, or `publishOrderCreated` (`packages/db/src/services/delivery-dispatch.service.ts`). So the usual **broadcast / realtime** suspects do not apply *inside* dispatch unless something else hooks Prisma.

**Minimal test app — no full-server hooks.** `order-dispatch.route.test.ts` builds `Fastify()` + `app.decorate('authenticate', authenticate)` + `orderDispatchRoutes` only. It does **not** register `apps/server/src/index.ts` hooks (`requestIdMiddleware`, `optionalAuthenticate`, etc.), so global server plugins are ruled out for that test file.

**Serialization / DTO probe:** The route now returns **`toDeliveryJobResponse(deliveryJob)`** instead of the raw Prisma object. If **`inject` still hangs on errors that never build that body** (e.g. 400 for pickup order), the stall is **not** explained by serializing the Prisma `DeliveryJob` alone — treat **`inject`/test-app** as the primary suspect until reproduced otherwise.

**Updated suspicion focus:** vite-node + Fastify `inject`, auth/`requireAuth` timing, or handles left open — revisit raw JSON serialization only after inject completes reliably.

### Layered inject probes (`apps/server/src/routes/order-dispatch.inject-probe.test.ts`)

Run: `pnpm --dir apps/server exec vitest run src/routes/order-dispatch.inject-probe.test.ts`

| Layer | What runs | Purpose |
|-------|-----------|---------|
| 1 | Bare Fastify, `POST /debug-dispatch-test` → 201 `{ ok: true }` | Baseline `inject` |
| 2 | + `app.decorate('authenticate', authenticate)` | Decoration alone |
| 3 | Stub `POST /api/v1/orders/:orderId/dispatch` → 201 (no auth) | Same URL shape as dispatch |
| 3b | + no-op **async `preHandler`** | Async preHandler alone |
| 3c | **`authenticate(req, reply)` inside route handler** + Bearer | Auth in **handler**, not preHandler |
| 4–6 | **`preHandler: [requireAuth]`** + Bearer + stub 201 (layer 6 adds Prisma in handler) | Match real dispatch wiring |

**Outcome (local Vitest):** layers **1–3c pass**; layers **4–6 time out**. Failure aligns with **`requireAuth` registered as `preHandler`**, not with dispatch logic, JSON body, Prisma in the route handler (3c proves handler-side auth + inject can work), or the `/dispatch` URL shape.

**Next steps:** Inspect **`requireAuth` + `preHandler` + `inject`** (Fastify version, double-`send`, `reply.sent`); try **`await authenticate` only inside the route handler** for this route as an experiment; compare with production (`inject` vs real HTTP).

## Likely suspects (check in order)

1. Route **awaits something that never resolves** after sending the response.
2. **Response sent** but a **lifecycle hook** keeps the request open.
3. **Realtime / event publish** promise never settles (broadcast, SSE, pub/sub).
4. **Background delivery/status** path not mocked in tests.
5. **Plugin registration** leaves an open handle (timer, socket, subscription).
6. Test app **teardown** incomplete (`close()`, disconnect, clear timers).

## Investigation checklist

- [x] Trace `order-dispatch.route.ts` success path — uses `return reply.code(201).send(...)`; nothing awaited after.
- [x] Confirm dispatch service path — no realtime publisher calls in `dispatchOrderDelivery`.
- [ ] Prisma extension / middleware on `deliveryJob` update (if any beyond coords guard on `Order`).
- [x] Explicit response DTO — `toDeliveryJobResponse` on **201** (`delivery-job.resource.ts`); omit `providerPayload` from vendor dispatch API.
- [ ] If `inject` still hangs when returning only `{ ok: true }` on 201, confirm hang is outside response shape.
- [ ] Run minimal inject repro with Fastify logger + trace; compare `GET` vs `POST` success on same app.
- [ ] Vitest: try `pool: 'forks'` vs default for this file only; rule out worker deadlock.

## Related files

- `apps/server/src/routes/order-dispatch.route.ts`
- `apps/server/src/routes/order-dispatch.route.test.ts` (201 case)
- `apps/server/src/__tests__/delivery-dispatch-lifecycle.test.ts` (intentionally bypasses HTTP)

## Recommended commit split (review hygiene)

1. DB generated client / dist import fix  
2. Vitest env preload + dispatch lifecycle test  
3. DoorDash service client  
4. Vendor dispatch UI/routes  
5. Customer tracking page  

---

## Follow-on product work (not blocked by this bug)

Customer delivery tracking:

- Timeline, provider tracking URL, ETA/status.
- **Polling first:** e.g. `GET /api/delivery-jobs/:id` every 10–20s while job is active.
- Later: realtime events (`delivery.status.updated`, `delivery.location.updated`).
