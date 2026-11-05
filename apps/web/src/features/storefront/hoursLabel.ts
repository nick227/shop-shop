/**
 * "Open now" / "Closed now" from a store's posted hours, in the store's own timezone.
 *
 * This is information for shoppers, not ordering eligibility: checkout does not enforce hours, and a
 * store that posted no hours makes no open/closed claim at all.
 */
import type { StorefrontDayHours } from './api'

const DAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
const DAY_NAMES: Record<(typeof DAY_KEYS)[number], string> = {
  SUN: 'Sunday',
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
}

export function formatClock(time: string): string {
  const [h = '0', m = '00'] = time.split(':')
  const hour = Number(h)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return m === '00' ? `${display} ${suffix}` : `${display}:${m} ${suffix}`
}

const toMinutes = (time: string) => {
  const [h = '0', m = '0'] = time.split(':')
  return Number(h) * 60 + Number(m)
}

const isOpenDay = (day: StorefrontDayHours | undefined): day is StorefrontDayHours =>
  !!day && !day.closed && /^\d{1,2}:\d{2}$/.test(day.open) && /^\d{1,2}:\d{2}$/.test(day.close)

/** The weekday index (0 = Sunday) and minutes past midnight at `now` in `timezone`. */
export function storeClock(now: Date, timezone: string | null): { readonly day: number; readonly minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? undefined,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
    return { day: Math.max(0, day), minutes: Number(get('hour')) * 60 + Number(get('minute')) }
  } catch {
    // An unknown timezone falls back to the shopper's clock.
    return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() }
  }
}

export interface HoursStatus {
  readonly isOpen: boolean
  readonly label: string
}

/** The closing time when open at `minutes`, counting last night's hours that run past midnight. */
function openUntil(today: StorefrontDayHours | undefined, yesterday: StorefrontDayHours | undefined, minutes: number): string | null {
  if (isOpenDay(today)) {
    const open = toMinutes(today.open)
    const close = toMinutes(today.close)
    if (minutes >= open && (close <= open || minutes < close)) return today.close
  }
  if (isOpenDay(yesterday)) {
    const open = toMinutes(yesterday.open)
    const close = toMinutes(yesterday.close)
    if (close <= open && minutes < close) return yesterday.close
  }
  return null
}

/** Null when there are no usable posted hours: the storefront then says nothing about being open. */
export function hoursStatus(
  week: Partial<Record<string, StorefrontDayHours>> | null | undefined,
  timezone: string | null,
  now = new Date(),
): HoursStatus | null {
  if (!week || !DAY_KEYS.some((key) => isOpenDay(week[key]))) return null
  const { day, minutes } = storeClock(now, timezone)
  const today = week[DAY_KEYS[day]]
  const yesterday = week[DAY_KEYS[(day + 6) % 7]]

  const closesAt = openUntil(today, yesterday, minutes)
  if (closesAt) return { isOpen: true, label: `Open now · until ${formatClock(closesAt)}` }

  if (isOpenDay(today) && minutes < toMinutes(today.open)) {
    return { isOpen: false, label: `Closed now · opens ${formatClock(today.open)}` }
  }
  for (let ahead = 1; ahead <= 7; ahead += 1) {
    const key = DAY_KEYS[(day + ahead) % 7]
    const next = week[key]
    if (isOpenDay(next)) {
      const when = ahead === 1 ? 'tomorrow' : DAY_NAMES[key]
      return { isOpen: false, label: `Closed now · opens ${when} ${formatClock(next.open)}` }
    }
  }
  return { isOpen: false, label: 'Closed now' }
}
