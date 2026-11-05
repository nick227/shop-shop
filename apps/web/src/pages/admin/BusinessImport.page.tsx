import { useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import { Button } from '@shared/ui/primitives'
import { CoverageReportView, type CoverageReport } from './CoverageReport'
import { ManualListingForm } from './ManualListingForm'

type Candidate = {
  readonly sourceId: string
  readonly name: string
  readonly street: string | null
  readonly city: string | null
  readonly zip: string | null
  readonly categoryLabel: string
  readonly evidence: readonly string[]
}

type Entry = {
  readonly id: string
  readonly submittedName: string
  readonly status: string
  readonly selectedSourceId: string | null
  readonly candidates: readonly Candidate[]
}

type Batch = { readonly id: string; readonly entries: readonly Entry[] }

function apiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function lines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
}

export default function AdminBusinessImportPage() {
  const token = useAuthStore((state) => state.token)
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [names, setNames] = useState('')
  const [batch, setBatch] = useState<Batch | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<CoverageReport | null>(null)

  const load = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${apiBase()}${path}`, { ...init, headers })
    const body = await response.json().catch(() => ({})) as { error?: string }
    if (!response.ok) throw new Error(body.error || 'Request failed')
    return body
  }

  const search = async () => {
    setBusy(true)
    setError(undefined)
    try {
      setBatch(await load('/api/admin/business-imports', { method: 'POST', body: JSON.stringify({ names: lines(names) }) }) as Batch)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Lookup failed')
    } finally {
      setBusy(false)
    }
  }

  const publishReady = async () => {
    if (!batch) return
    const entryIds = batch.entries.filter((entry) => entry.status === 'READY' || (entry.status === 'REVIEW' && entry.selectedSourceId)).map((entry) => entry.id)
    if (entryIds.length === 0) return
    setBusy(true)
    try {
      await load(`/api/admin/business-imports/${batch.id}/publish`, { method: 'POST', body: JSON.stringify({ entryIds }) })
      setBatch(await load(`/api/admin/business-imports/${batch.id}`) as Batch)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Publish failed')
    } finally {
      setBusy(false)
    }
  }

  const choose = async (entryId: string, selectedSourceId: string) => {
    if (!batch) return
    await load(`/api/admin/business-imports/${batch.id}/entries/${entryId}`, { method: 'PATCH', body: JSON.stringify({ selectedSourceId }) })
    setBatch(await load(`/api/admin/business-imports/${batch.id}`) as Batch)
  }

  const saveManual = async (entryId: string, value: { street: string; city: string; state: string; zip: string; category: string; description: string }) => {
    if (!batch) return
    setBusy(true)
    setError(undefined)
    try {
      await load(`/api/admin/business-imports/${batch.id}/entries/${entryId}/manual`, { method: 'POST', body: JSON.stringify(value) })
      setBatch(await load(`/api/admin/business-imports/${batch.id}`) as Batch)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const seedCoverage = async () => {
    setBusy(true)
    setError(undefined)
    try {
      setReport(await load('/api/admin/business-imports/coverage', { method: 'POST' }) as CoverageReport)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Coverage seed failed')
    } finally {
      setBusy(false)
    }
  }

  const groups = ['READY', 'REVIEW', 'EXISTING', 'NOT_FOUND', 'IMPORTED']
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Directory import</h1>
        <Button size="small" variant="outline" disabled={busy} onClick={seedCoverage}>{busy ? 'Working…' : 'Seed Austin coverage'}</Button>
      </div>
      <p className="text-sm text-muted-foreground">Paste names for one lookup, or seed Austin ZIP codes, neighborhood drafts, and directory places. Seeded places stay non-orderable. A full seed can take a few minutes.</p>
      <textarea className="min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder={'Franklin Barbecue\nBarton Springs Pool'} value={names} onChange={(event) => setNames(event.target.value)} />
      <Button size="small" disabled={busy || lines(names).length === 0} onClick={search}>{busy ? 'Working…' : 'Find businesses'}</Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {report ? <CoverageReportView report={report} /> : null}
      {batch ? (
        <div className="space-y-4">
          <Button size="small" disabled={busy} onClick={publishReady}>Publish ready matches</Button>
          {groups.map((status) => {
            const entries = batch.entries.filter((entry) => entry.status === status)
            if (entries.length === 0) return null
            return (
              <section key={status} className="space-y-2">
                <h2 className="text-sm font-semibold">{status} · {entries.length}</h2>
                {entries.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">{entry.submittedName}</p>
                    {entry.candidates.map((candidate) => (
                      <label key={candidate.sourceId} className="mt-2 flex items-start gap-2">
                        <input type="radio" name={entry.id} checked={entry.selectedSourceId === candidate.sourceId} onChange={() => choose(entry.id, candidate.sourceId)} />
                        <span>{candidate.name} · {candidate.categoryLabel} · {[candidate.street, candidate.city, candidate.zip].filter(Boolean).join(', ') || 'No address'} · {candidate.evidence.join(', ')}</span>
                      </label>
                    ))}
                    {entry.status === 'NOT_FOUND' ? <ManualListingForm onSave={(value) => saveManual(entry.id, value)} /> : null}
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
