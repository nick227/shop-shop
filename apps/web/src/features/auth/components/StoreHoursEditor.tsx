import { useState } from 'react'
import { Clock, Globe, Package } from 'lucide-react'
import { Input, Checkbox } from '@shared/ui/primitives'
// Temporary types until we update the main types file
interface DayHours {
  open: string
  close: string
  closed?: boolean
}

interface HoursJson {
  timezone?: string
  storeHours?: Record<string, DayHours>
  deliveryHours?: Record<string, DayHours>
  specialHours?: Record<string, { closed: boolean; reason?: string }>
}

interface StoreHoursEditorProps {
  value?: HoursJson
  onChange: (hours: HoursJson) => void
  className?: string
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
const DAY_LABELS = {
  MON: 'Monday',
  TUE: 'Tuesday', 
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday'
}

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
]

function formatTimeForInput(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  return `${displayHour}:${minutes} ${ampm}`
}

function parseTimeFromInput(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return '09:00'
  
  let [, hours, minutes, period] = match
  let hour = parseInt(hours)
  
  if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12
  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`
}

export function StoreHoursEditor({ value, onChange, className = '' }: StoreHoursEditorProps) {
  const [useSameHours, setUseSameHours] = useState(
    !value?.deliveryHours || JSON.stringify(value?.storeHours) === JSON.stringify(value?.deliveryHours)
  )

  const updateHours = (field: keyof HoursJson, update: any) => {
    const current = value || {}
    onChange({
      ...current,
      [field]: update
    })
  }

  const updateDayHours = (day: string, type: 'storeHours' | 'deliveryHours', hours: DayHours) => {
    const current = value || {}
    const currentSection = current[type] || {}
    updateHours(type, {
      ...currentSection,
      [day]: {
        open: hours.open || '09:00',
        close: hours.close || '17:00',
        closed: hours.closed
      }
    })
  }

  const toggleDay = (day: string, type: 'storeHours' | 'deliveryHours') => {
    const current = value || {}
    const currentSection = current[type] || {}
    const currentDay = currentSection[day] as DayHours | undefined
    
    if (currentDay?.closed) {
      updateDayHours(day, type, {
        open: currentDay.open ?? '09:00',
        close: currentDay.close ?? '17:00',
        closed: false,
      })
    } else {
      updateDayHours(day, type, {
        open: currentDay?.open ?? '09:00',
        close: currentDay?.close ?? '17:00',
        closed: true,
      })
    }
  }

  const copyStoreToDelivery = () => {
    if (value?.storeHours) {
      updateHours('deliveryHours', value.storeHours)
    }
  }

  const setAllDays = (type: 'storeHours' | 'deliveryHours', hours: DayHours) => {
    const allDays = DAYS.reduce((acc, day) => {
      acc[day] = hours
      return acc
    }, {} as Record<string, DayHours>)
    
    updateHours(type, allDays)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timezone Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Globe className="w-4 h-4" />
          Store Timezone
        </div>
        <select
          value={value?.timezone || 'America/New_York'}
          onChange={(e) => updateHours('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {COMMON_TIMEZONES.map(tz => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Store Hours */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Clock className="w-4 h-4" />
          Store Hours
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {DAYS.map(day => {
            const hours = value?.storeHours?.[day] as DayHours | undefined
            const isOpen = !hours?.closed
            
            return (
              <div key={day} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-16 text-sm font-medium">
                  {DAY_LABELS[day]}
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isOpen}
                    onChange={() => toggleDay(day, 'storeHours')}
                  />
                  
                  {isOpen && (
                    <>
                      <input
                        type="text"
                        value={formatTimeForInput(hours?.open || '09:00')}
                        onChange={(e) => updateDayHours(day, 'storeHours', {
                          open: parseTimeFromInput(e.target.value),
                          close: hours?.close ?? '17:00',
                          closed: hours?.closed ?? false,
                        })}
                        placeholder="9:00 AM"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      
                      <span className="text-gray-500">to</span>
                      
                      <input
                        type="text"
                        value={formatTimeForInput(hours?.close || '17:00')}
                        onChange={(e) => updateDayHours(day, 'storeHours', {
                          open: hours?.open ?? '09:00',
                          close: parseTimeFromInput(e.target.value),
                          closed: hours?.closed ?? false,
                        })}
                        placeholder="5:00 PM"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Delivery Hours */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Package className="w-4 h-4" />
            Delivery Hours
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={useSameHours}
                onChange={(e) => {
                  const checked = e.target.checked
                  setUseSameHours(checked)
                  if (checked && value?.storeHours) {
                    copyStoreToDelivery()
                  }
                }}
              />
              Same as store hours
            </label>
            
            {useSameHours && (
              <button
                type="button"
                onClick={copyStoreToDelivery}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Copy from store
              </button>
            )}
          </div>
        </div>
        
        {!useSameHours && (
          <div className="grid grid-cols-1 gap-3">
            {DAYS.map(day => {
              const hours = value?.deliveryHours?.[day] as DayHours | undefined
              const isOpen = !hours?.closed
              
              return (
                <div key={day} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="w-16 text-sm font-medium">
                    {DAY_LABELS[day]}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isOpen}
                      onChange={() => toggleDay(day, 'deliveryHours')}
                    />
                    
                    {isOpen && (
                      <>
                        <input
                          type="text"
                          value={formatTimeForInput(hours?.open || '10:00')}
                          onChange={(e) => updateDayHours(day, 'deliveryHours', {
                            open: parseTimeFromInput(e.target.value),
                            close: hours?.close ?? '21:00',
                            closed: hours?.closed ?? false,
                          })}
                          placeholder="10:00 AM"
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                        
                        <span className="text-gray-500">to</span>
                        
                        <input
                          type="text"
                          value={formatTimeForInput(hours?.close || '21:00')}
                          onChange={(e) => updateDayHours(day, 'deliveryHours', {
                            open: hours?.open ?? '10:00',
                            close: parseTimeFromInput(e.target.value),
                            closed: hours?.closed ?? false,
                          })}
                          placeholder="9:00 PM"
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setAllDays('storeHours', { open: '09:00', close: '17:00', closed: false })}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Set all weekdays (9-5)
        </button>
        
        <button
          type="button"
          onClick={() => setAllDays('storeHours', { open: '09:00', close: '17:00', closed: false })}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Set all weekends (10-6)
        </button>
      </div>
    </div>
  )
}
