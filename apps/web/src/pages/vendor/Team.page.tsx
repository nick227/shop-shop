/**
 * Team — everyone who can work in this store. Staff and Drivers are tabs over the same
 * team membership and invitations; Driver is one more role preset with delivery permissions.
 */
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShieldCheck, X } from 'lucide-react'
import { Button, ConfirmDialog, Input, Tabs } from '@shared/ui/primitives'
import { useVendorTeamRequest } from '@shared/hooks/hooks/vendor'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { VendorPage } from '@layouts/VendorLayout/page'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'

type RolePreset = 'MANAGER' | 'STAFF' | 'MENU_EDITOR' | 'ORDER_HANDLER' | 'FINANCE' | 'DRIVER'
type TeamTab = 'staff' | 'drivers'

const ROLE_PRESETS: Record<RolePreset, { readonly label: string; readonly description: string; readonly permissions: readonly string[] }> = {
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
  MENU_EDITOR: { label: 'Menu editor', description: 'Create and update menu items.', permissions: ['VIEW_ITEMS', 'MANAGE_ITEMS'] },
  ORDER_HANDLER: { label: 'Order handler', description: 'View and update orders.', permissions: ['VIEW_ORDERS', 'MANAGE_ORDERS'] },
  FINANCE: { label: 'Finance', description: 'View orders and payout-related finance data.', permissions: ['VIEW_ORDERS', 'VIEW_FINANCE'] },
  DRIVER: {
    label: 'Driver',
    description: 'View and update deliveries assigned from this store. No access to the menu, orders list, or settings.',
    permissions: ['VIEW_DELIVERIES', 'MANAGE_DELIVERIES'],
  },
}

const DELIVERY_PERMISSIONS = new Set(['VIEW_DELIVERIES', 'MANAGE_DELIVERIES', 'ASSIGN_DELIVERIES'])

interface Person {
  readonly name?: string | null
  readonly email?: string | null
  readonly phone?: string | null
}

interface MemberRow {
  readonly id: string
  readonly permissionsJson?: unknown
  readonly user?: Person
}

interface InvitationRow {
  readonly id: string
  readonly recipientEmail: string
  readonly expiresAt: string
  readonly token: string
  readonly permissionsJson?: unknown
}

function permissionsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : []
}

/** Only delivery permissions: listed under Drivers rather than Staff. */
function isDriverOnly(value: unknown): boolean {
  const permissions = permissionsOf(value)
  return permissions.length > 0 && permissions.every((p) => DELIVERY_PERMISSIONS.has(p))
}

function roleLabel(value: unknown): string {
  const list = permissionsOf(value)
  if (list.includes('FULL_ACCESS')) return 'Manager'
  if (isDriverOnly(list)) return 'Driver'
  if (list.includes('VIEW_FINANCE')) return 'Finance'
  if ((list.includes('MANAGE_ITEMS') || list.includes('VIEW_ITEMS')) && !list.includes('MANAGE_ORDERS')) return 'Menu editor'
  if (list.includes('MANAGE_ITEMS') && list.includes('MANAGE_ORDERS')) return 'Staff'
  if (list.includes('MANAGE_ORDERS') || list.includes('VIEW_ORDERS')) return 'Order handler'
  return 'Staff'
}

function PersonRow({
  person,
  fallback,
  meta,
  role,
  actions,
}: {
  readonly person?: Person
  readonly fallback: string
  readonly meta?: string
  readonly role: string
  readonly actions: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{person?.name || person?.email || fallback}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[person?.name ? person.email : null, person?.phone, meta].filter(Boolean).join(' · ')}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{role}</span>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </li>
  )
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function PeopleSection({
  tab,
  people,
  loading,
  onRemove,
}: {
  readonly tab: TeamTab
  readonly people: readonly MemberRow[]
  readonly loading: boolean
  readonly onRemove: (member: MemberRow) => void
}) {
  const drivers = tab === 'drivers'
  return (
    <Section title={drivers ? 'Drivers' : 'Members'}>
      {loading ? <p className="py-3 text-sm text-muted-foreground">Loading…</p> : null}
      {!loading && people.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          {drivers ? 'No drivers yet. Invite one above.' : 'No team members yet. Invite someone above.'}
        </p>
      ) : null}
      <ul>
        {people.map((member) => (
          <PersonRow
            key={member.id}
            person={member.user}
            fallback="Team member"
            role={drivers ? 'Driver' : roleLabel(member.permissionsJson)}
            actions={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${member.user?.name || member.user?.email || 'member'}`}
                onClick={() => onRemove(member)}
              >
                <X className="h-4 w-4" />
              </Button>
            }
          />
        ))}
      </ul>
    </Section>
  )
}

function InviteSection({
  tab,
  storeId,
  storeName,
  onInvited,
}: {
  readonly tab: TeamTab
  readonly storeId: string
  readonly storeName: string
  readonly onInvited: () => void
}) {
  const teamRequest = useVendorTeamRequest()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [rolePreset, setRolePreset] = useState<RolePreset>(tab === 'drivers' ? 'DRIVER' : 'STAFF')
  const preset = ROLE_PRESETS[rolePreset]

  const inviteMessage = useMemo(() => {
    const contact = [displayName.trim() && `Name: ${displayName.trim()}`, phone.trim() && `Phone: ${phone.trim()}`]
      .filter(Boolean)
      .join(' · ')
    const base =
      rolePreset === 'DRIVER'
        ? `You have been invited as a delivery driver for ${storeName}.`
        : `You have been invited as ${preset.label.toLowerCase()} for ${storeName}.`
    return contact ? `${base} (${contact})` : base
  }, [displayName, phone, rolePreset, preset.label, storeName])

  const inviteMutation = useMutation({
    mutationFn: async () =>
      teamRequest('/team/invitations', {
        method: 'POST',
        body: JSON.stringify({ storeId, recipientEmail: email.trim(), permissions: [...preset.permissions], message: inviteMessage }),
      }),
    onSuccess: () => {
      toast.success(`Invitation sent to ${email.trim()}`)
      setEmail('')
      setDisplayName('')
      setPhone('')
      onInvited()
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not send the invitation'),
  })

  return (
    <Section title={tab === 'drivers' ? 'Invite a driver' : 'Invite someone'}>
      <form
        className="space-y-4 pt-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (email.trim()) inviteMutation.mutate()
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="team-role">
              Role
            </label>
            <select
              id="team-role"
              value={rolePreset}
              onChange={(event) => setRolePreset(event.target.value as RolePreset)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {(Object.keys(ROLE_PRESETS) as RolePreset[]).map((key) => (
                <option key={key} value={key}>
                  {ROLE_PRESETS[key].label}
                </option>
              ))}
            </select>
          </div>
          <Input label="Name (optional)" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <Input label="Phone (optional)" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium text-foreground">{preset.label}:</span> {preset.description}
          </span>
        </p>
        <Button type="submit" variant="primary" disabled={!email.trim() || inviteMutation.isPending} isLoading={inviteMutation.isPending}>
          Send invitation
        </Button>
      </form>
    </Section>
  )
}

export default function VendorTeamPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const teamRequest = useVendorTeamRequest()
  const { selectedStoreId, selectedStore } = useVendorActiveStore()
  const tab: TeamTab = pathname.endsWith('/team/drivers') ? 'drivers' : 'staff'

  const [pendingRemoval, setPendingRemoval] = useState<{ readonly member: MemberRow; readonly driverOnly: boolean } | null>(null)

  const membersQuery = useQuery({
    queryKey: ['team-members', selectedStoreId],
    queryFn: async () => (await teamRequest<{ members?: MemberRow[] }>(`/team/stores/${selectedStoreId}/members`)).members ?? [],
    enabled: Boolean(selectedStoreId),
  })

  const driversQuery = useQuery({
    queryKey: ['store-drivers', selectedStoreId],
    queryFn: async () => (await teamRequest<{ drivers?: MemberRow[] }>(`/team/stores/${selectedStoreId}/drivers`)).drivers ?? [],
    enabled: Boolean(selectedStoreId) && tab === 'drivers',
  })

  const invitationsQuery = useQuery({
    queryKey: ['team-invitations', selectedStoreId],
    queryFn: async () =>
      (await teamRequest<{ invitations?: InvitationRow[] }>(`/team/stores/${selectedStoreId}/invitations`)).invitations ?? [],
    enabled: Boolean(selectedStoreId),
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['team-members', selectedStoreId] })
    void queryClient.invalidateQueries({ queryKey: ['store-drivers', selectedStoreId] })
    void queryClient.invalidateQueries({ queryKey: ['team-invitations', selectedStoreId] })
  }

  const revokeMutation = useMutation({
    mutationFn: async (invitationId: string) => teamRequest(`/team/invitations/${invitationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      refresh()
      toast.success('Invitation revoked')
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not revoke the invitation'),
  })

  const removeMutation = useMutation({
    mutationFn: async ({ member, driverOnly }: { readonly member: MemberRow; readonly driverOnly: boolean }) => {
      if (!driverOnly) return teamRequest(`/team/members/${member.id}`, { method: 'DELETE' })
      // On the Drivers tab, remove only delivery access; other roles the person holds stay.
      const permissions = permissionsOf(member.permissionsJson)
      if (permissions.includes('FULL_ACCESS')) {
        throw new Error('This person is a manager. Change their role on the Staff tab instead.')
      }
      const remaining = permissions.filter((p) => !DELIVERY_PERMISSIONS.has(p))
      if (remaining.length === 0) return teamRequest(`/team/members/${member.id}`, { method: 'DELETE' })
      return teamRequest(`/team/members/${member.id}`, { method: 'PATCH', body: JSON.stringify({ permissions: remaining }) })
    },
    onSuccess: (_result, { driverOnly }) => {
      refresh()
      toast.success(driverOnly ? 'Driver access removed' : 'Removed from the team')
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not update the team'),
  })

  const members = membersQuery.data ?? []
  const invitations = invitationsQuery.data ?? []
  const staff = members.filter((member) => !isDriverOnly(member.permissionsJson))
  const drivers = driversQuery.data ?? []
  const tabInvitations = invitations.filter((inv) => isDriverOnly(inv.permissionsJson) === (tab === 'drivers'))
  const people = tab === 'drivers' ? drivers : staff
  const peopleLoading = tab === 'drivers' ? driversQuery.isLoading : membersQuery.isLoading
  const loadError = (tab === 'drivers' ? driversQuery.error : membersQuery.error) ?? invitationsQuery.error

  const copyInviteLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invitations/store/${encodeURIComponent(token)}`)
      toast.success('Invitation link copied')
    } catch {
      toast.error('Could not copy the link. Your browser blocked clipboard access.')
    }
  }

  return (
    <VendorPage
      title="Team"
      description="People who can work in this store, and what each of them can do."
      error={loadError ? { message: 'The team could not be loaded', onRetry: refresh } : undefined}
      tabs={
        <Tabs
          label="Team sections"
          items={[
            { id: 'staff', label: 'Staff', count: membersQuery.data ? staff.length : undefined },
            { id: 'drivers', label: 'Drivers', count: driversQuery.data ? drivers.length : undefined },
          ]}
          value={tab}
          onChange={(next) => {
            navigate(next === 'drivers' ? vendorPaths.drivers(selectedStoreId) : vendorPaths.team(selectedStoreId))
          }}
        />
      }
    >
      <div className="space-y-4">
        <InviteSection
          // A fresh form per tab, so its role starts at that tab's default.
          key={tab}
          tab={tab}
          storeId={selectedStoreId}
          storeName={selectedStore?.name ?? 'the store'}
          onInvited={refresh}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PeopleSection
            tab={tab}
            people={people}
            loading={peopleLoading}
            onRemove={(member) => setPendingRemoval({ member, driverOnly: tab === 'drivers' })}
          />

          <Section title="Pending invitations">
            {invitationsQuery.isLoading ? <p className="py-3 text-sm text-muted-foreground">Loading…</p> : null}
            {!invitationsQuery.isLoading && tabInvitations.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No pending invitations.</p>
            ) : null}
            <ul>
              {tabInvitations.map((invitation) => (
                <PersonRow
                  key={invitation.id}
                  person={{ email: invitation.recipientEmail }}
                  fallback={invitation.recipientEmail}
                  meta={`Expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
                  role={roleLabel(invitation.permissionsJson)}
                  actions={
                    <>
                      <Button variant="ghost" size="small" onClick={() => void copyInviteLink(invitation.token)}>
                        Copy link
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Revoke invitation for ${invitation.recipientEmail}`}
                        onClick={() => revokeMutation.mutate(invitation.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null)
        }}
        title={pendingRemoval?.driverOnly ? 'Remove driver access?' : 'Remove from the team?'}
        description={
          pendingRemoval?.driverOnly
            ? `${pendingRemoval.member.user?.name || pendingRemoval.member.user?.email || 'This person'} will no longer get deliveries from this store. Any other role they have stays.`
            : `${pendingRemoval?.member.user?.name || pendingRemoval?.member.user?.email || 'This person'} will lose access to this store.`
        }
        confirmLabel="Remove"
        variant="danger"
        isLoading={removeMutation.isPending}
        onConfirm={async () => {
          if (!pendingRemoval) return
          try {
            await removeMutation.mutateAsync(pendingRemoval)
          } catch {
            // The mutation's onError already explained what went wrong.
          }
        }}
      />
    </VendorPage>
  )
}
