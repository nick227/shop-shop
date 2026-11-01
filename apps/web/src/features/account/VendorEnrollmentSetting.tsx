import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@shared/ui/primitives'
import { authPost } from '@shared/lib/auth/authFetch'
import { useAuthStore } from '@stores/authStore'
import type { AccountCapabilities } from '@packages/schemas'
import { accountCapabilitiesKey, useAccountCapabilities } from './useAccountCapabilities'

function enrollmentMessage(capabilities: AccountCapabilities) {
  if (capabilities.vendorAccessRevoked) return 'Vendor access is suspended. Contact support for help.'
  if (capabilities.vendorEnrollment === 'APPROVED') return 'Your vendor account is active. Open Vendor Portal from your account menu.'
  if (capabilities.vendorEnrollment === 'PENDING') return 'Your vendor application is awaiting review.'
  return 'Your vendor application is not approved. Contact support for help.'
}

export function VendorEnrollmentSetting() {
  const { capabilities } = useAccountCapabilities()
  const userId = useAuthStore((s) => s.user?.id)
  const client = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!capabilities) return null
  const status = capabilities.vendorEnrollment
  const enroll = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await authPost<AccountCapabilities>('/api/account/vendor-enrollment')
      if (!response.ok) throw new Error('Could not activate your vendor account. Please try again.')
      client.setQueryData(accountCapabilitiesKey(userId), await response.json())
    } catch (error_) { setError(error_ instanceof Error ? error_.message : 'Could not activate vendor access.') }
    finally { setBusy(false) }
  }
  return (
    <div className="mt-4 border-t border-border pt-4 text-sm">
      {status === 'NONE' && !capabilities.vendorAccessRevoked ? <>
        <button type="button" className="text-muted-foreground hover:text-foreground" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>Become a vendor</button>
        {expanded ? <div className="mt-3 space-y-3">
          <p>Enable a vendor workspace to create your own store. You can keep shopping as usual.</p>
          <Button disabled={busy} onClick={() => void enroll()}>{busy ? 'Activating…' : 'Enable vendor account'}</Button>
        </div> : null}
      </> : <p className="text-muted-foreground">{enrollmentMessage(capabilities)}</p>}
      {error ? <p role="alert" className="mt-2 text-destructive">{error}</p> : null}
    </div>
  )
}
