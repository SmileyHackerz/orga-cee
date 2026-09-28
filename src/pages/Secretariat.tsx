import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, ChevronDown, Clock, ExternalLink, MapPin, Video } from 'lucide-react'
import { usePublishedRows } from '../lib/store'
import { OPTIONS, optionOf } from '../lib/options'
import { byDue, isOpen, meetLink, meetingKind, nextMeeting, pastMeetings } from '../lib/derived'
import { POLES } from '../lib/poles'
import { capitalize, dueLabel, fullDate, meetingDateTime, shortDate, timeLabel } from '../lib/dates'
import type { PoleId } from '../lib/types'
import { safeUrl } from '../lib/url'
import { PoleHeader } from '../components/PoleHeader'
import { Card, Countdown, EASE, EmptyState, Pill, PoleTag, Segmented, rise, stagger } from '../components/ui'

export function Secretariat() {
  const meetings = usePublishedRows('meetings')
  const tasks = usePublishedRows('tasks')
  const decisions = usePublishedRows('decisions')
  const minutes = usePublishedRows('minutes')
  const members = usePublishedRows('members')
  const attendance = usePublishedRows('attendance')
  const settings = usePublishedRows('settings')
  const location = useLocation()
  const [pole, setPole] = useState<'tous' | PoleId>('tous')
  const [scope, setScope] = useState<'ouvertes' | 'toutes'>('ouvertes')
  const [allMissions, setAllMissions] = useState(false)
  const [openPv, setOpenPv] = useState<string | null>(null)

  useEffect(() => {
    if (!location.hash) return
    const t = setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
    return () => clearTimeout(t)
  }, [location.hash])

  const meeting = nextMeeting(meetings)
  const agenda = meeting?.agenda?.split('\n').filter(Boolean) ?? []
  const missions = useMemo(
    () => tasks.filter((t) => (pole === 'tous' || t.pole === pole) && (scope === 'toutes' || isOpen(t))).sort(byDue),
    [tasks, pole, scope],
  )
  const register = [...decisions].sort((a, b) => b.number - a.number)
  const pvs = [...minutes].sort((a, b) => b.meeting_date.localeCompare(a.meeting_date))
  const past = pastMeetings(meetings).slice(0, 6).reverse()

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <PoleHeader pole="secretariat" />

      <motion.section variants={rise} className="meeting-banner" aria-label="Prochaine réunion">
        <div style={{ position: 'relative' }}>
          {meeting ? (
            <>
              <h2>Réunion du {fullDate(meeting.date)}</h2>
              <div className="meeting-banner__meta">
                <span>{meetingKind(meeting)}</span>
                <span><Clock size={15} />{timeLabel(meeting.time) ?? 'Heure à fixer'}</span>
                <span><MapPin size={15} />{meeting.place ?? 'Lieu à fixer'}</span>
              </div>
              <Countdown to={meetingDateTime(meeting.date, meeting.time)} />
              {meetLink(settings, meeting.audience) && (
                <div style={{ marginTop: 20 }}>
                  <a className="join-btn" href={meetLink(settings, meeting.audience)!} target="_blank" rel="noreferrer">
                    <Video size={16} /> Rejoindre sur Meet
                  </a>
                </div>
              )}
            </>
          ) : (
            <h2>À programmer</h2>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <span className="label">Ordre du jour</span>
          {agenda.length ? (
            <ol className="steps steps--agenda" style={{ marginTop: 6 }}>
              {agenda.map((p, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07, duration: 0.5, ease: EASE }}>
                  <span>{String(i + 1).padStart(2, '0')}</span>{p}
                </motion.li>
              ))}
            </ol>
          ) : (
            <p style={{ marginTop: 10, color: 'var(--on-ink-mute)' }}>L’ordre du jour sera publié ici avant la réunion.</p>
          )}
        </div>
      </motion.section>

      <div style={{ marginTop: 14 }}>
        <Card
          id="missions"
          title="Suivi des missions"
          action={
            <div className="filters">
              <Segmented
                size="sm"
                label="Pôle"
                value={pole}
                onChange={setPole}
                options={[{ value: 'tous', label: 'Tous' }, ...POLES.map((p) => ({ value: p.id, label: p.code }))]}
              />
              <Segmented size="sm" label="Portée" value={scope} onChange={setScope} options={[{ value: 'ouvertes', label: 'Ouvertes' }, { value: 'toutes', label: 'Toutes' }]} />
            </div>
          }
        >
          {missions.length === 0 ? (
            <EmptyState title="Aucune mission" text="Les tâches visibles de chaque pôle se regroupent ici automatiquement." />
          ) : (
            <div className="table-wrap">
              <table className="table admin-table">
                <thead>
                  <tr><th>Mission</th><th>Pôle</th><th className="hide-sm">Responsable</th><th>Échéance</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {(allMissions ? missions : missions.slice(0, 5)).map((t) => {
                      const d = dueLabel(t.due)
                      const st = optionOf(OPTIONS.taskStatus, t.status)
                      return (
                        <motion.tr key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ cursor: 'default' }}>
                          <td><strong>{t.title}</strong></td>
                          <td><PoleTag pole={t.pole} /></td>
                          <td className="hide-sm">{t.assignee ?? <span className="dim">—</span>}</td>
                          <td><span className={`due due--${t.status === 'termine' ? 'none' : d.tone}`}>{t.status === 'termine' ? 'Fait' : d.text}</span></td>
                          <td><Pill tone={st?.tone}>{st?.label}</Pill></td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {missions.length > 5 && (
                <button className="board__more" onClick={() => setAllMissions((v) => !v)} aria-expanded={allMissions}>
                  {allMissions ? 'Afficher moins' : `Voir les ${missions.length - 5} autres missions`}
                  <ChevronDown size={15} style={{ transform: allMissions ? 'rotate(180deg)' : undefined, transition: 'transform .3s' }} />
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card id="liens" title="Liens des réunions">
          {OPTIONS.meetingAudience.every((o) => !meetLink(settings, o.value as never)) ? (
            <p className="coll-help">Les liens Meet n’ont pas encore été définis par le Secrétariat.</p>
          ) : (
          <div className="meet-links">
            {OPTIONS.meetingAudience.map((o) => {
              const link = meetLink(settings, o.value as never)
              return link ? (
                <a key={o.value} className="meet-link" href={link} target="_blank" rel="noreferrer">
                  <span className="meet-link__icon"><Video size={17} /></span>
                  <span><b>{capitalize(o.label.replace('Réunion ', '').replace(/^du |^de /, ''))}</b><small>Rejoindre sur Meet</small></span>
                </a>
              ) : null
            })}
          </div>
          )}
        </Card>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <Card id="decisions" title="Registre des décisions">
          {register.length === 0 ? (
            <EmptyState title="Registre vide" text="Chaque résolution actée en réunion est inscrite ici avec son numéro." />
          ) : (
            <div className="register">
              {register.map((d) => (
                <div key={d.id} className="register__item">
                  <span className="register__n">{String(d.number).padStart(3, '0')}</span>
                  <div>
                    <b>{d.title}</b>
                    <p>{shortDate(d.date)} · {optionOf(OPTIONS.concerns, d.concerns)?.label}{d.details ? ` — ${d.details}` : ''}</p>
                    <div className="register__status"><Pill tone={optionOf(OPTIONS.decisionStatus, d.status)?.tone}>{optionOf(OPTIONS.decisionStatus, d.status)?.label}</Pill></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card id="pv" title="Procès-verbaux">
          {pvs.length === 0 ? (
            <EmptyState title="Aucun PV archivé" text="Les comptes rendus de réunion sont consultables ici par tout le conseil." />
          ) : (
            <div>
              {pvs.map((m) => {
                const on = openPv === m.id
                const link = safeUrl(m.link)
                return (
                  <div key={m.id} className={`pv ${on ? 'is-open' : ''}`}>
                    <button className="pv__head" aria-expanded={on} onClick={() => setOpenPv(on ? null : m.id)}>
                      <span className="mono-date">{shortDate(m.meeting_date)}</span>
                      <b>{m.title}</b>
                      <ChevronDown size={18} className="pv__chev" />
                    </button>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div className="pv__body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                          <div className="pv__inner">
                            {m.summary && <p><b>{m.summary}</b></p>}
                            {m.body && <p>{m.body}</p>}
                            {link && (
                              <p><a className="link-more" href={link} target="_blank" rel="noreferrer">Ouvrir le document <ExternalLink size={13} /></a></p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card id="presences" title="Feuille de présence" action={<div className="legend"><span><i className="dot dot--present" />Présent</span><span><i className="dot dot--excuse" />Excusé</span><span><i className="dot dot--absent" />Absent</span></div>}>
          {past.length === 0 ? (
            <EmptyState title="Aucune réunion passée" text="Après chaque réunion, le Secrétariat note qui était présent." />
          ) : (
            <div className="grid-table-wrap">
              <table className="presence">
                <thead>
                  <tr>
                    <th>Membre</th>
                    {past.map((m) => <th key={m.id}><CalendarDays size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />{shortDate(m.date)}</th>)}
                    <th>Assiduité</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((mb) => {
                    const marks = past.map((m) => attendance.find((a) => a.meeting_id === m.id && a.member_id === mb.id)?.status)
                    const counted = marks.filter(Boolean).length
                    const present = marks.filter((s) => s === 'present').length
                    const expected = marks.filter((s) => s === 'present' || s === 'absent').length
                    if (!counted) return null
                    return (
                      <tr key={mb.id}>
                        <td>{mb.name}</td>
                        {marks.map((s, i) => <td key={i}><i className={`dot dot--${s ?? 'none'}`} title={s ? optionOf(OPTIONS.attendance, s)?.label : 'Non renseigné'} /></td>)}
                        <td className="rate">{expected ? `${Math.round((present / expected) * 100)}%` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
