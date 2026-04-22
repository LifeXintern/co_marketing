import { formatDateWithWeekday } from "@/lib/date-utils"

export type Granularity = 'day' | 'week' | 'month'

export const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
}

// Pick bucket size from range length so the chart stays readable
export function pickGranularity(dayCount: number): Granularity {
  if (dayCount <= 45) return 'day'
  if (dayCount <= 180) return 'week'
  return 'month'
}

// Monday-anchored week start in YYYY-MM-DD (UTC, matches input dates)
export function weekStartKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const dow = d.getUTCDay() // 0=Sun..6=Sat
  const diff = (dow + 6) % 7 // days since Monday
  d.setUTCDate(d.getUTCDate() - diff)
  return d.toISOString().split('T')[0]
}

export function monthStartKey(dateStr: string): string {
  return dateStr.slice(0, 7) + '-01'
}

export function bucketKeyFor(date: string, granularity: Granularity): string {
  if (granularity === 'day') return date
  if (granularity === 'week') return weekStartKey(date)
  return monthStartKey(date)
}

export function formatBucketLabel(key: string, granularity: Granularity): string {
  if (granularity === 'day') return formatDateWithWeekday(key)
  const d = new Date(key + 'T00:00:00Z')
  if (granularity === 'week') {
    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    return `Week of ${month} ${d.getUTCDate()}`
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

// Day-count of a [start, end] range, using the dataset's date span as fallback
export function spanInDays(
  startDate: string | undefined,
  endDate: string | undefined,
  fallbackFirst: string,
  fallbackLast: string,
): number {
  const first = new Date((startDate || fallbackFirst) + 'T00:00:00Z').getTime()
  const last = new Date((endDate || fallbackLast) + 'T00:00:00Z').getTime()
  return Math.round((last - first) / 86_400_000) + 1
}

// X-axis label spacing: show all labels when bucket count is small
export function xAxisInterval(bucketCount: number): number {
  return bucketCount <= 20 ? 0 : Math.floor(bucketCount / 20)
}
