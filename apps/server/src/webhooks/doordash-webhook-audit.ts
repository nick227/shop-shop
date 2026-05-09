const MAX_STORED_EVENT_IDS = 200

export function extractProcessedDoorDashEventIds(providerPayload: unknown): ReadonlySet<string> {
  if (providerPayload === null || typeof providerPayload !== 'object' || Array.isArray(providerPayload)) {
    return new Set()
  }
  const o = providerPayload as Record<string, unknown>
  const dd = o.doorDashWebhook
  if (dd === null || typeof dd !== 'object' || Array.isArray(dd)) {
    return new Set()
  }
  const ids = (dd as { processedEventIds?: unknown }).processedEventIds
  if (!Array.isArray(ids)) {
    return new Set()
  }
  const out = new Set<string>()
  for (const x of ids) {
    if (typeof x === 'string' && x.length > 0) {
      out.add(x)
    }
  }
  return out
}

/**
 * Merges DoorDash webhook audit metadata into the adapter-produced JSON payload without removing mapped fields.
 */
export function mergeDoorDashWebhookAudit(
  adapterPayload: unknown,
  eventId: string | undefined,
  rawEvent: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    adapterPayload !== null && typeof adapterPayload === 'object' && !Array.isArray(adapterPayload)
      ? (adapterPayload as Record<string, unknown>)
      : {}

  const prevDd = base.doorDashWebhook
  const prevObj =
    prevDd !== null && typeof prevDd === 'object' && !Array.isArray(prevDd)
      ? (prevDd as Record<string, unknown>)
      : {}

  const prevIdsRaw = prevObj.processedEventIds
  const prevIds = Array.isArray(prevIdsRaw)
    ? prevIdsRaw.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : []

  const mergedIds = eventId ? [...new Set([...prevIds, eventId])] : prevIds
  const capped =
    mergedIds.length > MAX_STORED_EVENT_IDS
      ? mergedIds.slice(mergedIds.length - MAX_STORED_EVENT_IDS)
      : mergedIds

  return {
    ...base,
    doorDashWebhook: {
      ...prevObj,
      processedEventIds: capped,
      lastRawEvent: rawEvent,
      lastProcessedAt: new Date().toISOString(),
    },
  }
}
