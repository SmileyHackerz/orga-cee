import type { ReactNode } from 'react'
import type { Activity, BaseRow, PoleId, TableName } from './types'
import { OPTIONS, optionOf, type Option } from './options'
import { Pill, PoleTag } from '../components/ui'
import { dueLabel, formatCFA, fullDate, monthLabel, shortDate, capitalize, timeLabel } from './dates'

export type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'month' | 'number' | 'select' | 'member' | 'activity' | 'boolean' | 'poles'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: Option[]
  required?: boolean
  placeholder?: string
  hint?: string
  full?: boolean
}

export interface Ctx {
  activities: Map<string, Activity>
}

export interface Column {
  label: string
  render: (row: Record<string, unknown>, ctx: Ctx) => ReactNode
  width?: string
  hideSm?: boolean
}

export interface CollectionDef {
  table: TableName
  label: string
  singular: string
  newLabel: string
  defaultVisible: boolean
  /** Hide the per-item publish switch when the collection is always shared. */
  alwaysVisible?: boolean
  fields: FieldDef[]
  columns: Column[]
  title: (row: Record<string, unknown>) => string
  sort?: (a: Record<string, unknown>, b: Record<string, unknown>) => number
  defaults?: Record<string, unknown>
  help?: string
}

const pill = (list: Option[], v: unknown) => {
  const opt = optionOf(list, v as string)
  return opt ? <Pill tone={opt.tone}>{opt.label}</Pill> : null
}
function PoleTags({ poles }: { poles: PoleId[] }) {
  if (!poles.length) return <span className="dim">—</span>
  return <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>{poles.map((p) => <PoleTag key={p} pole={p} tone="line" />)}</span>
}
const txt = (v: unknown) => (v ? String(v) : <span className="dim">—</span>)
const due = (v: unknown) => {
  const d = dueLabel((v as string) ?? null)
  return <span className={`due due--${d.tone}`}>{d.text}</span>
}
const actName = (v: unknown, ctx: Ctx) => (v ? ctx.activities.get(v as string)?.title ?? '—' : <span className="dim">—</span>)
const byStr = (k: string, dir = 1) => (a: Record<string, unknown>, b: Record<string, unknown>) =>
  String(a[k] ?? '9999').localeCompare(String(b[k] ?? '9999')) * dir

export const TASKS: CollectionDef = {
  table: 'tasks',
  label: 'Tâches',
  singular: 'tâche',
  newLabel: 'Nouvelle tâche',
  defaultVisible: true,
  help: 'Les tâches affichées apparaissent dans le suivi des missions de tout le conseil.',
  fields: [
    { key: 'title', label: 'Tâche', type: 'text', required: true, full: true, placeholder: 'Ex. Réserver la salle' },
    { key: 'assignee', label: 'Responsable', type: 'member' },
    { key: 'due', label: 'Échéance', type: 'date' },
    { key: 'status', label: 'Statut', type: 'select', options: OPTIONS.taskStatus },
    { key: 'activity_id', label: 'Activité liée', type: 'activity' },
    { key: 'details', label: 'Précisions', type: 'textarea', full: true },
  ],
  defaults: { status: 'a_faire' },
  columns: [
    { label: 'Tâche', render: (r) => <strong>{String(r.title)}</strong> },
    { label: 'Responsable', render: (r) => txt(r.assignee), hideSm: true },
    { label: 'Échéance', render: (r) => (r.status === 'termine' ? <span className="due">Fait</span> : due(r.due)) },
    { label: 'Statut', render: (r) => pill(OPTIONS.taskStatus, r.status) },
  ],
  title: (r) => String(r.title),
  sort: byStr('due'),
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  activities: {
    table: 'activities',
    label: 'Activités',
    singular: 'activité',
    newLabel: 'Nouvelle activité',
    defaultVisible: true,
    help: 'Le calendrier de la Commission. Chaque activité a sa fiche détaillée et sa check-list.',
    fields: [
      { key: 'title', label: 'Nom de l’activité', type: 'text', required: true, full: true },
      { key: 'month', label: 'Mois', type: 'month', required: true },
      { key: 'status', label: 'Statut', type: 'select', options: OPTIONS.activityStatus },
      { key: 'date', label: 'Date', type: 'date', hint: 'Laisser vide tant qu’elle n’est pas fixée' },
      { key: 'time', label: 'Heure', type: 'time' },
      { key: 'place', label: 'Lieu', type: 'text', full: true },
      { key: 'objective', label: 'Objectif', type: 'textarea', full: true },
      { key: 'audience', label: 'Public', type: 'text' },
      { key: 'expected', label: 'Participants attendus', type: 'number' },
      { key: 'program', label: 'Déroulé', type: 'textarea', full: true, hint: 'Une étape par ligne' },
      { key: 'speakers', label: 'Intervenants', type: 'text', full: true },
      { key: 'lead', label: 'Responsable', type: 'member' },
    ],
    defaults: { status: 'preparation' },
    columns: [
      { label: 'Mois', render: (r) => <span className="mono-date">{capitalize(monthLabel(String(r.month), 'short'))}</span>, width: '120px' },
      { label: 'Activité', render: (r) => <strong>{String(r.title)}</strong> },
      { label: 'Date · lieu', render: (r) => (r.date ? `${shortDate(String(r.date))}${r.time ? ` · ${timeLabel(String(r.time))}` : ''}${r.place ? ` · ${r.place}` : ''}` : <span className="dim">À fixer</span>), hideSm: true },
      { label: 'Statut', render: (r) => pill(OPTIONS.activityStatus, r.status) },
    ],
    title: (r) => String(r.title),
    sort: byStr('month'),
  },
  tasks: TASKS,
  incidents: {
    table: 'incidents',
    label: 'Imprévus',
    singular: 'imprévu',
    newLabel: 'Signaler un imprévu',
    defaultVisible: true,
    help: 'Tout ce qui menace le bon déroulement d’une activité. Le signaler tôt, c’est le régler à temps.',
    fields: [
      { key: 'title', label: 'Problème', type: 'text', required: true, full: true },
      { key: 'activity_id', label: 'Activité concernée', type: 'activity' },
      { key: 'severity', label: 'Gravité', type: 'select', options: OPTIONS.severity },
      { key: 'status', label: 'Statut', type: 'select', options: OPTIONS.incidentStatus },
      { key: 'details', label: 'Détails et solution envisagée', type: 'textarea', full: true },
    ],
    defaults: { severity: 'moyenne', status: 'ouvert' },
    columns: [
      { label: 'Problème', render: (r) => <strong>{String(r.title)}</strong> },
      { label: 'Activité', render: (r, c) => actName(r.activity_id, c), hideSm: true },
      { label: 'Gravité', render: (r) => pill(OPTIONS.severity, r.severity) },
      { label: 'Statut', render: (r) => pill(OPTIONS.incidentStatus, r.status) },
    ],
    title: (r) => String(r.title),
  },
  announcements: {
    table: 'announcements',
    label: 'Annonces',
    singular: 'annonce',
    newLabel: 'Nouvelle annonce',
    defaultVisible: true,
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true, full: true },
      { key: 'body', label: 'Message', type: 'textarea', full: true },
      { key: 'audience', label: 'Destinataires', type: 'select', options: OPTIONS.audience },
      { key: 'status', label: 'Statut', type: 'select', options: OPTIONS.announcementStatus },
      { key: 'date', label: 'Date de publication', type: 'date' },
      { key: 'pinned', label: 'Épingler en haut', type: 'boolean' },
    ],
    defaults: { audience: 'commission', status: 'brouillon', pinned: false },
    columns: [
      { label: 'Annonce', render: (r) => <strong>{String(r.title)}</strong> },
      { label: 'Pour', render: (r) => optionOf(OPTIONS.audience, r.audience as string)?.label, hideSm: true },
      { label: 'Date', render: (r) => (r.date ? shortDate(String(r.date)) : <span className="dim">—</span>), hideSm: true },
      { label: 'Statut', render: (r) => pill(OPTIONS.announcementStatus, r.status) },
    ],
    title: (r) => String(r.title),
    sort: byStr('date', -1),
  },
  visuals: {
    table: 'visuals',
    label: 'Visuels',
    singular: 'visuel',
    newLabel: 'Nouveau visuel',
    defaultVisible: true,
    fields: [
      { key: 'title', label: 'Visuel', type: 'text', required: true, full: true },
      { key: 'activity_id', label: 'Activité', type: 'activity' },
      { key: 'assignee', label: 'Graphiste', type: 'member' },
      { key: 'due', label: 'À rendre le', type: 'date' },
      { key: 'status', label: 'Statut', type: 'select', options: OPTIONS.visualStatus },
      { key: 'link', label: 'Lien du fichier', type: 'text', full: true, placeholder: 'Lien Canva, Drive ou image', hint: 'Un lien direct vers une image affiche un aperçu.' },
    ],
    defaults: { status: 'a_faire' },
    columns: [
      { label: 'Visuel', render: (r) => <strong>{String(r.title)}</strong> },
      { label: 'Graphiste', render: (r) => txt(r.assignee), hideSm: true },
      { label: 'À rendre', render: (r) => (r.status === 'valide' ? <span className="due">Livré</span> : due(r.due)) },
      { label: 'Statut', render: (r) => pill(OPTIONS.visualStatus, r.status) },
    ],
    title: (r) => String(r.title),
    sort: byStr('due'),
  },
  posts: {
    table: 'posts',
    label: 'Planning',
    singular: 'publication',
    newLabel: 'Programmer une publication',
    defaultVisible: true,
    fields: [
      { key: 'content', label: 'Publication', type: 'text', required: true, full: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'channel', label: 'Canal', type: 'select', options: OPTIONS.channel },
      { key: 'status', label: 'Statut', type: 'select', options: OPTIONS.postStatus },
    ],
    defaults: { channel: 'whatsapp', status: 'prevu' },
    columns: [
      { label: 'Date', render: (r) => <span className="mono-date">{shortDate(String(r.date))}</span>, width: '110px' },
      { label: 'Publication', render: (r) => <strong>{String(r.content)}</strong> },
      { label: 'Canal', render: (r) => optionOf(OPTIONS.channel, r.channel as string)?.label, hideSm: true },
      { label: 'Statut', render: (r) => pill(OPTIONS.postStatus, r.status) },
    ],
    title: (r) => String(r.content),
    sort: byStr('date'),
  },
  transactions: {
    table: 'transactions',
    label: 'Caisse',
    singular: 'opération',
    newLabel: 'Nouvelle opération',
    defaultVisible: false,
    help: 'Entrées et sorties d’argent. Privées par défaut : publie seulement ce que le conseil doit voir.',
    fields: [
      { key: 'label', label: 'Libellé', type: 'text', required: true, full: true },
      { key: 'kind', label: 'Type', type: 'select', options: OPTIONS.txKind },
      { key: 'amount', label: 'Montant (F CFA)', type: 'number', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'category', label: 'Catégorie', type: 'text' },
    ],
    defaults: { kind: 'entree' },
    columns: [
      { label: 'Date', render: (r) => <span className="mono-date">{shortDate(String(r.date))}</span>, width: '100px' },
      { label: 'Libellé', render: (r) => <strong>{String(r.label)}</strong> },
      { label: 'Type', render: (r) => pill(OPTIONS.txKind, r.kind), hideSm: true },
      { label: 'Montant', render: (r) => <span className={`amount ${r.kind === 'sortie' ? 'amount--out' : ''}`}>{r.kind === 'sortie' ? '−' : '+'}{formatCFA(Number(r.amount))}</span> },
    ],
    title: (r) => String(r.label),
    sort: byStr('date', -1),
  },
  ideas: {
    table: 'ideas',
    label: 'Autofinancement',
    singular: 'idée',
    newLabel: 'Nouvelle idée',
    defaultVisible: true,
    fields: [
      { key: 'title', label: 'Idée', type: 'text', required: true, full: true },
      { key: 'details', label: 'Description', type: 'textarea', full: true },
      { key: 'status', label: 'Avancement', type: 'select', options: OPTIONS.ideaStatus },
      { key: 'budget', label: 'Budget estimé (F CFA)', type: 'number' },
      { key: 'revenue', label: 'Recettes (F CFA)', type: 'number' },
    ],
    defaults: { status: 'idee' },
    columns: [
      { label: 'Idée', render: (r) => <strong>{String(r.title)}</strong> },
      { label: 'Budget', render: (r) => (r.budget ? formatCFA(Number(r.budget)) : <span className="dim">—</span>), hideSm: true },
      { label: 'Avancement', render: (r) => pill(OPTIONS.ideaStatus, r.status) },
    ],
    title: (r) => String(r.title),
  },
  partners: {
    table: 'partners',
    label: 'Partenaires',
    singular: 'partenaire',
    newLabel: 'Nouveau partenaire',
    defaultVisible: true,
    fields: [
      { key: 'name', label: 'Nom', type: 'text', required: true },
      { key: 'organisation', label: 'Organisation', type: 'text' },
      { key: 'kind', label: 'Type', type: 'select', options: OPTIONS.partnerKind },
      { key: 'status', label: 'Relation', type: 'select', options: OPTIONS.partnerStatus },
      { key: 'contact', label: 'Contact', type: 'text', placeholder: 'Téléphone ou e-mail' },
      { key: 'last_contact', label: 'Dernier échange', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    ],
    defaults: { kind: 'alumni', status: 'a_contacter' },
    columns: [
      { label: 'Partenaire', render: (r) => <strong>{String(r.name)}</strong> },
      { label: 'Type', render: (r) => optionOf(OPTIONS.partnerKind, r.kind as string)?.label, hideSm: true },
      { label: 'Dernier échange', render: (r) => (r.last_contact ? shortDate(String(r.last_contact)) : <span className="dim">—</span>), hideSm: true },
      { label: 'Relation', render: (r) => pill(OPTIONS.partnerStatus, r.status) },
    ],
    title: (r) => String(r.name),
  },
  meetings: {
    table: 'meetings',
    label: 'Réunions',
    singular: 'réunion',
    newLabel: 'Programmer une réunion',
    defaultVisible: true,
    help: 'La prochaine réunion et son ordre du jour s’affichent en tête de la vue commune.',
    fields: [
      { key: 'audience', label: 'Type de réunion', type: 'select', options: OPTIONS.meetingAudience, full: true, hint: 'Le lien Meet correspondant (onglet Liens Meet) s’affiche automatiquement.' },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'time', label: 'Heure', type: 'time' },
      { key: 'place', label: 'Lieu', type: 'text', full: true, placeholder: 'Case CEE, ou En ligne' },
      { key: 'agenda', label: 'Ordre du jour', type: 'textarea', full: true, hint: 'Un point par ligne' },
    ],
    defaults: { audience: 'conseil', time: '18:00', place: 'Case CEE' },
    columns: [
      { label: 'Date', render: (r) => <strong>{capitalize(fullDate(String(r.date)))}</strong> },
      { label: 'Réunion', render: (r) => optionOf(OPTIONS.meetingAudience, (r.audience as string) ?? 'conseil')?.label, hideSm: true },
      { label: 'Heure', render: (r) => txt(timeLabel((r.time as string) ?? null)) },
      { label: 'Lieu', render: (r) => txt(r.place), hideSm: true },
      { label: 'Points', render: (r) => String(r.agenda ?? '').split('\n').filter(Boolean).length, hideSm: true },
    ],
    title: (r) => `Réunion du ${fullDate(String(r.date))}`,
    sort: byStr('date', -1),
  },
  minutes: {
    table: 'minutes',
    label: 'PV',
    singular: 'PV',
    newLabel: 'Nouveau PV',
    defaultVisible: true,
    fields: [
      { key: 'title', label: 'Titre', type: 'text', required: true, full: true },
      { key: 'meeting_date', label: 'Date de la réunion', type: 'date', required: true },
      { key: 'link', label: 'Lien du document', type: 'text', placeholder: 'Drive, PDF…' },
      { key: 'summary', label: 'Résumé', type: 'textarea', full: true },
      { key: 'body', label: 'Compte rendu complet', type: 'textarea', full: true },
    ],
    columns: [
      { label: 'Date', render: (r) => <span className="mono-date">{shortDate(String(r.meeting_date))}</span>, width: '100px' },
      { label: 'PV', render: (r) => <strong>{String(r.title)}</strong> },
      { label: 'Document', render: (r) => (r.link ? 'Lien joint' : <span className="dim">—</span>), hideSm: true },
    ],
    title: (r) => String(r.title),
    sort: byStr('meeting_date', -1),
  },
  decisions: {
    table: 'decisions',
    label: 'Décisions',
    singular: 'décision',
    newLabel: 'Inscrire une décision',
    defaultVisible: true,
    fields: [
      { key: 'number', label: 'N° au registre', type: 'number', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'title', label: 'Résolution', type: 'text', required: true, full: true },
      { key: 'details', label: 'Détails', type: 'textarea', full: true },
      { key: 'concerns', label: 'Concerne', type: 'select', options: OPTIONS.concerns },
      { key: 'status', label: 'Statut', type: 'select', options: OPTIONS.decisionStatus },
    ],
    defaults: { concerns: 'commission', status: 'adoptee' },
    columns: [
      { label: 'N°', render: (r) => <span className="mono-date">{String(r.number).padStart(3, '0')}</span>, width: '70px' },
      { label: 'Résolution', render: (r) => <strong>{String(r.title)}</strong> },
      { label: 'Date', render: (r) => shortDate(String(r.date)), hideSm: true },
      { label: 'Statut', render: (r) => pill(OPTIONS.decisionStatus, r.status) },
    ],
    title: (r) => `Décision n° ${r.number}`,
    sort: (a, b) => Number(b.number) - Number(a.number),
  },
  members: {
    table: 'members',
    label: 'Membres',
    singular: 'membre',
    newLabel: 'Ajouter un membre',
    defaultVisible: true,
    alwaysVisible: true,
    help: 'La liste des membres de la Commission sert aux tâches, aux présences et aux cotisations.',
    fields: [
      { key: 'name', label: 'Prénom et nom', type: 'text', required: true, full: true },
      { key: 'role', label: 'Rôle', type: 'select', options: OPTIONS.memberRole },
      { key: 'member_poles', label: 'Pôles', type: 'poles', full: true, hint: 'Un membre peut appartenir à plusieurs pôles.' },
      { key: 'phone', label: 'Téléphone (WhatsApp)', type: 'text', placeholder: '77 123 45 67' },
      { key: 'level', label: 'Niveau', type: 'text', placeholder: 'DUT 1 / L1' },
      { key: 'department', label: 'Département', type: 'text', placeholder: 'Informatique' },
    ],
    defaults: { role: 'membre', member_poles: [] },
    columns: [
      { label: 'Membre', render: (r) => <strong>{String(r.name)}</strong> },
      { label: 'Rôle', render: (r) => optionOf(OPTIONS.memberRole, r.role as string)?.label },
      { label: 'Pôles', render: (r) => <PoleTags poles={(r.member_poles as PoleId[]) ?? []} />, hideSm: true },
      { label: 'Téléphone', render: (r) => txt(r.phone), hideSm: true },
    ],
    title: (r) => String(r.name),
    sort: byStr('name'),
  },
}

export const asRecord = (r: BaseRow) => r as unknown as Record<string, unknown>
