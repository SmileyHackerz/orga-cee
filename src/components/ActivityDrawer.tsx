import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertTriangle, CalendarDays, Clock, MapPin, Pencil, Users } from 'lucide-react'
import { usePublishedRows, useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { OPTIONS, optionOf } from '../lib/options'
import { capitalize, dueLabel, fullDate, monthLabel, timeLabel } from '../lib/dates'
import { Button, CheckBox, Drawer, EmptyState, Pill, PoleTag, useToast } from './ui'
import { AttachmentList } from './Attachments'

export function ActivityDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const activities = usePublishedRows('activities')
  const checklist = usePublishedRows('checklist')
  const tasks = usePublishedRows('tasks')
  const incidents = usePublishedRows('incidents')
  const { canEdit } = useAuth()
  const store = useStore()
  const toast = useToast()
  const a = activities.find((x) => x.id === id)
  const editable = canEdit('logistique')

  const files = usePublishedRows('attachments')
  const hasFiles = files.some((f) => f.parent_table === 'activities' && f.parent_id === id)
  const items = useMemo(() => checklist.filter((c) => c.activity_id === id), [checklist, id])
  const linkedTasks = useMemo(() => tasks.filter((t) => t.activity_id === id), [tasks, id])
  const linkedIncidents = useMemo(() => incidents.filter((i) => i.activity_id === id), [incidents, id])
  const done = items.filter((i) => i.done).length
  const st = a ? optionOf(OPTIONS.activityStatus, a.status) : undefined

  return (
    <Drawer
      open={!!a}
      onClose={onClose}
      title={
        a && (
          <>
            <h2>{a.title}</h2>
            <div className="drawer-kick">
              <PoleTag pole="logistique" />
              <span>{capitalize(monthLabel(a.month))}</span>
            </div>
          </>
        )
      }
      footer={
        a && (
          <>
            <Pill tone={st?.tone}>{st?.label}</Pill>
            {editable && (
              <Link to={`/admin/logistique?tab=activities&edit=${a.id}`}>
                <Button variant="solid" size="sm" icon={<Pencil size={14} />}>Modifier la fiche</Button>
              </Link>
            )}
          </>
        )
      }
    >
      {a && (
        <div className="sheet">
          <div className="facts">
            <div><CalendarDays size={16} /><span>Date</span><b>{a.date ? capitalize(fullDate(a.date)) : 'À fixer'}</b></div>
            <div><Clock size={16} /><span>Heure</span><b>{timeLabel(a.time) ?? 'À fixer'}</b></div>
            <div><MapPin size={16} /><span>Lieu</span><b>{a.place ?? 'À fixer'}</b></div>
            <div><Users size={16} /><span>Participants</span><b>{a.expected ? `${a.expected} attendus` : '—'}</b></div>
          </div>

          {a.objective && (
            <section className="sheet__sec">
              <h3>Objectif</h3>
              <p>{a.objective}</p>
            </section>
          )}
          {(a.audience || a.speakers || a.lead) && (
            <section className="sheet__sec sheet__grid">
              {a.audience && <div><h3>Public</h3><p>{a.audience}</p></div>}
              {a.speakers && <div><h3>Intervenants</h3><p>{a.speakers}</p></div>}
              {a.lead && <div><h3>Responsable</h3><p>{a.lead}</p></div>}
            </section>
          )}
          {a.program && (
            <section className="sheet__sec">
              <h3>Déroulé</h3>
              <ol className="steps">
                {a.program.split('\n').filter(Boolean).map((s, i) => (
                  <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{s}</li>
                ))}
              </ol>
            </section>
          )}

          {hasFiles && (
            <section className="sheet__sec">
              <h3>Fiches de l’activité</h3>
              <AttachmentList parent="activities" parentId={a.id} />
            </section>
          )}

          <section className="sheet__sec">
            <div className="sheet__row">
              <h3>Check-list logistique</h3>
              {items.length > 0 && <span className="sheet__count">{done}/{items.length} prêts</span>}
            </div>
            {items.length > 0 && (
              <div className="meter" aria-hidden>
                <motion.i initial={{ width: 0 }} animate={{ width: `${(done / items.length) * 100}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            )}
            {items.length === 0 ? (
              <EmptyState title="Pas encore de check-list" text={editable ? 'Ajoute le matériel depuis ton espace admin.' : 'Le pôle Logistique ne l’a pas encore préparée.'} />
            ) : (
              <ul className="checklist">
                {items.map((c) => (
                  <li key={c.id} className={c.done ? 'is-done' : ''}>
                    <CheckBox
                      checked={c.done}
                      label={c.label}
                      disabled={!editable}
                      onChange={async (v) => {
                        try {
                          await store.update('checklist', c.id, { done: v })
                        } catch {
                          toast('Modification impossible', 'error')
                        }
                      }}
                    />
                    <span className="checklist__label">{c.label}</span>
                    {c.quantity ? <span className="checklist__qty">× {c.quantity}</span> : null}
                    <span className="checklist__owner">{c.owner}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {linkedTasks.length > 0 && (
            <section className="sheet__sec">
              <h3>Tâches liées</h3>
              <div className="rows">
                {linkedTasks.map((t) => {
                  const s = optionOf(OPTIONS.taskStatus, t.status)
                  const d = dueLabel(t.due)
                  return (
                    <div key={t.id} className="row-item" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                      <PoleTag pole={t.pole} tone="line" />
                      <div>
                        <div className="row-item__title">{t.title}</div>
                        <div className="row-item__sub">{t.assignee} · <span className={`due due--${d.tone}`}>{d.text}</span></div>
                      </div>
                      <Pill tone={s?.tone}>{s?.label}</Pill>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {linkedIncidents.length > 0 && (
            <section className="sheet__sec">
              <h3>Imprévus</h3>
              {linkedIncidents.map((i) => (
                <div key={i.id} className={`incident ${i.status === 'resolu' ? 'is-closed' : ''}`}>
                  <AlertTriangle size={17} />
                  <div>
                    <b>{i.title}</b>
                    {i.details && <p>{i.details}</p>}
                  </div>
                  <Pill tone={optionOf(OPTIONS.incidentStatus, i.status)?.tone}>{optionOf(OPTIONS.incidentStatus, i.status)?.label}</Pill>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}
