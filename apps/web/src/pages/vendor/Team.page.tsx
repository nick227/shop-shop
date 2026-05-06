// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, Input, Spinner, Badge } from '@shared/ui/primitives'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { useVendorStores } from '@shared/hooks/hooks/vendor'
import { useAuthStore } from '@stores/authStore'
import { ShieldCheck, Mail, Users, Truck, X } from 'lucide-react'

type AccessType = 'MANAGER' | 'STAFF' | 'DRIVER'

const ACCESS_PRESETS: Record<AccessType, { label: string; description: string; permissions: string[] }> = {
  MANAGER: {
    label: 'Manager',
    description: 'Can manage orders, menu, analytics, settings, team, and deliveries.',
    permissions: ['FULL_ACCESS'],
  },
  STAFF: {
    label: 'Staff',
    description: 'Can handle orders and menu work without changing store settings.',
    permissions: ['VIEW_ORDERS', 'MANAGE_ORDERS', 'VIEW_ITEMS', 'MANAGE_ITEMS'],
  },
  DRIVER: {
    label: 'Driver',
    description: 'Can receive delivery assignments and update delivery progress.',
    permissions: ['VIEW_DELIVERIES', 'MANAGE_DELIVERIES'],
  },
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

async function apiRequest(path: string, token: string | undefined, options: RequestInit = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || data.message || 'Request failed')
  }
  if (response.status === 204) return null
  return response.json()
}

function summarizePermissions(permissions: unknown) {
  const list = Array.isArray(permissions) ? permissions : []
  if (list.includes('FULL_ACCESS')) return 'Manager'
  if (list.some((p) => String(p).includes('DELIVER'))) return 'Driver'
  return 'Staff'
}

export default function VendorTeamPage() {
  const queryClient = useQueryClient()
  const { storeId: routeStoreId } = useParams()
  const token = useAuthStore((state) => state.token)
  const { data: stores = [], isLoading: storesLoading } = useVendorStores()
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [email, setEmail] = useState('')
  const [accessType, setAccessType] = useState<AccessType>('DRIVER')

  const selectedStore = useMemo(() => {
    const activeId = selectedStoreId || stores[0]?.id
    return stores.find((store) => store.id === activeId) || stores[0]
  }, [selectedStoreId, stores])

  const storeId = selectedStore?.id

  useEffect(() => {
    if (routeStoreId) {
      setSelectedStoreId(routeStoreId)
    }
  }, [routeStoreId])

  const membersQuery = useQuery({
    queryKey: ['team-members', storeId],
    queryFn: async () => (await apiRequest(`/team/stores/${storeId}/members`, token)).members || [],
    enabled: !!storeId,
  })

  const invitationsQuery = useQuery({
    queryKey: ['team-invitations', storeId],
    queryFn: async () => (await apiRequest(`/team/stores/${storeId}/invitations`, token)).invitations || [],
    enabled: !!storeId,
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const preset = ACCESS_PRESETS[accessType]
      return apiRequest('/team/invitations', token, {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          recipientEmail: email.trim(),
          permissions: preset.permissions,
          message: `You have been invited as ${preset.label.toLowerCase()} for ${selectedStore?.name}.`,
        }),
      })
    },
    onSuccess: () => {
      setEmail('')
      queryClient.invalidateQueries({ queryKey: ['team-invitations', storeId] })
      toast.success('Invitation created')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not create invitation'),
  })

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => apiRequest(`/team/invitations/${invitationId}`, token, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-invitations', storeId] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not revoke invitation'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => apiRequest(`/team/members/${memberId}`, token, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members', storeId] }),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not remove member'),
  })

  if (storesLoading) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6">
        <div className="flex min-h-[360px] items-center justify-center">
          <Spinner size="large" />
        </div>
      </PageShell>
    )
  }

  if (!stores.length) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6">
        <EmptyState icon={Users} title="Create a store first" description="Team access is managed per store." />
      </PageShell>
    )
  }

  const members = membersQuery.data || []
  const invitations = invitationsQuery.data || []
  const selectedPreset = ACCESS_PRESETS[accessType]

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6">
      <PageHeader title="Team & Drivers" description="Invite store-scoped managers, staff, and drivers by email." />

      <div className="flex flex-col gap-2 sm:max-w-sm">
        <label className="text-sm font-medium" htmlFor="team-store">Store</label>
        <select
          id="team-store"
          value={storeId}
          onChange={(event) => setSelectedStoreId(event.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Invite by Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="driver@example.com"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="access-type">Access type</label>
              <select
                id="access-type"
                value={accessType}
                onChange={(event) => setAccessType(event.target.value as AccessType)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                {Object.entries(ACCESS_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>{preset.label}</option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              className="self-end"
              disabled={!email.trim() || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              Send Invite
            </Button>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              {accessType === 'DRIVER' ? <Truck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {selectedPreset.label}
            </div>
            {selectedPreset.description}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {membersQuery.isLoading ? (
              <Spinner />
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            ) : members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{member.user?.name || member.user?.email}</div>
                  <div className="truncate text-sm text-muted-foreground">{member.user?.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={summarizePermissions(member.permissionsJson) === 'Driver' ? 'warning' : 'default'}>
                    {summarizePermissions(member.permissionsJson)}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => removeMemberMutation.mutate(member.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitationsQuery.isLoading ? (
              <Spinner />
            ) : invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{invitation.recipientEmail}</div>
                  <div className="text-sm text-muted-foreground">
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{summarizePermissions(invitation.permissionsJson)}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => revokeInvitationMutation.mutate(invitation.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
