import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { getRealtimeClient, resetRealtimeClient } from '@services/realtimeClient'
import { accountCapabilitiesKey, useAccountCapabilities } from './useAccountCapabilities'

/** Live account metadata keeps menus, gates, and cached store permissions in sync. */
export function AccountAccessSync() {
  const userId = useAuthStore((s) => s.user?.id)
  const token = useAuthStore((s) => s.token)
  const client = useQueryClient()
  const { pathname } = useLocation()
  const { capabilities } = useAccountCapabilities()

  useEffect(() => {
    if (!userId || !token) return
    const refresh = () => {
      void client.invalidateQueries({ queryKey: accountCapabilitiesKey(userId) })
      void client.invalidateQueries({ queryKey: ['vendor-managed-stores', userId] })
    }
    const realtime = getRealtimeClient()
    const unsubscribe = realtime.subscribeCustomer(userId, (event) => {
      if (event.type === 'account.access.changed') refresh()
    })
    const offConnected = realtime.on('connected', refresh)
    void (async () => {
      try { await realtime.connect() } catch { /* focus and polling provide reconnect fallback */ }
    })()
    window.addEventListener('account:access-denied', refresh)
    const timer = window.setInterval(refresh, 30_000)
    return () => {
      unsubscribe()
      offConnected()
      resetRealtimeClient()
      window.removeEventListener('account:access-denied', refresh)
      window.clearInterval(timer)
      client.removeQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('vendor-') || query.queryKey[0] === 'account-capabilities' })
    }
  }, [userId, token, client])

  useEffect(() => {
    if (userId) void client.invalidateQueries({ queryKey: accountCapabilitiesKey(userId) })
  }, [pathname, userId, client])

  useEffect(() => {
    if (capabilities && !capabilities.canAccessVendorPortal) {
      void client.cancelQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('vendor-') })
      client.removeQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('vendor-') })
    }
  }, [capabilities, client])
  return null
}
