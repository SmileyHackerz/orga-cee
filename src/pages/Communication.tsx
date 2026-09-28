import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Camera, ExternalLink, Image as ImageIcon, MessageCircle, Newspaper, Pin, Share2 } from 'lucide-react'
import { usePublishedRows } from '../lib/store'
import { OPTIONS, optionOf } from '../lib/options'
import { byDue, isOpen } from '../lib/derived'
import { dueLabel, parseISODate, shortDate, todayISO } from '../lib/dates'
import type { Post } from '../lib/types'
import { PoleHeader } from '../components/PoleHeader'
import { Card, EASE, EmptyState, Pill, Segmented, stagger } from '../components/ui'
import { safeUrl } from '../lib/url'

const CHANNEL_ICON: Record<Post['channel'], typeof Share2> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  facebook: Share2,
  affiche: Newspaper,
  autre: Share2,
}

const isImage = (url: string | null) => !!url && /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(url)

export function Communication() {
  const announcements = usePublishedRows('announcements')
  const visuals = usePublishedRows('visuals')
  const posts = usePublishedRows('posts')
  const tasks = usePublishedRows('tasks')
  const activities = usePublishedRows('activities')
  const [audience, setAudience] = useState<'tous' | 'commission' | 'cee' | 'eleves'>('tous')

  const feed = useMemo(
    () =>
      announcements
        .filter((a) => audience === 'tous' || a.audience === audience)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.date ?? '').localeCompare(a.date ?? '')),
    [announcements, audience],
  )
  const upcoming = posts.filter((p) => p.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date))
  const comTasks = tasks.filter((t) => t.pole === 'communication' && isOpen(t)).sort(byDue)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <PoleHeader pole="communication" />

      <div className="grid-3-1">
        <Card
          title="Annonces"
          action={
            <Segmented
              size="sm"
              label="Destinataires"
              value={audience}
              onChange={setAudience}
              options={[
                { value: 'tous', label: 'Toutes' },
                { value: 'commission', label: 'Commission' },
                { value: 'cee', label: 'CEE' },
                { value: 'eleves', label: 'Élèves' },
              ]}
            />
          }
        >
          {feed.length === 0 ? (
            <EmptyState title="Aucune annonce" text="Les annonces publiées par le pôle Communication apparaissent ici." />
          ) : (
            <div className="feed">
              {feed.map((a, i) => {
                const d = a.date ? parseISODate(a.date) : null
                const st = optionOf(OPTIONS.announcementStatus, a.status)
                return (
                  <motion.article key={a.id} className="feed__item" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease: EASE }}>
                    <div className="feed__date">
                      {d ? (
                        <>
                          <b>{String(d.getDate()).padStart(2, '0')}</b>
                          <span>{d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</span>
                        </>
                      ) : (
                        <span>Sans date</span>
                      )}
                    </div>
                    <div>
                      <h3 className="feed__title">
                        {a.title}
                        {a.pinned && <span className="pin"><Pin size={12} /> Épinglée</span>}
                        {a.status !== 'publiee' && <Pill tone={st?.tone}>{st?.label}</Pill>}
                      </h3>
                      {a.body && <p className="feed__body">{a.body}</p>}
                      <p className="row-item__sub" style={{ marginTop: 10 }}>Pour : {optionOf(OPTIONS.audience, a.audience)?.label}</p>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </Card>

        <div className="stack">
          <Card title="Planning de publication">
            {upcoming.length === 0 ? (
              <EmptyState title="Rien de programmé" text="Programme les prochaines publications depuis l’espace admin." />
            ) : (
              <div className="rows">
                {upcoming.map((p) => {
                  const Icon = CHANNEL_ICON[p.channel]
                  return (
                    <div key={p.id} className="row-item" style={{ gridTemplateColumns: '64px minmax(0,1fr) auto' }}>
                      <span className="mono-date">{shortDate(p.date)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="row-item__title">{p.content}</div>
                        <div className="row-item__sub"><span className="channel"><Icon size={14} />{optionOf(OPTIONS.channel, p.channel)?.label}</span></div>
                      </div>
                      <Pill tone={optionOf(OPTIONS.postStatus, p.status)?.tone}>{optionOf(OPTIONS.postStatus, p.status)?.label}</Pill>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Tâches du pôle">
            {comTasks.length === 0 ? (
              <EmptyState title="Aucune tâche ouverte" />
            ) : (
              <div className="rows">
                {comTasks.map((t) => {
                  const d = dueLabel(t.due)
                  return (
                    <div key={t.id} className="row-item" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                      <div>
                        <div className="row-item__title">{t.title}</div>
                        <div className="row-item__sub">{t.assignee ?? 'Non attribuée'}</div>
                      </div>
                      <span className={`due due--${d.tone}`}>{d.text}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Visuels">
          {visuals.length === 0 ? (
            <EmptyState title="Aucun visuel" text="Affiches, stories, bannières : suis leur avancement ici." />
          ) : (
            <div className="visual-grid">
              {visuals.map((v, i) => {
                const st = optionOf(OPTIONS.visualStatus, v.status)
                const d = dueLabel(v.due)
                const act = activities.find((a) => a.id === v.activity_id)
                const link = safeUrl(v.link)
                return (
                  <motion.div key={v.id} className="visual" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }} whileHover={{ y: -4 }}>
                    <div className="visual__art">
                      {isImage(link) ? <img src={link!} alt={v.title} loading="lazy" /> : link ? <ImageIcon size={34} strokeWidth={1.4} /> : <span>{(act?.title ?? v.title).split(' ').slice(0, 2).join(' ')}</span>}
                    </div>
                    <div className="visual__body">
                      <b>{v.title}</b>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <Pill tone={st?.tone}>{st?.label}</Pill>
                        {v.status !== 'valide' && <span className={`due due--${d.tone}`}>{d.text}</span>}
                      </div>
                      {link && (
                        <a className="link-more" href={link} target="_blank" rel="noreferrer">
                          Ouvrir le fichier <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  )
}

