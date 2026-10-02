import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, Download, MessageCircle, Minus, Plus, Search, Trash2, Video } from 'lucide-react'
import { useRows, useStore, type DataStore } from '../lib/store'
import type { Attendance, Contribution, MeetingAudience, MemberRole, PoleId, Setting } from '../lib/types'
import { ACADEMIC_MONTHS, MEMBER_ROLE } from '../lib/poles'
import { contributionRate, ratesFrom, setting } from '../lib/derived'
import { capitalize, currentMonth, formatCFA, fullDate, monthLabel, monthShort, todayISO } from '../lib/dates'
import { OPTIONS } from '../lib/options'
import { reminderMessage, waLink, waNumber } from '../lib/whatsapp'
import { exportContributions, exportMembers } from '../lib/exportExcel'
import { safeUrl } from '../lib/url'
import { Avatar, Button, CheckBox, EmptyState, Segmented, VisibilityToggle, useToast } from './ui'

/** Settings the council never needs to read: kept private to the owning pole (and supervisors). */
const PRIVATE_SETTINGS = new Set(['rates', 'wave_number'])

async function upsertSetting(store: DataStore, settings: Setting[], key: string, value: string, pole: PoleId = 'finance') {
  const existing = settings.find((s) => s.key === key && s.pole === pole)
  if (existing) {
    if (existing.value !== value) await store.update('settings', existing.id, { value })
  } else await store.insert('settings', { key, value, pole, visible: !PRIVATE_SETTINGS.has(key) })
}

/* ---------- export button ---------- */

export function ExportButton({ label, onExport }: { label: string; onExport: () => Promise<void> }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="line"
      icon={<Download size={16} />}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await onExport()
          toast('Fichier Excel téléchargé')
        } catch {
          toast('Export impossible', 'error')
        }
        setBusy(false)
      }}
    >
      {busy ? 'Préparation…' : label}
    </Button>
  )
}

export function MembersExport() {
  const members = useRows('members')
  return <ExportButton label="Exporter en Excel" onExport={() => exportMembers(members)} />
}

/* ---------- check-lists ---------- */

export function ChecklistAdmin({ readOnly }: { readOnly: boolean }) {
  const store = useStore()
  const toast = useToast()
  const activities = useRows('activities')
  const checklist = useRows('checklist')
  const members = useRows('members')
  const sorted = useMemo(() => [...activities].sort((a, b) => a.month.localeCompare(b.month)), [activities])
  const [actId, setActId] = useState<string>('')
  const [label, setLabel] = useState('')
  const [qty, setQty] = useState('')
  const [owner, setOwner] = useState('')

  useEffect(() => {
    if (!actId && sorted.length) setActId(sorted.find((a) => checklist.some((c) => c.activity_id === a.id))?.id ?? sorted[0].id)
  }, [actId, sorted, checklist])

  const items = checklist.filter((c) => c.activity_id === actId)
  const done = items.filter((i) => i.done).length

  const add = async () => {
    if (!label.trim() || !actId) return
    try {
      await store.insert('checklist', { activity_id: actId, label: label.trim(), quantity: qty ? Number(qty) : null, owner: owner || null, done: false, pole: 'logistique', visible: true })
      setLabel('')
      setQty('')
    } catch {
      toast('Ajout impossible', 'error')
    }
  }

  if (!activities.length) return <EmptyState title="Ajoute d’abord une activité" text="Chaque check-list est rattachée à une activité du calendrier." />

  return (
    <div className="card">
      <div className="coll-bar">
        <label className="field" style={{ minWidth: 'min(360px, 100%)' }}>
          <span>Activité</span>
          <select className="input" value={actId} onChange={(e) => setActId(e.target.value)}>
            {sorted.map((a) => <option key={a.id} value={a.id}>{a.title} · {capitalize(monthLabel(a.month, 'short'))}</option>)}
          </select>
        </label>
        {items.length > 0 && <span className="sheet__count">{done}/{items.length} prêts</span>}
      </div>
      {items.length > 0 && <span className="meter" style={{ marginBottom: 10 }}><motion.i animate={{ width: `${(done / items.length) * 100}%` }} transition={{ duration: 0.6 }} /></span>}

      {items.length === 0 ? (
        <EmptyState title="Check-list vide" text="Chaises, tables, micros, rallonges, eau, badges… ajoute chaque besoin avec sa quantité et son responsable." />
      ) : (
        <ul className="checklist">
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <motion.li key={c.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={c.done ? 'is-done' : ''} style={{ gridTemplateColumns: '22px 1fr auto auto 36px' }}>
                <CheckBox checked={c.done} label={c.label} disabled={readOnly} onChange={(v) => store.update('checklist', c.id, { done: v }).catch(() => toast('Modification impossible', 'error'))} />
                <span className="checklist__label">{c.label}</span>
                {c.quantity ? <span className="checklist__qty">× {c.quantity}</span> : <span />}
                <span className="checklist__owner">{c.owner}</span>
                {!readOnly ? (
                  <button className="icon-btn" aria-label={`Retirer ${c.label}`} onClick={() => store.remove('checklist', c.id).catch(() => toast('Suppression impossible', 'error'))}>
                    <Trash2 size={15} />
                  </button>
                ) : <span />}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {!readOnly && (
        <form className="inline-add" onSubmit={(e) => { e.preventDefault(); void add() }}>
          <input className="input" placeholder="Matériel ou besoin (ex. Rallonges)" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Matériel" />
          <input className="input" type="number" min={0} placeholder="Qté" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantité" />
          <select className="input" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Responsable">
            <option value="">Responsable</option>
            {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
          <Button variant="solid" type="submit" icon={<Plus size={16} />} disabled={!label.trim()}>Ajouter</Button>
        </form>
      )}
    </div>
  )
}

/* ---------- cotisations ---------- */

export function ContributionsAdmin({ readOnly }: { readOnly: boolean }) {
  const store = useStore()
  const toast = useToast()
  const members = useRows('members')
  const contributions = useRows('contributions')
  const settings = useRows('settings')
  const rates = ratesFrom(settings)
  const wave = setting(settings, 'wave_number')
  const sortedMembers = useMemo(() => [...members].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [members])
  const [pending, setPending] = useState<string | null>(null)
  const [view, setView] = useState<'mois' | 'annee'>('mois')
  const [monthIndex, setMonthIndex] = useState(() => Math.max(0, ACADEMIC_MONTHS.indexOf(currentMonth())))
  const [filter, setFilter] = useState<'relancer' | 'payes' | 'tous'>('relancer')
  const [q, setQ] = useState('')
  const month = ACADEMIC_MONTHS[monthIndex]

  const find = (memberId: string, m: string) => contributions.find((c) => c.member_id === memberId && c.month === m)

  // Aggregates are stored only while the pole publishes them, and are recomputed from the store's
  // latest rows so two quick clicks never publish a stale count.
  const publish = async (m: string) => {
    if (setting(store.get('settings') as Setting[], 'publish_rate') !== 'true') return
    const r = contributionRate(members, store.get('contributions') as Contribution[], m)
    if (r) await upsertSetting(store, store.get('settings') as Setting[], `rate:${m}`, JSON.stringify({ paid: r.paid, total: r.total }))
  }

  const toggle = async (memberId: string, role: MemberRole, m: string) => {
    const key = `${memberId}:${m}`
    setPending(key)
    try {
      const existing = find(memberId, m)
      if (existing) await store.remove('contributions', existing.id)
      else await store.insert('contributions', { member_id: memberId, month: m, amount: rates[role], method: 'wave', paid_on: todayISO(), pole: 'finance', visible: false })
      await publish(m)
    } catch {
      toast('Enregistrement impossible. Vérifie ta connexion.', 'error')
    }
    setPending(null)
  }

  if (!members.length) return <EmptyState title="Aucun membre" text="Le Secrétariat tient la liste des membres ; elle apparaîtra ici." />

  const paidIds = new Set(contributions.filter((c) => c.month === month).map((c) => c.member_id))
  const paidCount = sortedMembers.filter((m) => paidIds.has(m.id)).length
  const collected = contributions.filter((c) => c.month === month).reduce((s, c) => s + c.amount, 0)
  const pct = Math.round((paidCount / sortedMembers.length) * 100)
  const needle = q.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const shown = sortedMembers.filter((m) => {
    const paid = paidIds.has(m.id)
    if (filter === 'relancer' && paid) return false
    if (filter === 'payes' && !paid) return false
    return !needle || m.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(needle)
  })

  return (
    <div className="contrib">
      <div className="contrib__top">
        <p className="contrib__rules">
          Barème : <b>{formatCFA(rates.membre)}</b> membre · <b>{formatCFA(rates.chef_pole)}</b> chef de pôle / secrétaire · <b>{formatCFA(rates.president)}</b> président / adjoint
          {wave && <> · Wave <b>{wave}</b></>}
        </p>
        <div className="contrib__view">
          <Segmented size="sm" label="Affichage" value={view} onChange={setView} options={[{ value: 'mois', label: 'Par mois' }, { value: 'annee', label: 'Année' }]} />
        </div>
      </div>

      {view === 'mois' ? (
        <>
          <section className="month-card" aria-label="Résumé du mois">
            <div className="month-card__nav">
              <button className="step-btn" onClick={() => setMonthIndex((i) => Math.max(0, i - 1))} disabled={monthIndex === 0} aria-label="Mois précédent">
                <ChevronLeft size={20} />
              </button>
              <h3 aria-live="polite">{capitalize(monthLabel(month))}</h3>
              <button className="step-btn" onClick={() => setMonthIndex((i) => Math.min(ACADEMIC_MONTHS.length - 1, i + 1))} disabled={monthIndex === ACADEMIC_MONTHS.length - 1} aria-label="Mois suivant">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="month-card__stats">
              <div><b className="tabular">{paidCount}<span> / {sortedMembers.length}</span></b><small>membres à jour</small></div>
              <div><b className="tabular">{formatCFA(collected)}</b><small>encaissés</small></div>
            </div>
            <span className="month-card__meter" aria-hidden><motion.i animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} /></span>
          </section>

          <div className="contrib__tools">
            <Segmented
              label="Filtrer les membres"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'relancer', label: 'À relancer', count: sortedMembers.length - paidCount },
                { value: 'payes', label: 'Payés', count: paidCount },
                { value: 'tous', label: 'Tous' },
              ]}
            />
            <label className="searchbox">
              <Search size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un membre" aria-label="Rechercher un membre" />
            </label>
          </div>

          {shown.length === 0 ? (
            filter === 'relancer' && !needle ? (
              <div className="all-paid">
                <span className="all-paid__icon"><Check size={22} strokeWidth={2.6} /></span>
                <div>
                  <b>Tout le monde est à jour pour {monthLabel(month)}.</b>
                  <p>Aucune relance à envoyer ce mois-ci.</p>
                </div>
              </div>
            ) : (
              <EmptyState title="Aucun membre trouvé" text="Essaie un autre nom ou un autre filtre." />
            )
          ) : (
            <ul className="pay-list">
              {shown.map((m) => {
                const paid = paidIds.has(m.id)
                const key = `${m.id}:${month}`
                const number = waNumber(m.phone)
                return (
                  <li key={m.id} className={`pay-row ${paid ? 'is-paid' : ''}`}>
                    <Avatar name={m.name} size={36} tone={paid ? 'ink' : 'stone'} />
                    <div className="pay-row__who">
                      <b>{m.name}</b>
                      <small>{MEMBER_ROLE[m.role]} · {formatCFA(rates[m.role])}</small>
                    </div>
                    <div className="pay-row__actions">
                      {!paid && (number ? (
                        <a className="wa-btn" href={waLink(number, reminderMessage(m.name, month, rates[m.role], wave))} target="_blank" rel="noreferrer" aria-label={`Relancer ${m.name} sur WhatsApp`} title="Relancer sur WhatsApp">
                          <MessageCircle size={19} />
                        </a>
                      ) : (
                        <span className="wa-btn is-off" title="Numéro manquant : à ajouter dans Membres" aria-label="Numéro WhatsApp manquant"><MessageCircle size={19} /></span>
                      ))}
                      <button
                        className={`pay-toggle ${paid ? 'is-on' : ''}`}
                        aria-pressed={paid}
                        disabled={readOnly || pending === key}
                        onClick={() => toggle(m.id, m.role, month)}
                        aria-label={`${m.name} : ${paid ? 'payé — appuyer pour annuler' : 'marquer comme payé'}`}
                        title={paid ? 'Appuyer pour annuler' : undefined}
                      >
                        {pending === key ? <span className="pay-toggle__spin" aria-hidden /> : paid ? <Check size={16} strokeWidth={3} /> : null}
                        <span>{paid ? 'Payé' : 'Marquer payé'}</span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="card">
          <div className="money-wrap">
            <table className="money-grid">
              <thead>
                <tr>
                  <th>Membre</th>
                  {ACADEMIC_MONTHS.map((m) => <th key={m}>{monthShort(m)}</th>)}
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span>{m.name}<small>{MEMBER_ROLE[m.role]} · {formatCFA(rates[m.role])}</small></span>
                    </td>
                    {ACADEMIC_MONTHS.map((mo) => {
                      const paid = !!find(m.id, mo)
                      const key = `${m.id}:${mo}`
                      return (
                        <td key={mo}>
                          <button
                            className={`cell-btn ${paid ? 'is-paid' : ''}`}
                            disabled={readOnly || pending === key}
                            aria-pressed={paid}
                            aria-label={`${m.name}, ${monthLabel(mo)} : ${paid ? 'payé' : 'non payé'}`}
                            onClick={() => toggle(m.id, m.role, mo)}
                          >
                            {paid ? <Check size={15} strokeWidth={3} /> : <Minus size={14} />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total encaissé</td>
                  {ACADEMIC_MONTHS.map((mo) => {
                    const sum = contributions.filter((c) => c.month === mo).reduce((s, c) => s + c.amount, 0)
                    return <td key={mo} className="tabular">{sum ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(sum) : '—'}</td>
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="contrib__foot">
        <p>Le détail reste privé au pôle Finance. Seul le taux global est publié au conseil, si tu l’actives dans Réglages.</p>
        <ExportButton label="Exporter l’année en Excel" onExport={() => exportContributions(members, contributions, rates)} />
      </div>
    </div>
  )
}

/* ---------- meet links (secretariat) ---------- */

const MEET_KEYS: { audience: MeetingAudience; label: string }[] = OPTIONS.meetingAudience.map((o) => ({ audience: o.value as MeetingAudience, label: o.label }))

export function MeetLinksAdmin({ readOnly }: { readOnly: boolean }) {
  const store = useStore()
  const toast = useToast()
  const settings = useRows('settings')
  const [links, setLinks] = useState<Record<string, string>>(() =>
    Object.fromEntries(MEET_KEYS.map((k) => [k.audience, settings.find((s) => s.pole === 'secretariat' && s.key === `meet_${k.audience}`)?.value ?? ''])),
  )
  const invalid = MEET_KEYS.filter((k) => links[k.audience].trim() && !safeUrl(links[k.audience]))

  const save = async () => {
    if (invalid.length) return
    try {
      for (const k of MEET_KEYS) await upsertSetting(store, settings, `meet_${k.audience}`, links[k.audience].trim(), 'secretariat')
      toast('Liens enregistrés')
    } catch {
      toast('Enregistrement impossible', 'error')
    }
  }

  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <p className="coll-help" style={{ marginBottom: 18 }}>
        Un lien fixe par type de réunion. Il s’affiche automatiquement sur chaque réunion du même type, avec un bouton « Rejoindre ».
      </p>
      <div className="form" style={{ gridTemplateColumns: '1fr' }}>
        {MEET_KEYS.map((k) => (
          <label key={k.audience} className="field">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Video size={15} />{k.label}</span>
            <input className="input" type="url" inputMode="url" placeholder="https://meet.google.com/abc-defg-hij" disabled={readOnly} value={links[k.audience]} onChange={(e) => setLinks((l) => ({ ...l, [k.audience]: e.target.value }))} />
          </label>
        ))}
        {invalid.length > 0 && <p className="form-error">Lien invalide pour : {invalid.map((k) => k.label).join(', ')}. Il doit commencer par https://</p>}
      </div>
      {!readOnly && (
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="solid" onClick={save} disabled={invalid.length > 0}>Enregistrer les liens</Button>
        </div>
      )}
    </div>
  )
}

/* ---------- finance settings ---------- */

export function FinanceSettings({ readOnly }: { readOnly: boolean }) {
  const store = useStore()
  const toast = useToast()
  const settings = useRows('settings')
  const members = useRows('members')
  const contributions = useRows('contributions')
  const [wave, setWave] = useState(setting(settings, 'wave_number') ?? '')
  const [rates, setRates] = useState(() => ratesFrom(settings))
  const published = setting(settings, 'publish_rate') === 'true'
  const caisseOpen = setting(settings, 'caisse_supervisors') !== 'false'

  const toggleCaisse = async (v: boolean) => {
    try {
      await upsertSetting(store, settings, 'caisse_supervisors', v ? 'true' : 'false')
      toast(v ? 'Caisse visible par le président et l’adjoint' : 'Caisse réservée au pôle Finance')
    } catch {
      toast('Modification impossible', 'error')
    }
  }

  const save = async () => {
    try {
      await upsertSetting(store, settings, 'wave_number', wave.trim())
      await upsertSetting(store, settings, 'rates', JSON.stringify(rates))
      toast('Réglages enregistrés')
    } catch {
      toast('Enregistrement impossible', 'error')
    }
  }

  const togglePublish = async (v: boolean) => {
    try {
      await upsertSetting(store, settings, 'publish_rate', v ? 'true' : 'false')
      if (v) {
        for (const m of ACADEMIC_MONTHS) {
          const r = contributionRate(members, contributions, m)
          if (r && r.paid) await upsertSetting(store, store.get('settings') as Setting[], `rate:${m}`, JSON.stringify({ paid: r.paid, total: r.total }))
        }
      } else {
        // Unpublishing must also remove the stored aggregates: the council can still read them through the API.
        const stored = (store.get('settings') as Setting[]).filter((s) => s.pole === 'finance' && s.key.startsWith('rate:'))
        for (const s of stored) await store.remove('settings', s.id)
      }
      toast(v ? 'Taux publié dans la vue commune' : 'Taux masqué au conseil')
    } catch {
      toast('Modification impossible', 'error')
    }
  }

  return (
    <div className="settings-list">
      <div className="setting-row">
        <div>
          <b>Publier le taux de cotisation</b>
          <p>Le conseil voit le pourcentage de membres à jour chaque mois, jamais le détail par personne.</p>
        </div>
        <VisibilityToggle visible={published} onChange={togglePublish} disabled={readOnly} />
      </div>
      <div className="setting-row">
        <div>
          <b>Caisse visible par le président et l’adjoint</b>
          <p>Activé : Jacques et Mohamed peuvent consulter toutes les opérations de la caisse, en lecture seule. Désactivé : ils ne voient que les opérations que tu publies au conseil.</p>
        </div>
        <VisibilityToggle visible={caisseOpen} onChange={toggleCaisse} disabled={readOnly} />
      </div>
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 14 }}>Montants et versement</h3>
        <div className="form">
          <label className="field field--full">
            <span>Numéro Wave</span>
            <input className="input" value={wave} disabled={readOnly} onChange={(e) => setWave(e.target.value)} />
          </label>
          <div className="field field--full">
            <span>Montant mensuel par rôle (F CFA)</span>
            <div className="rate-inputs">
              {(Object.keys(rates) as MemberRole[]).map((role) => (
                <label key={role} className="field">
                  <small>{MEMBER_ROLE[role]}</small>
                  <input className="input" type="number" min={0} disabled={readOnly} value={rates[role]} onChange={(e) => setRates((r) => ({ ...r, [role]: Number(e.target.value) }))} />
                </label>
              ))}
            </div>
          </div>
        </div>
        {!readOnly && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="solid" onClick={save}>Enregistrer les réglages</Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- attendance ---------- */

export function AttendanceAdmin({ readOnly }: { readOnly: boolean }) {
  const store = useStore()
  const toast = useToast()
  const meetings = useRows('meetings')
  const members = useRows('members')
  const attendance = useRows('attendance')
  const sorted = useMemo(() => [...meetings].sort((a, b) => b.date.localeCompare(a.date)), [meetings])
  const [meetingId, setMeetingId] = useState('')

  useEffect(() => {
    if (!meetingId && sorted.length) setMeetingId((sorted.find((m) => m.date <= todayISO()) ?? sorted[0]).id)
  }, [meetingId, sorted])

  const council = useMemo(() => [...members].sort((a, b) => a.name.localeCompare(b.name)), [members])
  const statusOf = (memberId: string) => attendance.find((a) => a.meeting_id === meetingId && a.member_id === memberId)

  const mark = async (memberId: string, status: Attendance['status']) => {
    const existing = statusOf(memberId)
    try {
      if (existing) await store.update('attendance', existing.id, { status })
      else await store.insert('attendance', { meeting_id: meetingId, member_id: memberId, status, pole: 'secretariat', visible: true })
    } catch {
      toast('Enregistrement impossible', 'error')
    }
  }

  const [bulk, setBulk] = useState(false)
  const markRest = async () => {
    setBulk(true)
    const rest = council.filter((m) => !statusOf(m.id))
    try {
      for (const m of rest) await store.insert('attendance', { meeting_id: meetingId, member_id: m.id, status: 'present', pole: 'secretariat', visible: true })
      toast(`${rest.length} membres marqués présents`)
    } catch {
      toast('Enregistrement interrompu. Réessaie.', 'error')
    }
    setBulk(false)
  }

  if (!meetings.length) return <EmptyState title="Aucune réunion" text="Programme une réunion dans l’onglet Réunions pour y noter les présences." />

  const counts = { present: 0, excuse: 0, absent: 0 }
  council.forEach((m) => {
    const s = statusOf(m.id)?.status
    if (s) counts[s]++
  })

  return (
    <div className="card">
      <div className="coll-bar">
        <label className="field" style={{ minWidth: 'min(360px, 100%)' }}>
          <span>Réunion</span>
          <select className="input" value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
            {sorted.map((m) => <option key={m.id} value={m.id}>{capitalize(fullDate(m.date))}{m.place ? ` · ${m.place}` : ''}</option>)}
          </select>
        </label>
        <div className="legend">
          <span><i className="dot dot--present" />{counts.present} présents</span>
          <span><i className="dot dot--excuse" />{counts.excuse} excusés</span>
          <span><i className="dot dot--absent" />{counts.absent} absents</span>
        </div>
      </div>
      {!readOnly && council.some((m) => !statusOf(m.id)) && (
        <div className="bulk-bar">
          <span>{council.filter((m) => !statusOf(m.id)).length} membres non renseignés</span>
          <Button variant="solid" size="sm" icon={<Check size={15} />} disabled={bulk} onClick={markRest}>
            {bulk ? 'Enregistrement…' : 'Marquer tous présents'}
          </Button>
        </div>
      )}
      <div className="attendance-list">
        {council.map((m) => {
          const s = statusOf(m.id)?.status
          return (
            <div key={m.id} className="attendance-row">
              <Avatar name={m.name} size={30} tone="stone" />
              <span className="row-item__title">{m.name}</span>
              {readOnly ? (
                <span className="dim">{s ? { present: 'Présent', excuse: 'Excusé', absent: 'Absent' }[s] : '—'}</span>
              ) : (
                <Segmented<Attendance['status'] | 'none'>
                  size="sm"
                  label={`Présence de ${m.name}`}
                  value={s ?? 'none'}
                  onChange={(v) => v !== 'none' && mark(m.id, v)}
                  options={[
                    { value: 'present', label: 'Présent' },
                    { value: 'excuse', label: 'Excusé' },
                    { value: 'absent', label: 'Absent' },
                  ]}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
