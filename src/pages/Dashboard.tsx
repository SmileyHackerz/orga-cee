import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, ListOrdered } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { usePublishedRows } from '../lib/store'
import { byDue, isLate, isOpen, meetingKind, nextMeeting, publishedRate } from '../lib/derived'
import { ACADEMIC_MONTHS, poleById } from '../lib/poles'
import { capitalize, currentMonth, dayMonth, dueLabel, longDate, meetingDateTime, monthLabel, timeLabel, todayISO } from '../lib/dates'
import { ActivityBoard } from '../components/ActivityBoard'
import { ActivityDrawer } from '../components/ActivityDrawer'
import { MeetingDrawer } from '../components/MeetingDrawer'
import { Button, Card, CountUp, Countdown, EASE, EmptyState, PoleTag, rise, stagger } from '../components/ui'

function greeting() {
  const h = new Date().getHours()
  return h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour'
}

export function Dashboard() {
  const { profile } = useAuth()
  const activities = usePublishedRows('activities')
  const tasks = usePublishedRows('tasks')
  const meetings = usePublishedRows('meetings')
  const settings = usePublishedRows('settings')
  const [params, setParams] = useSearchParams()
  const [agenda, setAgenda] = useState(false)

  const meeting = nextMeeting(meetings)
  const late = tasks.filter(isLate)
  const latePoles = [...new Set(late.map((t) => t.pole))]
  const month = currentMonth() < ACADEMIC_MONTHS[0] ? ACADEMIC_MONTHS[0] : currentMonth()
  const rate = publishedRate(settings, month)
  const upcoming = useMemo(() => tasks.filter(isOpen).sort(byDue).slice(0, 4), [tasks])
  const openCount = tasks.filter(isOpen).length

  const openActivity = (id: string) => setParams((p) => { p.set('activite', id); return p })
  const closeActivity = () => setParams((p) => { p.delete('activite'); return p })

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={rise} className="page-head">
        <div>
          <h1>Vue commune</h1>
          <p className="page-head__sub">
            {greeting()} {profile?.full_name.split(' ')[0]}. Les grandes lignes de la Commission, publiées par chaque pôle.
          </p>
          <p className="page-head__meta">{capitalize(longDate(todayISO()))}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="solid" icon={<ListOrdered size={16} />} onClick={() => setAgenda(true)}>
            Ordre du jour
          </Button>
        </div>
      </motion.header>

      <section className="kpis kpis--3" aria-label="En un coup d’œil">
        <motion.button variants={rise} className="kpi kpi--dark" onClick={() => setAgenda(true)} whileHover={{ y: -3 }} transition={{ duration: 0.3, ease: EASE }}>
          <span className="kpi__label">Prochaine réunion</span>
          {meeting ? (
            <>
              <span className="kpi__big">{capitalize(dayMonth(meeting.date))}</span>
              <span className="kpi__sub">{capitalize(meetingKind(meeting).replace('Réunion ', '').replace(/^du |^de /, ''))} · {timeLabel(meeting.time)}{meeting.place ? ` · ${meeting.place}` : ''}</span>
              <span className="kpi__foot">
                <Countdown to={meetingDateTime(meeting.date, meeting.time)} />
                <ArrowUpRight size={18} className="kpi__go" />
              </span>
            </>
          ) : (
            <>
              <span className="kpi__big">À programmer</span>
              <span className="kpi__sub">Le Secrétariat publiera la date ici.</span>
            </>
          )}
        </motion.button>

        <motion.div variants={rise} className={`kpi ${late.length ? 'kpi--alert' : ''}`}>
          <span className="kpi__label">Missions en retard</span>
          <span className="kpi__num"><CountUp value={late.length} /></span>
          <span className="kpi__sub">
            {late.length ? (
              <span className="kpi__poles">{latePoles.map((p) => <PoleTag key={p} pole={p} />)}</span>
            ) : (
              `Tout est dans les temps · ${openCount} en cours`
            )}
          </span>
          <Link to="/secretariat#missions" className="link-more">Suivi des missions <ArrowRight size={14} /></Link>
        </motion.div>

        <motion.div variants={rise} className="kpi">
          <span className="kpi__label">Cotisations · {monthLabel(month)}</span>
          {rate ? (
            <>
              <span className="kpi__num"><CountUp value={rate.pct} suffix="%" /><small>des membres à jour</small></span>
              <span className="meter"><motion.i initial={{ width: 0 }} animate={{ width: `${rate.pct}%` }} transition={{ duration: 1.1, ease: EASE, delay: 0.3 }} /></span>
            </>
          ) : (
            <span className="kpi__sub" style={{ marginTop: 10 }}>Le pôle Finance n’a pas encore publié le taux du mois.</span>
          )}
        </motion.div>
      </section>

      <div className="dash-grid">
        <Card title="Prochaines activités" action={<Link to="/logistique" className="link-more">Calendrier complet <ArrowRight size={14} /></Link>}>
          {activities.length ? (
            <ActivityBoard activities={activities} onOpen={openActivity} limit={4} controls={false} />
          ) : (
            <EmptyState title="Aucune activité publiée" text="Le pôle Logistique & Événementiel publie le calendrier depuis son espace." />
          )}
        </Card>

        <Card title="Missions à échéance" action={<Link to="/secretariat#missions" className="link-more">Tout voir <ArrowRight size={14} /></Link>}>
          {upcoming.length === 0 ? (
            <EmptyState title="Aucune mission ouverte" text="Les missions publiées par les pôles apparaissent ici." />
          ) : (
            <div className="rows">
              {upcoming.map((t) => {
                const d = dueLabel(t.due)
                return (
                  <div key={t.id} className="row-item mission">
                    <div style={{ minWidth: 0 }}>
                      <div className="row-item__title">{t.title}</div>
                      <div className="row-item__sub">
                        <PoleTag pole={t.pole} tone="line" />
                        <span>{t.assignee ?? poleById(t.pole).short}</span>
                      </div>
                    </div>
                    <span className={`due due--${d.tone}`}>{d.text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <ActivityDrawer id={params.get('activite')} onClose={closeActivity} />
      <MeetingDrawer meeting={meeting} open={agenda} onClose={() => setAgenda(false)} />
    </motion.div>
  )
}
