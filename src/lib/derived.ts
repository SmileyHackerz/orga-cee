import type { Contribution, Meeting, MeetingAudience, Member, MemberRole, Setting, Task } from './types'
import { safeUrl } from './url'
import { OPTIONS, optionOf } from './options'
import { meetingDateTime, todayISO } from './dates'
import { DEFAULT_RATES } from './poles'

export function nextMeeting(meetings: Meeting[]) {
  const now = Date.now()
  return [...meetings]
    .filter((m) => meetingDateTime(m.date, m.time).getTime() + 2 * 3_600_000 > now)
    .sort((a, b) => meetingDateTime(a.date, a.time).getTime() - meetingDateTime(b.date, b.time).getTime())[0]
}

export function pastMeetings(meetings: Meeting[]) {
  const now = Date.now()
  return [...meetings]
    .filter((m) => meetingDateTime(m.date, m.time).getTime() <= now)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export const isOpen = (t: Task) => t.status !== 'termine'
export const isLate = (t: Task) => isOpen(t) && !!t.due && t.due < todayISO()

export function byDue(a: Task, b: Task) {
  if (!a.due) return 1
  if (!b.due) return -1
  return a.due.localeCompare(b.due)
}

/** Finance settings only: another pole cannot spoof a rate or a flag by reusing the key. */
export const setting = (settings: Setting[], key: string) => settings.find((s) => s.pole === 'finance' && s.key === key)?.value ?? null

export const meetLink = (settings: Setting[], audience: MeetingAudience | null | undefined) =>
  safeUrl(settings.find((s) => s.pole === 'secretariat' && s.key === `meet_${audience ?? 'conseil'}`)?.value)

export const meetingKind = (m: Meeting) => optionOf(OPTIONS.meetingAudience, m.audience ?? 'conseil')?.label ?? 'Réunion du conseil'

export function ratesFrom(settings: Setting[]): Record<MemberRole, number> {
  const raw = setting(settings, 'rates')
  if (!raw) return DEFAULT_RATES
  try {
    return { ...DEFAULT_RATES, ...(JSON.parse(raw) as Partial<Record<MemberRole, number>>) }
  } catch {
    return DEFAULT_RATES
  }
}

export interface RateSummary {
  paid: number
  total: number
  pct: number
}

export function contributionRate(members: Member[], contributions: Contribution[], month: string): RateSummary | null {
  if (!members.length) return null
  const paid = new Set(contributions.filter((c) => c.month === month).map((c) => c.member_id))
  const count = members.filter((m) => paid.has(m.id)).length
  return { paid: count, total: members.length, pct: Math.round((count / members.length) * 100) }
}

/** The finance pole publishes an aggregate per month so the council never needs the private detail. */
export function publishedRate(settings: Setting[], month: string): RateSummary | null {
  if (setting(settings, 'publish_rate') !== 'true') return null
  const raw = setting(settings, `rate:${month}`)
  if (!raw) return null
  try {
    const { paid, total } = JSON.parse(raw) as { paid: number; total: number }
    return total ? { paid, total, pct: Math.round((paid / total) * 100) } : null
  } catch {
    return null
  }
}
