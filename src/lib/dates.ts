const DAY = 86_400_000

export const todayISO = () => toISODate(new Date())

export function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export const currentMonth = () => todayISO().slice(0, 7)

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', opts)

export const longDate = (s: string) => fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseISODate(s))
export const shortDate = (s: string) => fmt({ day: 'numeric', month: 'short' }).format(parseISODate(s))
export const dayMonth = (s: string) => fmt({ weekday: 'short', day: '2-digit', month: 'short' }).format(parseISODate(s))
export const fullDate = (s: string) => fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(parseISODate(s))

export const monthLabel = (ym: string, style: 'long' | 'short' = 'long') =>
  fmt({ month: style, year: 'numeric' }).format(parseISODate(`${ym}-01`))
export const monthShort = (ym: string) => fmt({ month: 'short' }).format(parseISODate(`${ym}-01`)).replace('.', '')

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function daysUntil(iso: string) {
  const a = parseISODate(todayISO()).getTime()
  const b = parseISODate(iso).getTime()
  return Math.round((b - a) / DAY)
}

export function dueLabel(iso: string | null): { text: string; tone: 'late' | 'soon' | 'normal' | 'none' } {
  if (!iso) return { text: 'Sans échéance', tone: 'none' }
  const d = daysUntil(iso)
  if (d < 0) return { text: `En retard de ${-d} j`, tone: 'late' }
  if (d === 0) return { text: "Aujourd'hui", tone: 'soon' }
  if (d === 1) return { text: 'Demain', tone: 'soon' }
  if (d <= 3) return { text: `Dans ${d} jours`, tone: 'soon' }
  return { text: shortDate(iso), tone: 'normal' }
}

export function meetingDateTime(date: string, time: string | null) {
  const d = parseISODate(date)
  if (time) {
    const [h, m] = time.split(':').map(Number)
    d.setHours(h ?? 0, m ?? 0, 0, 0)
  } else d.setHours(18, 0, 0, 0)
  return d
}

export const timeLabel = (t: string | null) => (t ? t.slice(0, 5).replace(':', 'h') : null)

export function relativeFromNow(iso: string) {
  const d = daysUntil(iso)
  if (d === 0) return "aujourd'hui"
  if (d === 1) return 'demain'
  if (d === -1) return 'hier'
  if (d > 0) return `dans ${d} jours`
  return `il y a ${-d} jours`
}

export function addDays(iso: string, n: number) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export const formatCFA = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} F`
