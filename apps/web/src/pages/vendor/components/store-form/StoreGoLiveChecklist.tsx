import { useQuery } from '@tanstack/react-query'
import { useVendorTeamRequest } from '@shared/hooks/hooks/vendor/useVendorTeamRequest'

interface Readiness {
  canPublish: boolean
  missingRequirements?: string[] | null
  checks?: { required: boolean; passed: boolean; label: string; message?: string }[]
}

export function StoreGoLiveChecklist({ storeId, enabled }: { storeId?: string; enabled: boolean }) {
  const request = useVendorTeamRequest()
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['store-readiness', storeId, enabled],
    queryFn: () => request<Readiness>(`/stores/${storeId}/readiness`),
    enabled: Boolean(storeId),
    staleTime: 0,
  })

  const missingRequirements = data?.missingRequirements?.length
    ? data.missingRequirements
    : data?.checks?.filter((check) => check.required && !check.passed)
        .map((check) => check.message === 'Run address geocoding before publishing.' ? 'Coordinates (Location)' : check.message || check.label) ?? []

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground" role="status" aria-live="polite">
      <p className="font-medium text-foreground">Go-live checklist</p>
      {!storeId ? <p>Save store to check requirements.</p> : isPending ? <p>Checking…</p> : isError ? (
        <p>Check failed. <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => void refetch()}>Try again</button></p>
      ) : data?.canPublish ? (
        <p>{enabled ? 'Ready to publish' : 'Ready — enable and save'}</p>
      ) : (
        <>
          <p className="text-foreground">Required to publish</p>
          {missingRequirements.length ? (
            <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
              {missingRequirements.map((requirement, index) => (
                <li key={`${index}-${requirement}`} className="pl-1 first-letter:uppercase">{requirement}</li>
              ))}
            </ul>
          ) : (
            <p>Requirements unavailable. <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => void refetch()}>Check again</button></p>
          )}
        </>
      )}
    </div>
  )
}
