/**
 * Platform maintenance notice from public settings API (same source as legacy Home).
 */
import { useQuery } from '@tanstack/react-query'
import { Wrench } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

export function PublicMaintenanceBanner() {
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/settings/public`)
      if (!res.ok) return {}
      const d = (await res.json()) as { settings: Record<string, string> }
      return d.settings
    },
    staleTime: 60_000,
  })

  const maintenanceMode = settings?.['platform.maintenance_mode'] === 'true'
  const maintenanceMessage =
    settings?.['platform.maintenance_message'] ||
    'We are performing scheduled maintenance. Please check back soon.'

  if (!maintenanceMode) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
      <Wrench className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{maintenanceMessage}</span>
    </div>
  )
}
