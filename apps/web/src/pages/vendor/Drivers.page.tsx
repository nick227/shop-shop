import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, Input, Spinner, Badge } from '@shared/ui/primitives'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { useVendorStores, useVendorTeamRequest } from '@shared/hooks/hooks/vendor'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { Mail, Truck, Users, X } from 'lucide-react'

const DRIVER_INVITE_PRESET = {
  label: 'Driver',
  description: 'Can view and update deliveries for this store (assignments from your dispatch flow).',
  permissions: ['VIEW_DELIVERIES', 'MANAGE_DELIVERIES'] as const,
}

const DELIVERY_PERMISSIONS = new Set(['VIEW_DELIVERIES', 'MANAGE_DELIVERIES', 'ASSIGN_DELIVERIES'])

interface DeliveryDriverRow {
  readonly id: string
  readonly permissionsJson?: unknown
  readonly user?: {
    readonly name?: string | null
    readonly email?: string | null
    readonly phone?: string | null
  }
}

interface InvitationRow {
  readonly id: string
  readonly recipientEmail: string
  readonly expiresAt: string
  readonly permissionsJson?: unknown
}

function isDriverInvitation(permissions: unknown): boolean {
  const list = Array.isArray(permissions) ? permissions : []
  return list.some((p) => String(p).includes('DELIVER'))
}

function parsePermissions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : []
}

export default function VendorDriversPage() {
  const queryClient = useQueryClient()
  const teamRequest = useVendorTeamRequest()
  const { data: stores = [], isLoading: storesLoading } = useVendorStores()
  const { selectedStoreId, selectedStore } = useVendorActiveStore()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')

  const inviteMessage = useMemo(() => {
    const storeName = selectedStore && 'name' in selectedStore ? String(selectedStore.name) : 'the store'
    const contact =
      [displayName.trim() && `Name: ${displayName.trim()}`, phone.trim() && `Phone: ${phone.trim()}`]
        .filter(Boolean)
        .join(' · ') || undefined
    const base = `You have been invited as a delivery driver for ${storeName}.`
    return contact ? `${base} (${contact})` : base
  }, [displayName, phone, selectedStore])

  const driversQuery = useQuery({
    queryKey: ['store-drivers', selectedStoreId],
    queryFn: async () => {
      const json = await teamRequest<{ drivers?: DeliveryDriverRow[] }>(
        `/team/stores/${selectedStoreId}/drivers`
      )
      return json.drivers ?? []
    },
    enabled: Boolean(selectedStoreId),
  })

  const invitationsQuery = useQuery({
    queryKey: ['team-invitations-drivers', selectedStoreId],
    queryFn: async () => {
      const json = await teamRequest<{ invitations?: InvitationRow[] }>(
        `/team/stores/${selectedStoreId}/invitations`
      )
      return (json.invitations ?? []).filter((inv) => isDriverInvitation(inv.permissionsJson))
    },
    enabled: Boolean(selectedStoreId),
  })

  const inviteMutation = useMutation({
    mutationFn: async () =>
      teamRequest('/team/invitations', {
        method: 'POST',
        body: JSON.stringify({
          storeId: selectedStoreId,
          recipientEmail: email.trim(),
          permissions: [...DRIVER_INVITE_PRESET.permissions],
          message: inviteMessage,
        }),
      }),
    onSuccess: () => {
      setEmail('')
      setDisplayName('')
      setPhone('')
      void queryClient.invalidateQueries({ queryKey: ['team-invitations-drivers', selectedStoreId] })
      toast.success('Driver invitation sent')
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Could not send invitation'),
  })

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) =>
      teamRequest(`/team/invitations/${invitationId}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['team-invitations-drivers', selectedStoreId] }),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Could not revoke invitation'),
  })

  const removeDriverAccessMutation = useMutation({
    mutationFn: async (member: DeliveryDriverRow) => {
      const perms = parsePermissions(member.permissionsJson)

      // FULL_ACCESS implies delivery access; require a team role change instead.
      if (perms.includes('FULL_ACCESS')) {
        throw new Error('This user is a manager (FULL_ACCESS). Remove driver access from the Team page by changing their role.')
      }

      const nextPerms = perms.filter((p) => !DELIVERY_PERMISSIONS.has(p))

      // If they’d have no permissions left, remove the membership entirely.
      if (nextPerms.length === 0) {
        return teamRequest(`/team/members/${member.id}`, { method: 'DELETE' })
      }

      return teamRequest(`/team/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions: nextPerms }),
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['store-drivers', selectedStoreId] })
      void queryClient.invalidateQueries({ queryKey: ['team-members', selectedStoreId] })
      toast.success('Driver access updated')
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Could not update driver access'),
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
        <EmptyState icon={Users} title="Create a store first" description="Drivers are managed per store." />
      </PageShell>
    )
  }

  const drivers = driversQuery.data ?? []
  const driverInvitations = invitationsQuery.data ?? []
  const driversError = driversQuery.error

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6">
      <PageHeader
        title="Drivers"
        description="People who can fulfill or update deliveries for this store. Third-party provider linking can be added later. Switch the active store from the header."
      />

      {driversError ? (
        <p className="text-sm text-destructive">
          {driversError instanceof Error ? driversError.message : 'Could not load drivers for this store.'}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Invite driver by email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="driver@example.com"
            />
            <Input
              label="Name (optional)"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Full name"
            />
            <Input
              label="Phone (optional)"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+1…"
            />
          </div>
          <Button
            variant="primary"
            className="w-fit"
            disabled={!email.trim() || inviteMutation.isPending}
            onClick={() => inviteMutation.mutate()}
          >
            Send driver invite
          </Button>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Truck className="h-4 w-4" />
              {DRIVER_INVITE_PRESET.label}
            </div>
            {DRIVER_INVITE_PRESET.description}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Active drivers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {driversQuery.isLoading ? (
              <Spinner />
            ) : drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drivers with delivery permissions yet.</p>
            ) : (
              drivers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{member.user?.name || member.user?.email}</div>
                    <div className="truncate text-sm text-muted-foreground">{member.user?.email}</div>
                    {member.user?.phone ? (
                      <div className="truncate text-xs text-muted-foreground">{member.user.phone}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Driver</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDriverAccessMutation.mutate(member)}
                      aria-busy={removeDriverAccessMutation.isPending}
                      disabled={removeDriverAccessMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Pending driver invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitationsQuery.isLoading ? (
              <Spinner />
            ) : driverInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending driver invitations.</p>
            ) : (
              driverInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{invitation.recipientEmail}</div>
                    <div className="text-sm text-muted-foreground">
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Driver</Badge>
                    <Button variant="ghost" size="icon" onClick={() => revokeInvitationMutation.mutate(invitation.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
