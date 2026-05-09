# Investigate: Fastify `inject` hang on successful dispatch

**Status:** open  
**Severity:** test / DX (does not block production dispatch logic)  
**Bypass:** `apps/server/src/__tests__/delivery-dispatch-lifecycle.test.ts` calls `dispatchOrderDelivery` directly instead of `POST /api/v1/orders/:orderId/dispatch` so the suite stays green.

## Observed behavior

- `dispatchOrderDelivery` completes in ~300ms when invoked directly.
- `app.inject({ method: 'POST', url: '/api/v1/orders/:id/dispatch', ... })` on the **success path (201)** hangs until Vitest hits the default timeout (~5s then ~30s if raised).
- Same pattern affects **`order-dispatch.route.test.ts`** — the case that expects **201** and a created `DeliveryJob`.

So the smell is **route / plugin / test-app lifecycle**, not the DoorDash mock adapter or core DB service.

## Likely suspects (check in order)

1. Route **awaits something that never resolves** after sending the response.
2. **Response sent** but a **lifecycle hook** keeps the request open.
3. **Realtime / event publish** promise never settles (broadcast, SSE, pub/sub).
4. **Background delivery/status** path not mocked in tests.
5. **Plugin registration** leaves an open handle (timer, socket, subscription).
6. Test app **teardown** incomplete (`close()`, disconnect, clear timers).

## Investigation checklist

- [ ] Trace `order-dispatch.route.ts` success path after `reply.code(201).send(...)`.
- [ ] Confirm no `await` after `return reply...` in middleware/plugins used by this route.
- [ ] Search for `setOrderServiceBroadcast`, realtime, River, or websocket hooks touching orders/delivery.
- [ ] Run the minimal inject repro with Fastify logger enabled and a single route registered.
- [ ] Compare with a trivial `GET` inject on the same app instance.

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
