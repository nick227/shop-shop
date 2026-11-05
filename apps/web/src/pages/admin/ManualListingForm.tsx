import { useState } from 'react'
import { Button } from '@shared/ui/primitives'

export function ManualListingForm({ onSave }: { readonly onSave: (value: { street: string; city: string; state: string; zip: string; category: string; description: string }) => Promise<void> }) {
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('Austin')
  const [state, setState] = useState('TX')
  const [zip, setZip] = useState('')
  const [category, setCategory] = useState('RESTAURANT')
  const [description, setDescription] = useState('')
  return (
    <form className="mt-2 grid gap-2 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void onSave({ street, city, state, zip, category, description }) }}>
      <input className="rounded-md border border-border bg-background px-2 py-1" placeholder="Street" value={street} onChange={(event) => setStreet(event.target.value)} required />
      <input className="rounded-md border border-border bg-background px-2 py-1" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} required />
      <input className="rounded-md border border-border bg-background px-2 py-1" placeholder="ST" value={state} onChange={(event) => setState(event.target.value)} maxLength={2} required />
      <input className="rounded-md border border-border bg-background px-2 py-1" placeholder="ZIP" value={zip} onChange={(event) => setZip(event.target.value)} pattern="\d{5}" required />
      <select className="rounded-md border border-border bg-background px-2 py-1" value={category} onChange={(event) => setCategory(event.target.value)}>
        {['RESTAURANT', 'COFFEE', 'BAKERY', 'GROCERY', 'CONVENIENCE', 'RETAIL', 'ATTRACTION', 'OTHER'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <input className="rounded-md border border-border bg-background px-2 py-1" placeholder="Description you wrote" value={description} onChange={(event) => setDescription(event.target.value)} />
      <Button type="submit" size="small">Save entered address</Button>
      <p className="text-xs text-muted-foreground md:col-span-2">No coordinates are guessed, so this record will not appear on the map.</p>
    </form>
  )
}
