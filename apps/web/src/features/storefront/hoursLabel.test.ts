import { describe, expect, it } from 'vitest'
import { hoursStatus } from './hoursLabel'

const weekdays = {
  MON: { open: '11:00', close: '21:00' },
  TUE: { open: '11:00', close: '21:00' },
  WED: { open: '11:00', close: '21:00' },
  THU: { open: '11:00', close: '21:00' },
  FRI: { open: '18:00', close: '02:00' },
  SAT: { open: '10:00', close: '14:00', closed: true },
  SUN: { open: '10:00', close: '14:00', closed: true },
}
const tz = 'America/Chicago'
// 2026-11-04 is a Wednesday. Chicago is UTC-6 in November.
const at = (iso: string) => new Date(iso)

describe('hoursStatus', () => {
  it('makes no claim for a store without posted hours', () => {
    expect(hoursStatus(null, tz)).toBeNull()
    expect(hoursStatus({}, tz)).toBeNull()
    expect(hoursStatus({ MON: { open: '9:00', close: '17:00', closed: true } }, tz)).toBeNull()
  })

  it('is open between opening and closing, in the store’s timezone', () => {
    expect(hoursStatus(weekdays, tz, at('2026-11-04T18:00:00Z'))).toEqual({ isOpen: true, label: 'Open now · until 9 PM' })
  })

  it('says when it opens later today', () => {
    expect(hoursStatus(weekdays, tz, at('2026-11-04T14:00:00Z'))).toEqual({ isOpen: false, label: 'Closed now · opens 11 AM' })
  })

  it('says when it opens next, after closing', () => {
    expect(hoursStatus(weekdays, tz, at('2026-11-05T04:00:00Z'))).toEqual({ isOpen: false, label: 'Closed now · opens tomorrow 11 AM' })
  })

  it('stays open past midnight on overnight hours, then skips closed days', () => {
    // Saturday 1am Chicago: still Friday night.
    expect(hoursStatus(weekdays, tz, at('2026-11-07T07:00:00Z'))?.label).toBe('Open now · until 2 AM')
    // Saturday 3pm Chicago: closed all weekend.
    expect(hoursStatus(weekdays, tz, at('2026-11-07T21:00:00Z'))?.label).toBe('Closed now · opens Monday 11 AM')
  })
})
