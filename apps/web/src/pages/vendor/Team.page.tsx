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
import { ShieldCheck, Mail, Users, X } from 'lucide-react'

type TeamRolePreset =
  | 'MANAGER'
  | 'STAFF'
  | 'MENU_EDITOR'
  | 'ORDER_HANDLER'
  | 'FINANCE'

const TEAM_ROLE_PRESETS: Record<
  TeamRolePreset,
  { readonly label: string; readonly description: string; readonly permissions: readonly string[] }
> = {
  MANAGER: {
    label: 'Manager',
    description: 'Full access to operate the store, team, orders, menu, and settings.',
    permissions: ['FULL_ACCESS'],
  },
  STAFF: {
    label: 'Staff',
    description: 'Orders and menu work without changing store settings.',
    permissions: ['VIEW_ORDERS', 'MANAGE_ORDERS', 'VIEW_ITEMS', 'MANAGE_ITEMS'],
  },
  MENU_EDITOR: {
    label: 'Menu editor',
    description: 'Create and update menu items.',
    permissions: ['VIEW_ITEMS', 'MANAGE_ITEMS'],
  },
  ORDER_HANDLER: {
    label: 'Order handler',
    description: 'View and update orders.',
    permissions: ['VIEW_ORDERS', 'MANAGE_ORDERS'],
  },
  FINANCE: {
    label: 'Finance',
    description: 'View orders and payout-related finance data.',
    permissions: ['VIEW_ORDERS', 'VIEW_FINANCE'],
  },
}

function summarizeTeamRole(permissions: unknown): string {
  const list = Array.isArray(permissions) ? permissions : []
  if (list.includes('FULL_ACCESS')) return 'Manager'
  if (list.includes('VIEW_FINANCE')) return 'Finance'
  if ((list.includes('MANAGE_ITEMS') || list.includes('VIEW_ITEMS')) && !list.includes('MANAGE_ORDERS')) return 'Menu editor'
  if (list.includes('MANAGE_ORDERS') || list.includes('VIEW_ORDERS')) return 'Order handler'
  return 'Staff'
}

interface TeamMemberRow {
  readonly id: string
  readonly permissionsJson?: unknown
  readonly user?: { readonly name?: string | null; readonly email?: string | null }
}

interface InvitationRow {
  readonly id: string
  readonly recipientEmail: string
  readonly expiresAt: string
  readonly permissionsJson?: unknown
}

export default function VendorTeamPage() {
  const queryClient = useQueryClient()
  const teamRequest = useVendorTeamRequest()
  const { data: stores = [], isLoading: storesLoading } = useVendorStores()
  const { selectedStoreId, selectedStore } = useVendorActiveStore()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [rolePreset, setRolePreset] = useState<TeamRolePreset>('STAFF')

  const inviteMessage = useMemo(() => {
    const storeName = selectedStore && 'name' in selectedStore ? String(selectedStore.name) : 'the store'
    const contact =
      [displayName.trim() && `Name: ${displayName.trim()}`, phone.trim() && `Phone: ${phone.trim()}`]
        .filter(Boolean)
        .join(' · ') || undefined
    const base = `You have been invited as ${TEAM_ROLE_PRESETS[rolePreset].label.toLowerCase()} for ${storeName}.`
    return contact ? `${base} (${contact})` : base
  }, [displayName, phone, rolePreset, selectedStore])

  const membersQuery = useQuery({
    queryKey: ['team-members', selectedStoreId],
    queryFn: async () => {
      const json = await teamRequest<{ members?: TeamMemberRow[] }>(`/team/stores/${selectedStoreId}/members`)
      return json.members ?? []
    },
    enabled: Boolean(selectedStoreId),
  })

  const invitationsQuery = useQuery({
    queryKey: ['team-invitations', selectedStoreId],
    queryFn: async () => {
      const json = await teamRequest<{ invitations?: InvitationRow[] }>(
        `/team/stores/${selectedStoreId}/invitations`
      )
      return json.invitations ?? []
    },
    enabled: Boolean(selectedStoreId),
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const preset = TEAM_ROLE_PRESETS[rolePreset]
      return teamRequest('/team/invitations', {
        method: 'POST',
        body: JSON.stringify({
          storeId: selectedStoreId,
          recipientEmail: email.trim(),
          permissions: [...preset.permissions],
          message: inviteMessage,
        }),
      })
    },
    onSuccess: () => {
      setEmail('')
      setDisplayName('')
      setPhone('')
      void queryClient.invalidateQueries({ queryKey: ['team-invitations', selectedStoreId] })
      toast.success('Invitation created')
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Could not create invitation'),
  })

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) =>
      teamRequest(`/team/invitations/${invitationId}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['team-invitations', selectedStoreId] }),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Could not revoke invitation'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => teamRequest(`/team/members/${memberId}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['team-members', selectedStoreId] }),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Could not remove member'),
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

  if (stores.length === 0) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="py-6">
        <EmptyState icon={Users} title="Create a store first" description="Team access is managed per store." />
      </PageShell>
    )
  }

  const members = membersQuery.data ?? []
  const invitations = invitationsQuery.data ?? []
  const selectedPreset = TEAM_ROLE_PRESETS[rolePreset]

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-7xl" contentClassName="space-y-5 py-6">
      <PageHeader
        title="Team"
        description="Invite people who can access and operate this store. Use Drivers for delivery assignments. Switch the active store from the header."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Invite team member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="team-role">
                Role
              </label>
              <select
                id="team-role"
                value={rolePreset}
                onChange={(event) => setRolePreset(event.target.value as TeamRolePreset)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                {(Object.keys(TEAM_ROLE_PRESETS) as TeamRolePreset[]).map((key) => (
                  <option key={key} value={key}>
                    {TEAM_ROLE_PRESETS[key].label}
                  </option>
                ))}
              </select>
            </div>
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
            Send invite
          </Button>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4" />
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
              Active members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {membersQuery.isLoading ? (
              <Spinner />
            ) : (members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{member.user?.name || member.user?.email}</div>
                    <div className="truncate text-sm text-muted-foreground">{member.user?.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{summarizeTeamRole(member.permissionsJson)}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeMemberMutation.mutate(member.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Pending invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitationsQuery.isLoading ? (
              <Spinner />
            ) : (invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              invitations.map((invitation) => (
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
                    <Badge variant="outline">{summarizeTeamRole(invitation.permissionsJson)}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => revokeInvitationMutation.mutate(invitation.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ))}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
