import { useCallback, useMemo } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Eye, Lock } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useRows } from '../lib/store'
import { COLLECTIONS, TASKS, type CollectionDef } from '../lib/collections'
import { COUNCIL, POLES, poleById } from '../lib/poles'
import type { PoleId, TableName } from '../lib/types'
import { CollectionAdmin } from '../components/CollectionAdmin'
import { AttendanceAdmin, ChecklistAdmin, ContributionsAdmin, FinanceSettings, MeetLinksAdmin, MembersExport } from '../components/AdminPanels'
import { Avatar, Button, EASE, EmptyState, PoleTag, rise, stagger } from '../components/ui'

type Tab =
  | { id: string; label: string; kind: 'collection'; def: CollectionDef }
  | { id: string; label: string; kind: 'checklist' | 'contributions' | 'finance-settings' | 'attendance' | 'meet-links'; table?: TableName }

const c = (key: string): Tab => ({ id: key, label: COLLECTIONS[key].label, kind: 'collection', def: COLLECTIONS[key] })
const tasks: Tab = { id: 'tasks', label: 'Tâches', kind: 'collection', def: TASKS }

const TABS: Record<PoleId, Tab[]> = {
  logistique: [c('activities'), tasks, { id: 'checklist', label: 'Check-lists', kind: 'checklist', table: 'checklist' }, c('incidents')],
  communication: [c('announcements'), c('visuals'), c('posts'), tasks],
  finance: [
    { id: 'contributions', label: 'Cotisations', kind: 'contributions', table: 'contributions' },
    c('transactions'), c('ideas'), c('partners'), tasks,
    { id: 'reglages', label: 'Réglages', kind: 'finance-settings' },
  ],
  secretariat: [
    c('meetings'), { id: 'meet', label: 'Liens Meet', kind: 'meet-links' },
    { id: 'attendance', label: 'Présences', kind: 'attendance', table: 'attendance' },
    c('minutes'), c('decisions'), c('members'), tasks,
  ],
}

const isPole = (p: string | undefined): p is PoleId => !!p && POLES.some((x) => x.id === p)

function TabCount({ table, pole }: { table: TableName; pole: PoleId }) {
  const rows = useRows(table)
  const n = rows.filter((r) => r.pole === pole).length
  return <span className="tab__count">{n}</span>
}

export function AdminIndex() {
  const { isSupervisor, profile } = useAuth()
  if (!isSupervisor) return <Navigate to={profile?.pole ? `/admin/${profile.pole}` : '/'} replace />
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={rise} className="page-head">
        <div>
          <h1>Espaces admin</h1>
          <p className="page-head__sub">Tu vois tout ce que chaque pôle gère, y compris ce qu’il garde privé. Seuls les présidents de pôle modifient.</p>
        </div>
      </motion.header>
      <div className="progress-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {POLES.map((p) => {
          const lead = COUNCIL.find((x) => x.pole === p.id)
          return (
            <motion.div key={p.id} variants={rise}>
              <Link to={`/admin/${p.id}`} className="progress-card" style={{ height: '100%' }}>
                <PoleTag pole={p.id} />
                <b style={{ fontSize: 20, fontStretch: '112%', fontWeight: 780 }}>{p.name}</b>
                {lead && <small style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={lead.full_name} size={24} tone="ink" />{lead.full_name}</small>}
                <span className="link-more" style={{ marginTop: 'auto' }}>Ouvrir <ArrowRight size={14} /></span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export function Admin() {
  const { pole: raw } = useParams()
  const { profile, isSupervisor, canEdit } = useAuth()
  const [params, setParams] = useSearchParams()
  const pole = isPole(raw) ? raw : null
  const tabs = useMemo(() => (pole ? TABS[pole] : []), [pole])
  const tabId = params.get('tab') ?? tabs[0]?.id
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0]
  const settings = useRows('settings')
  const clearEdit = useCallback(() => setParams((p) => { p.delete('edit'); return p }, { replace: true }), [setParams])

  if (!pole) return <EmptyState title="Pôle introuvable" text="Ce lien ne correspond à aucun pôle." />

  const allowed = isSupervisor || profile?.pole === pole
  if (!allowed) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: 36 }}>
        <Lock size={28} style={{ margin: '0 auto 14px' }} />
        <h1 className="card__title" style={{ fontSize: 22 }}>Espace réservé au pôle {poleById(pole).short}</h1>
        <p className="coll-help" style={{ margin: '10px auto 20px' }}>Chaque président de pôle ne peut agir que sur son propre pôle.</p>
        {profile?.pole && <Link to={`/admin/${profile.pole}`}><Button variant="solid">Aller à mon espace admin</Button></Link>}
      </div>
    )
  }

  const readOnly = !canEdit(pole)
  const caisseClosed = settings.some((s) => s.pole === 'finance' && s.key === 'caisse_supervisors' && s.value === 'false')
  const p = poleById(pole)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.header variants={rise} className="admin-head">
        <div>
          <h1 className="pole-title">{p.name}</h1>
          <div className="page-head__meta"><PoleTag pole={pole} tone={readOnly ? 'line' : 'gold'} /><span>Espace admin{readOnly ? ' · lecture seule' : ''}</span></div>
          <p className="page-head__sub">
            {readOnly
              ? 'Lecture seule : tu vois tout, y compris ce que le pôle garde privé.'
              : 'Tout ce que tu ajoutes ici appartient à ton pôle. L’interrupteur « Conseil » décide si c’est affiché dans la vue commune.'}
          </p>
        </div>
        <Link to={p.path}><Button variant="line" icon={<Eye size={16} />}>Voir la page du pôle</Button></Link>
      </motion.header>

      {readOnly && (
        <motion.div variants={rise} className="readonly-bar">
          <Lock size={16} /> <span><b>Lecture seule.</b> Seul le président du pôle {p.short} peut modifier ces éléments.</span>
        </motion.div>
      )}

      <motion.nav variants={rise} className="tabs" role="tablist" aria-label="Sections">
        {tabs.map((t) => {
          const on = t.id === tab.id
          const table = t.kind === 'collection' ? t.def.table : t.table
          return (
            <button key={t.id} role="tab" aria-selected={on} className={`tab ${on ? 'is-on' : ''}`} onClick={() => setParams({ tab: t.id })}>
              {t.label}
              {table && <TabCount table={table} pole={pole} />}
              {on && <motion.span layoutId="admin-tab" className="tab__line" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
            </button>
          )
        })}
      </motion.nav>

      <AnimatePresence mode="wait">
        <motion.div key={`${pole}-${tab.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3, ease: EASE }}>
          {tab.kind === 'collection' && tab.id === 'transactions' && readOnly && caisseClosed && (
            <div className="readonly-bar" style={{ marginBottom: 12 }}>
              <Lock size={16} /> <span><b>Caisse réservée au pôle Finance.</b> Seules les opérations publiées au conseil apparaissent ici.</span>
            </div>
          )}
          {tab.kind === 'collection' && (
            <CollectionAdmin def={tab.def} pole={pole} readOnly={readOnly} editId={params.get('edit')} onEditHandled={clearEdit} toolbar={tab.id === 'members' ? <MembersExport /> : undefined} />
          )}
          {tab.kind === 'meet-links' && <MeetLinksAdmin readOnly={readOnly} />}
          {tab.kind === 'checklist' && <ChecklistAdmin readOnly={readOnly} />}
          {tab.kind === 'contributions' && <ContributionsAdmin readOnly={readOnly} />}
          {tab.kind === 'finance-settings' && <FinanceSettings readOnly={readOnly} />}
          {tab.kind === 'attendance' && <AttendanceAdmin readOnly={readOnly} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
