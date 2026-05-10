import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Spinner, Button } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { toast } from 'sonner'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

interface SettingRow {
  key: string
  label: string
  description: string
  type: 'toggle' | 'text' | 'number'
}

const SETTING_DEFS: SettingRow[] = [
  {
    key: 'platform.maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Shows a maintenance banner on the home page. Existing users can still log in.',
    type: 'toggle',
  },
  {
    key: 'platform.maintenance_message',
    label: 'Maintenance Message',
    description: 'Message shown in the maintenance banner.',
    type: 'text',
  },
  {
    key: 'platform.new_vendor_signups_enabled',
    label: 'Vendor Sign-ups Open',
    description: 'When off, the vendor application form is hidden.',
    type: 'toggle',
  },
  {
    key: 'platform.new_affiliate_signups_enabled',
    label: 'Affiliate Sign-ups Open',
    description: 'When off, the affiliate sign-up form is hidden.',
    type: 'toggle',
  },
  {
    key: 'platform.affiliate_commission_rate',
    label: 'Default Commission Rate (%)',
    description: 'Fallback commission percentage when an affiliate has no custom rate set.',
    type: 'number',
  },
]

const DEFAULTS: Record<string, string> = {
  'platform.maintenance_mode': 'false',
  'platform.maintenance_message': 'We are performing scheduled maintenance. Please check back soon.',
  'platform.new_vendor_signups_enabled': 'true',
  'platform.new_affiliate_signups_enabled': 'true',
  'platform.affiliate_commission_rate': '10',
}

export default function AdminSettingsPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/settings`, { headers })
      if (!res.ok) throw new Error('Failed to load settings')
      return res.json() as Promise<{ settings: Record<string, string> }>
    },
  })

  useEffect(() => {
    if (data?.settings) {
      const merged = { ...DEFAULTS, ...data.settings }
      setLocalValues(merged)
      setDirty(new Set())
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Settings saved')
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setDirty(new Set())
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function setValue(key: string, value: string) {
    setLocalValues((prev) => ({ ...prev, [key]: value }))
    setDirty((prev) => new Set(prev).add(key))
  }

  function saveKey(key: string) {
    saveMutation.mutate({ [key]: localValues[key] })
  }

  if (isLoading) {
    return <div className="flex min-h-[300px] items-center justify-center"><Spinner size="large" /></div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Changes take effect immediately</p>
      </div>

      <div className="space-y-3">
        {SETTING_DEFS.map((def) => {
          const value = localValues[def.key] ?? DEFAULTS[def.key] ?? ''
          const isDirty = dirty.has(def.key)

          return (
            <Card key={def.key}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{def.label}</p>
                      {isDirty && (
                        <span className="rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning-foreground">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {def.type === 'toggle' ? (
                      <button
                        role="switch"
                        aria-checked={value === 'true'}
                        onClick={() => setValue(def.key, value === 'true' ? 'false' : 'true')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          value === 'true' ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            value === 'true' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : def.type === 'number' ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(def.key, e.target.value)}
                        min={0}
                        max={100}
                        className="h-9 w-20 rounded-md border border-border bg-background px-3 text-sm tabular-nums"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(def.key, e.target.value)}
                        className="h-9 w-64 rounded-md border border-border bg-background px-3 text-sm"
                      />
                    )}

                    <Button
                      size="small"
                      variant={isDirty ? 'primary' : 'outline'}
                      disabled={!isDirty || saveMutation.isPending}
                      onClick={() => saveKey(def.key)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
