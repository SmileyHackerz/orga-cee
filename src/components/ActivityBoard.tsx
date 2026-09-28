import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Activity, ActivityStatus } from '../lib/types'
import { ACADEMIC_MONTHS } from '../lib/poles'
import { OPTIONS, optionOf } from '../lib/options'
import { capitalize, currentMonth, monthLabel, monthShort, shortDate, timeLabel } from '../lib/dates'
import { EASE, EmptyState, Pill, Segmented } from './ui'

type View = 'liste' | 'annee'
type Filter = 'tous' | ActivityStatus

/** Status colour is reserved for what needs a look: ready, problem. "En préparation" is the calm default. */
function StatusMark({ status }: { status: ActivityStatus }) {
  const st = optionOf(OPTIONS.activityStatus, status)
  if (status === 'preparation') return <span className="quiet-status">{st?.label}</span>
  return <Pill tone={st?.tone}>{st?.label}</Pill>
}

export function ActivityBoard({ activities, onOpen, limit, controls = true }: {
  activities: Activity[]
  onOpen: (id: string) => void
  limit?: number
  controls?: boolean
}) {
  const [view, setView] = useState<View>('liste')
  const [filter, setFilter] = useState<Filter>('tous')
  const [all, setAll] = useState(false)
  const now = currentMonth()

  const sorted = useMemo(() => [...activities].sort((a, b) => a.month.localeCompare(b.month) || (a.date ?? '').localeCompare(b.date ?? '')), [activities])
  const shown = filter === 'tous' ? sorted : sorted.filter((a) => a.status === filter)
  const upcoming = shown.filter((a) => a.month >= now)
  const listed = limit && !all ? (upcoming.length ? upcoming : shown).slice(0, limit) : shown
  const hidden = shown.length - listed.length
  const nextId = sorted.find((a) => a.month >= now)?.id
  const months = useMemo(() => {
    const extra = sorted.map((a) => a.month).filter((m) => !ACADEMIC_MONTHS.includes(m))
    return [...new Set([...ACADEMIC_MONTHS, ...extra])].sort()
  }, [sorted])

  const count = (s: ActivityStatus) => activities.filter((a) => a.status === s).length

  return (
    <div className="board">
      {controls && (
      <div className="board__bar">
          <div className="board__filter">
            <Segmented
              size="sm"
              label="Filtrer par statut"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'tous', label: 'Toutes', count: activities.length },
                { value: 'preparation', label: 'En préparation', count: count('preparation') },
                { value: 'prete', label: 'Prêtes', count: count('prete') },
                { value: 'probleme', label: 'Problème', count: count('probleme') },
              ]}
            />
          </div>
        <Segmented
          size="sm"
          label="Affichage"
          value={view}
          onChange={setView}
          options={[
            { value: 'liste', label: 'Liste' },
            { value: 'annee', label: 'Année' },
          ]}
        />
      </div>
      )}

      <LayoutGroup>
        {shown.length === 0 && <EmptyState title="Aucune activité avec ce statut" text="Change de filtre pour revoir tout le programme." />}

        {view === 'liste' ? (
          <motion.div className="act-list" layout>
            <AnimatePresence initial={false}>
              {listed.map((a, i) => {
                const next = a.id === nextId
                return (
                  <motion.button
                    layout
                    key={a.id}
                    className={`act-row ${next ? 'is-next' : ''}`}
                    onClick={() => onOpen(a.id)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03, duration: 0.45, ease: EASE } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <motion.span layoutId={`m-${a.id}`} layout="position" className="act-row__month">
                      {capitalize(monthShort(a.month))} <span>{a.month.slice(2, 4)}</span>
                    </motion.span>
                    <span className="act-row__main">
                      <motion.span layoutId={`t-${a.id}`} layout="position" className="act-row__title">
                        {a.title}
                      </motion.span>
                      <span className="act-row__meta">
                        {a.date ? `${shortDate(a.date)}${a.time ? ` · ${timeLabel(a.time)}` : ''}${a.place ? ` · ${a.place}` : ''}` : 'Date à fixer'}
                      </span>
                    </span>
                    <span className="next-flag">{next ? 'Ensuite' : ''}</span>
                    <StatusMark status={a.status} />
                    <ChevronRight className="act-row__go" size={16} />
                  </motion.button>
                )
              })}
            </AnimatePresence>
            {limit && (hidden > 0 || all) && (
              <motion.button layout className="board__more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
                {all ? 'Afficher seulement les prochaines' : `Voir tout le programme · ${hidden} de plus`}
                <ChevronDown size={15} style={{ transform: all ? 'rotate(180deg)' : undefined, transition: 'transform .3s' }} />
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="year" role="list">
            {months.map((m, mi) => {
              const inMonth = shown.filter((a) => a.month === m)
              return (
                <motion.div
                  role="listitem"
                  key={m}
                  className={`year__col ${m === now ? 'is-now' : ''} ${m < now ? 'is-past' : ''}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: mi * 0.025 } }}
                >
                  <span className="year__m">
                    {capitalize(monthShort(m))}
                    <small>{m.slice(0, 4)}</small>
                  </span>
                  {inMonth.map((a) => {
                    const st = optionOf(OPTIONS.activityStatus, a.status)
                    return (
                      <button key={a.id} className={`year__chip tone-${st?.tone} ${a.id === nextId ? 'is-next' : ''}`} onClick={() => onOpen(a.id)} title={`${a.title} — ${st?.label}`}>
                        <motion.span layoutId={`m-${a.id}`} layout="position" className="sr-only">
                          {monthLabel(a.month)}
                        </motion.span>
                        <motion.span layoutId={`t-${a.id}`} layout="position" className="year__title">
                          {a.title}
                        </motion.span>
                        {a.status !== 'preparation' && <span className="year__st">{st?.label}</span>}
                      </button>
                    )
                  })}
                  {m === now && <span className="year__now">Ce mois-ci</span>}
                </motion.div>
              )
            })}
          </div>
        )}
      </LayoutGroup>
    </div>
  )
}
