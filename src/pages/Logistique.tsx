import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertTriangle, Clock } from 'lucide-react'
import { usePublishedRows } from '../lib/store'
import { OPTIONS, optionOf } from '../lib/options'
import { byDue, isOpen } from '../lib/derived'
import { capitalize, daysUntil, dueLabel, monthLabel } from '../lib/dates'
import type { Task } from '../lib/types'
import { ActivityBoard } from '../components/ActivityBoard'
import { ActivityDrawer } from '../components/ActivityDrawer'
import { PoleHeader } from '../components/PoleHeader'
import { Avatar, Card, EASE, EmptyState, Pill, rise, stagger } from '../components/ui'

const COLUMNS: { key: string; label: string; match: (t: Task) => boolean }[] = [
  { key: 'a_faire', label: 'À faire', match: (t) => t.status === 'a_faire' },
  { key: 'en_cours', label: 'En cours', match: (t) => t.status === 'en_cours' || t.status === 'bloque' },
  { key: 'termine', label: 'Terminé', match: (t) => t.status === 'termine' },
]

export function Logistique() {
  const activities = usePublishedRows('activities')
  const allTasks = usePublishedRows('tasks')
  const incidents = usePublishedRows('incidents')
  const checklist = usePublishedRows('checklist')
  const [params, setParams] = useSearchParams()

  const tasks = useMemo(() => allTasks.filter((t) => t.pole === 'logistique').sort(byDue), [allTasks])
  const alerts = tasks.filter((t) => isOpen(t) && t.due && daysUntil(t.due) <= 3)
  const withChecklist = activities
    .map((a) => ({ a, items: checklist.filter((c) => c.activity_id === a.id) }))
    .filter((x) => x.items.length)

  const open = (id: string) => setParams((p) => { p.set('activite', id); return p })

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <PoleHeader pole="logistique" />

      {alerts.length > 0 && (
        <motion.div variants={rise} className="alerts" aria-label="Alertes">
          {alerts.map((t) => {
            const d = dueLabel(t.due)
            return (
              <div key={t.id} className={`alert-line ${d.tone === 'late' ? '' : 'alert-line--soon'}`}>
                <Clock size={17} />
                <span><b>{t.title}</b> — {t.assignee ?? 'non attribuée'}</span>
                <span className={`due due--${d.tone}`}>{d.text}</span>
              </div>
            )
          })}
        </motion.div>
      )}

      <div className="grid-3-1">
        <Card title="Calendrier des activités">
          {activities.length ? <ActivityBoard activities={activities} onOpen={open} /> : <EmptyState title="Aucune activité" text="Ajoute la première activité depuis l’espace admin du pôle." />}
        </Card>

        <div className="stack">
          <Card title="Check-lists logistiques">
            {withChecklist.length === 0 ? (
              <EmptyState title="Aucune check-list" text="Chaises, micros, rallonges, eau, badges : prépare le matériel de chaque activité." />
            ) : (
              <div className="progress-cards">
                {withChecklist.map(({ a, items }) => {
                  const done = items.filter((i) => i.done).length
                  return (
                    <button key={a.id} className="progress-card" onClick={() => open(a.id)}>
                      <b>{a.title}</b>
                      <small>{capitalize(monthLabel(a.month))} · {done}/{items.length} prêts</small>
                      <span className="meter"><motion.i initial={{ width: 0 }} animate={{ width: `${(done / items.length) * 100}%` }} transition={{ duration: 1, ease: EASE, delay: 0.3 }} /></span>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Imprévus & problèmes">
            {incidents.length === 0 ? (
              <EmptyState title="Aucun imprévu signalé" text="Tant mieux. Signale tout problème dès qu’il apparaît." />
            ) : (
              incidents.map((i) => (
                <div key={i.id} className={`incident ${i.status === 'resolu' ? 'is-closed' : ''}`}>
                  <AlertTriangle size={17} />
                  <div>
                    <b>{i.title}</b>
                    {i.details && <p>{i.details}</p>}
                  </div>
                  <Pill tone={optionOf(OPTIONS.incidentStatus, i.status)?.tone}>{optionOf(OPTIONS.incidentStatus, i.status)?.label}</Pill>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Répartition des tâches">
          {tasks.length === 0 ? (
            <EmptyState title="Aucune tâche" text="Répartis les rôles : qui installe, qui accueille, qui range." />
          ) : (
            <div className="kanban">
              {COLUMNS.map((col) => {
                const list = tasks.filter(col.match)
                return (
                  <div key={col.key} className="kanban__col">
                    <div className="kanban__head"><span>{col.label}</span><span>{list.length}</span></div>
                    {list.map((t, i) => {
                      const d = dueLabel(t.due)
                      const st = optionOf(OPTIONS.taskStatus, t.status)
                      return (
                        <motion.div key={t.id} className="task-card" layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.45, ease: EASE }}>
                          <b>{t.title}</b>
                          <div className="task-card__foot">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Avatar name={t.assignee ?? '?'} size={22} tone="stone" />{t.assignee ?? '—'}</span>
                            {t.status === 'bloque' ? <Pill tone={st?.tone}>{st?.label}</Pill> : col.key !== 'termine' && <span className={`due due--${d.tone}`}>{d.text}</span>}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <ActivityDrawer id={params.get('activite')} onClose={() => setParams((p) => { p.delete('activite'); return p })} />
    </motion.div>
  )
}
