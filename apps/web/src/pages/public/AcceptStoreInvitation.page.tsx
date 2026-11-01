import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { authPost, publicGet } from '@shared/lib/auth/authFetch'
import { Button } from '@shared/ui/primitives'
import { PageShell } from '@shared/ui/layout/PageShell'
import { accountCapabilitiesKey } from '@features/account/useAccountCapabilities'

export default function AcceptStoreInvitationPage() {
  const { token = '' } = useParams<{ token: string }>()
  const user = useAuthStore((s) => s.user)
  const authenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const client = useQueryClient()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const invitation = useQuery({
    queryKey: ['store-invitation', token], retry: false,
    queryFn: async () => {
      const response = await publicGet<{ invitation: { store: { name: string }; recipientEmail: string } }>(`/api/team/invitations/token/${encodeURIComponent(token)}`)
      if (!response.ok) throw new Error('This invitation has expired or is no longer available.')
      return (await response.json()).invitation
    },
  })
  const accept = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await authPost<{ teamMember: { storeId: string }; error?: string }>('/api/team/invitations/accept', { token })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not accept invitation')
      await client.invalidateQueries({ queryKey: accountCapabilitiesKey(user?.id) })
      await client.invalidateQueries({ queryKey: ['vendor-managed-stores', user?.id] })
      navigate(`/vendor/${body.teamMember.storeId}`, { replace: true })
    } catch (error_) { setError(error_ instanceof Error ? error_.message : 'Could not accept invitation') }
    finally { setBusy(false) }
  }
  const from = `/invitations/store/${encodeURIComponent(token)}`
  const matches = user?.email?.trim().toLowerCase() === invitation.data?.recipientEmail.trim().toLowerCase()
  let content
  if (invitation.isPending) content = <p>Loading invitation…</p>
  else if (invitation.error) content = <p role="alert">{invitation.error.message}</p>
  else content = <>
    <p>You’ve been invited to work at {invitation.data?.store.name}.</p>
    <InvitationAction authenticated={authenticated} matches={matches} from={from} busy={busy} accept={accept} />
  </>
  return <PageShell containerClassName="max-w-xl" contentClassName="space-y-4 py-12">
    <h1 className="text-2xl font-semibold">Store team invitation</h1>
    {content}
    {error ? <p role="alert" className="text-destructive">{error}</p> : null}
  </PageShell>
}

function InvitationAction({ authenticated, matches, from, busy, accept }: {
  readonly authenticated: boolean
  readonly matches: boolean
  readonly from: string
  readonly busy: boolean
  readonly accept: () => Promise<void>
}) {
  if (!authenticated) return <>
    <p>Sign in or create an account using the email address that received this invitation.</p>
    <div className="flex gap-4"><Link to="/login" state={{ from }}>Sign in</Link><Link to="/signup" state={{ from }}>Create account</Link></div>
  </>
  if (!matches) return <p role="alert">This invitation belongs to a different email address. Sign in with the account that received it.</p>
  return <>
    <p>Accepting gives you the store permissions assigned by your manager. Your shopping account stays the same.</p>
    <Button disabled={busy} onClick={() => void accept()}>{busy ? 'Accepting…' : 'Accept invitation'}</Button>
  </>
}
