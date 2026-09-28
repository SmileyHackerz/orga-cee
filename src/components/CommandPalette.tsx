import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CalendarDays, CheckSquare, FileText, Gavel, LayoutGrid, Megaphone, Search } from 'lucide-react'
import { usePublishedRows } from '../lib/store'
import { useAuth } from '../lib/auth'
import { POLES } from '../lib/poles'
import { capitalize, monthLabel } from '../lib/dates'
import { EASE } from './ui'

interface Item {
  id: string
  label: string
  hint: string
  group: string
  icon: typeof Search
  to: string
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { profile, isSupervisor } = useAuth()
  const activities = usePublishedRows('activities')
  const tasks = usePublishedRows('tasks')
  const decisions = usePublishedRows('decisions')
  const minutes = usePublishedRows('minutes')
  const announcements = usePublishedRows('announcements')
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { id: 'p-home', label: 'Vue commune', hint: 'Page', group: 'Pages', icon: LayoutGrid, to: '/' },
      ...POLES.map((p) => ({ id: `p-${p.id}`, label: p.name, hint: p.code, group: 'Pages', icon: LayoutGrid, to: p.path })),
    ]
    if (profile?.pole && !isSupervisor) pages.push({ id: 'p-admin', label: 'Mon espace admin', hint: 'Admin', group: 'Pages', icon: LayoutGrid, to: `/admin/${profile.pole}` })
    if (isSupervisor) POLES.forEach((p) => pages.push({ id: `a-${p.id}`, label: `Admin · ${p.short}`, hint: 'Lecture', group: 'Pages', icon: LayoutGrid, to: `/admin/${p.id}` }))
    return [
      ...pages,
      ...activities.map((a) => ({ id: a.id, label: a.title, hint: capitalize(monthLabel(a.month, 'short')), group: 'Activités', icon: CalendarDays, to: `/logistique?activite=${a.id}` })),
      ...tasks.filter((t) => t.status !== 'termine').map((t) => ({ id: t.id, label: t.title, hint: t.assignee ?? '', group: 'Missions', icon: CheckSquare, to: '/secretariat#missions' })),
      ...announcements.map((a) => ({ id: a.id, label: a.title, hint: 'Annonce', group: 'Communication', icon: Megaphone, to: '/communication' })),
      ...decisions.map((d) => ({ id: d.id, label: d.title, hint: `N° ${String(d.number).padStart(3, '0')}`, group: 'Registre', icon: Gavel, to: '/secretariat#decisions' })),
      ...minutes.map((m) => ({ id: m.id, label: m.title, hint: 'PV', group: 'Registre', icon: FileText, to: '/secretariat#pv' })),
    ]
  }, [activities, tasks, decisions, minutes, announcements, profile, isSupervisor])

  const results = useMemo(() => {
    const n = norm(q.trim())
    const found = n ? items.filter((i) => norm(`${i.label} ${i.hint}`).includes(n)) : items.filter((i) => i.group === 'Pages' || i.group === 'Activités').slice(0, 12)
    return found.slice(0, 40)
  }, [items, q])

  useEffect(() => {
    if (open) {
      setQ('')
      setCursor(0)
      requestAnimationFrame(() => input.current?.focus())
    }
  }, [open])

  useEffect(() => setCursor(0), [q])

  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const go = (i: Item | undefined) => {
    if (!i) return
    onClose()
    navigate(i.to)
  }

  let lastGroup = ''
  return (
    <AnimatePresence>
      {open && (
        <div className="palette-root">
          <motion.div className="drawer-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Recherche rapide"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: EASE }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCursor((c) => Math.min(c + 1, results.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCursor((c) => Math.max(c - 1, 0))
              }
              if (e.key === 'Enter') go(results[cursor])
            }}
          >
            <div className="palette__input">
              <Search size={18} />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Activité, mission, décision, page…" aria-label="Rechercher" />
              <kbd>Échap</kbd>
            </div>
            <div className="palette__list" ref={list} role="listbox">
              {results.length === 0 && <p className="palette__empty">Rien ne correspond à « {q} ».</p>}
              {results.map((r, i) => {
                const head = r.group !== lastGroup ? r.group : null
                lastGroup = r.group
                const Icon = r.icon
                return (
                  <div key={r.id}>
                    {head && <div className="palette__group">{head}</div>}
                    <button
                      role="option"
                      aria-selected={i === cursor}
                      data-active={i === cursor}
                      className="palette__item"
                      onMouseMove={() => setCursor(i)}
                      onClick={() => go(r)}
                    >
                      {i === cursor && <motion.span layoutId="palette-cursor" className="palette__cursor" transition={{ type: 'spring', stiffness: 600, damping: 44 }} />}
                      <Icon size={16} strokeWidth={1.8} />
                      <span className="palette__label">{r.label}</span>
                      <span className="palette__hint">{r.hint}</span>
                      <ArrowRight size={14} className="palette__go" />
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
