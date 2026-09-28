import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Lock } from 'lucide-react'
import { usePublishedRows } from '../lib/store'
import { useAuth } from '../lib/auth'
import { OPTIONS, optionOf } from '../lib/options'
import { publishedRate } from '../lib/derived'
import { ACADEMIC_MONTHS } from '../lib/poles'
import { currentMonth, formatCFA, monthLabel, monthShort, shortDate } from '../lib/dates'
import { PoleHeader } from '../components/PoleHeader'
import { Card, CountUp, EASE, EmptyState, Pill, stagger } from '../components/ui'

export function Finance() {
  const settings = usePublishedRows('settings')
  const transactions = usePublishedRows('transactions')
  const ideas = usePublishedRows('ideas')
  const partners = usePublishedRows('partners')
  const { canSeePrivate } = useAuth()

  const month = currentMonth() < ACADEMIC_MONTHS[0] ? ACADEMIC_MONTHS[0] : currentMonth()
  const monthly = ACADEMIC_MONTHS.map((m) => ({ m, r: publishedRate(settings, m) }))
  const anyPublished = monthly.some((x) => x.r && x.r.paid > 0)
  const current = monthly.find((x) => x.m === month)?.r

  const tx = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  const inSum = tx.filter((t) => t.kind === 'entree').reduce((s, t) => s + t.amount, 0)
  const outSum = tx.filter((t) => t.kind === 'sortie').reduce((s, t) => s + t.amount, 0)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <PoleHeader pole="finance" />

      <div className="grid-3-1">
        <Card title="Cotisations">
          <div className="sheet__row">
            <span className="kpi__sub">Taux de membres à jour, publié chaque mois par le pôle.</span>
            {current && <span className="sheet__count"><CountUp value={current.pct} suffix="%" /> en {monthLabel(month)}</span>}
          </div>
          {anyPublished ? (
            <div className="bars" role="img" aria-label="Taux de cotisation par mois">
              {monthly.map(({ m, r }, i) => (
                <div key={m} className="bars__col" title={r ? `${r.pct} %` : 'Pas encore publié'}>
                  {r && r.paid > 0 && <span className="bars__v">{r.pct}%</span>}
                  <motion.span
                    className={`bars__bar ${r && r.paid > 0 ? '' : 'bars__bar--empty'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${r && r.paid > 0 ? Math.max(r.pct, 4) : 4}%` }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.2 + i * 0.04 }}
                  />
                  <span className="bars__m">{monthShort(m)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Taux non publié" text="Le pôle Finance choisit de le publier ou non." />
          )}
          <p className="private-note">
            <Lock size={13} /> Le barème et le suivi par membre restent dans l’espace du pôle Finance.
            {canSeePrivate('finance') && <Link to="/admin/finance" className="link-more">Ouvrir <ArrowRight size={13} /></Link>}
          </p>
        </Card>

        <Card title="Relations extérieures">
          {partners.length === 0 ? (
            <EmptyState title="Aucun partenaire publié" />
          ) : (
            <div className="rows">
              {partners.map((p) => (
                <div key={p.id} className="row-item" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                  <div>
                    <div className="row-item__title">{p.name}</div>
                    <div className="row-item__sub">{optionOf(OPTIONS.partnerKind, p.kind)?.label}</div>
                  </div>
                  <Pill tone={optionOf(OPTIONS.partnerStatus, p.status)?.tone}>{optionOf(OPTIONS.partnerStatus, p.status)?.label}</Pill>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="stack" style={{ marginTop: 18 }}>
        <Card title="Autofinancement">
          {ideas.length === 0 ? (
            <EmptyState title="Aucune idée publiée pour l’instant" />
          ) : (
            <div className="idea-board">
              {ideas.map((i) => (
                <div key={i.id} className="idea">
                  <Pill tone={optionOf(OPTIONS.ideaStatus, i.status)?.tone}>{optionOf(OPTIONS.ideaStatus, i.status)?.label}</Pill>
                  <b>{i.title}</b>
                  {i.details && <p>{i.details}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {tx.length > 0 && (
          <Card title="Caisse">
            <div className="balance">
              <div><span className="kpi__label">Entrées</span><b>{formatCFA(inSum)}</b></div>
              <div><span className="kpi__label">Sorties</span><b>{formatCFA(outSum)}</b></div>
              <div><span className="kpi__label">Solde</span><b>{formatCFA(inSum - outSum)}</b></div>
            </div>
            <div className="rows" style={{ marginTop: 12 }}>
              {tx.slice(0, 5).map((t) => (
                <div key={t.id} className="row-item" style={{ gridTemplateColumns: '60px minmax(0,1fr) auto' }}>
                  <span className="mono-date">{shortDate(t.date)}</span>
                  <span className="row-item__title">{t.label}</span>
                  <span className={`amount ${t.kind === 'sortie' ? 'amount--out' : ''}`}>{t.kind === 'sortie' ? '−' : '+'}{formatCFA(t.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  )
}
