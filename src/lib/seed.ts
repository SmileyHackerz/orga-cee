import type { BaseRow, PoleId, TableName } from './types'
import { addDays, currentMonth, parseISODate, todayISO } from './dates'
import { DEFAULT_RATES } from './poles'

let n = 0
const id = (p: string) => `${p}-${(++n).toString(36).padStart(3, '0')}`

function row(pole: PoleId, visible: boolean, data: Record<string, unknown>, prefix: string): BaseRow {
  const now = new Date().toISOString()
  return { id: id(prefix), pole, visible, created_at: now, updated_at: now, ...data } as BaseRow
}

function nextSaturday(from: string) {
  const d = parseISODate(from)
  const add = (6 - d.getDay() + 7) % 7 || 7
  return addDays(from, add)
}

export function buildSeed(): Partial<Record<TableName, BaseRow[]>> {
  n = 0
  const today = todayISO()
  const nextMeeting = nextSaturday(today)
  const lastMeeting = addDays(nextMeeting, -7)

  const council = [
    { name: 'Jacques Sambou', role: 'president', member_poles: ['logistique', 'communication', 'finance'] },
    { name: 'Mohamed Faye', role: 'adjoint', member_poles: ['logistique', 'communication', 'finance'] },
    { name: 'Cheikh Beye', role: 'secretaire', member_poles: ['secretariat'] },
    { name: 'Pape Samba Ba', role: 'chef_pole', member_poles: ['communication'] },
    { name: 'Aïcha Diagana', role: 'chef_pole', member_poles: ['logistique'] },
    { name: 'Viviane Gnacadja', role: 'chef_pole', member_poles: ['finance'] },
  ]
  const others = [
    { name: 'Awa Ndiaye', role: 'membre', member_poles: ['logistique'] },
    { name: 'Moussa Diop', role: 'membre', member_poles: ['logistique'] },
    { name: 'Fatou Sarr', role: 'membre', member_poles: ['communication'] },
    { name: 'Ibrahima Fall', role: 'membre', member_poles: ['communication'] },
    { name: 'Khady Mbaye', role: 'membre', member_poles: ['finance'] },
    { name: 'Ousmane Sy', role: 'membre', member_poles: ['logistique'] },
    { name: 'Mariama Ba', role: 'membre', member_poles: ['secretariat'] },
    { name: 'Serigne Gaye', role: 'membre', member_poles: ['finance'] },
  ]
  const members = [...council, ...others].map((m) => row('secretariat', true, { ...m, phone: null, level: null, department: null }, 'mem'))

  const act = (month: string, title: string, status: string, extra: Record<string, unknown> = {}) =>
    row('logistique', true, {
      title, month, status, date: null, time: null, place: null, objective: null, audience: null,
      expected: null, program: null, speakers: null, lead: 'Aïcha Diagana', ...extra,
    }, 'act')

  const integrations = act('2026-10', 'Intégrations communales', 'preparation', {
    objective: 'Accueillir les nouveaux élèves et les faire rencontrer les étudiants de leur commune.',
    audience: 'Nouveaux élèves et étudiants de l’ESP, regroupés par commune',
    expected: 250,
    program: "Accueil et badges\nMot du président du CEE\nPrésentation des amicales de communes\nJeux et rencontres par commune\nCollation et photo de groupe",
    speakers: 'Président du CEE, responsables des amicales',
    place: 'À confirmer avec l’administration',
  })
  const activities = [
    integrations,
    act('2026-11', 'XXXX — nom à trouver', 'preparation', { objective: 'Activité de novembre : le nom et le concept restent à définir en réunion.' }),
    act('2026-12', 'Kermesse de Noël', 'preparation', { objective: 'Stands, jeux et restauration pour clôturer le premier semestre.' }),
    act('2027-01', 'Feu d’artifice + fête du nouvel an', 'prete'),
    act('2027-02', 'Saint-Valentin avec CLAC', 'probleme', { objective: 'Soirée organisée avec le club CLAC.' }),
    act('2027-03', 'Royal Ndogou', 'preparation', { objective: 'Rupture du jeûne partagée pendant le Ramadan.' }),
    act('2027-04', 'Ngalakh Time', 'preparation'),
    act('2027-05', 'Semaine polytechnicienne', 'preparation'),
    act('2027-06', 'Soirées polytechniciennes', 'preparation'),
    act('2027-07', 'Bye Bye Campus', 'preparation'),
  ]
  const [iid, , kermesse] = activities.map((a) => a.id)

  const checklist = [
    ['Chaises', 250, 'Awa Ndiaye', true],
    ['Tables', 12, 'Moussa Diop', true],
    ['Microphones', 2, 'Ousmane Sy', false],
    ['Sonorisation', 1, 'Ousmane Sy', false],
    ['Rallonges', 6, 'Moussa Diop', false],
    ['Eau (packs)', 20, 'Awa Ndiaye', false],
    ['Badges', 250, 'Aïcha Diagana', true],
    ['Banderole', 1, 'Fatou Sarr', false],
  ].map(([label, quantity, owner, done]) =>
    row('logistique', true, { activity_id: iid, label, quantity, owner, done }, 'chk'),
  )
  checklist.push(row('logistique', true, { activity_id: kermesse, label: 'Stands', quantity: 8, owner: 'Moussa Diop', done: false }, 'chk'))

  const task = (pole: PoleId, title: string, assignee: string, status: string, dueIn: number | null, extra: Record<string, unknown> = {}) =>
    row(pole, true, { title, assignee, status, due: dueIn === null ? null : addDays(today, dueIn), details: null, activity_id: null, ...extra }, 'tsk')

  const tasks = [
    task('logistique', 'Réserver la salle des intégrations', 'Aïcha Diagana', 'en_cours', -2, { activity_id: iid }),
    task('logistique', 'Lister le matériel à emprunter', 'Moussa Diop', 'a_faire', 4, { activity_id: iid }),
    task('logistique', 'Plan d’installation de la salle', 'Awa Ndiaye', 'termine', -5, { activity_id: iid }),
    task('communication', 'Affiche principale des intégrations', 'Fatou Sarr', 'en_cours', 1, { activity_id: iid }),
    task('communication', 'Teaser Instagram des intégrations', 'Ibrahima Fall', 'a_faire', 6, { activity_id: iid }),
    task('finance', 'Relancer les cotisations de septembre', 'Viviane Gnacadja', 'a_faire', 5),
    task('secretariat', 'Rédiger le PV de la réunion de lancement', 'Cheikh Beye', 'en_cours', 2),
    task('secretariat', 'Préparer l’ordre du jour', 'Cheikh Beye', 'a_faire', 4),
  ]

  const incidents = [
    row('logistique', true, { title: 'Rallonges insuffisantes pour la sono', details: 'Il en faut 6, nous en avons 2. Demander au club robotique ou à l’administration.', activity_id: iid, severity: 'moyenne', status: 'ouvert' }, 'inc'),
  ]

  const announcements = [
    row('communication', true, {
      title: 'Cotisations de septembre ouvertes',
      body: 'Les cotisations mensuelles commencent ce mois-ci. Le pôle Finance communique à chacun son montant et le moyen de versement.',
      audience: 'commission', status: 'publiee', date: addDays(today, -3), pinned: true,
    }, 'ann'),
    row('communication', true, {
      title: 'Réunion du conseil samedi',
      body: 'Réunion du conseil samedi à 18h à la Case CEE. Merci de confirmer votre présence sur le groupe.',
      audience: 'commission', status: 'publiee', date: addDays(today, -1), pinned: false,
    }, 'ann'),
    row('communication', false, {
      title: 'Appel à idées : le nom de l’activité de novembre',
      body: 'Proposez vos idées de nom et de concept pour l’activité de novembre.',
      audience: 'commission', status: 'brouillon', date: null, pinned: false,
    }, 'ann'),
  ]

  const visuals = [
    row('communication', true, { title: 'Affiche des intégrations communales', activity_id: iid, link: null, status: 'en_cours', assignee: 'Fatou Sarr', due: addDays(today, 1) }, 'vis'),
    row('communication', true, { title: 'Visuel des cotisations', activity_id: null, link: null, status: 'valide', assignee: 'Ibrahima Fall', due: addDays(today, -4) }, 'vis'),
  ]

  const posts = [
    row('communication', true, { date: addDays(today, 2), channel: 'whatsapp', content: 'Annonce des intégrations communales aux élèves', status: 'prevu' }, 'pst'),
    row('communication', true, { date: addDays(today, 5), channel: 'instagram', content: 'Teaser vidéo des intégrations', status: 'prevu' }, 'pst'),
    row('communication', true, { date: addDays(today, -3), channel: 'whatsapp', content: 'Message des cotisations de septembre', status: 'publie' }, 'pst'),
  ]

  const month = currentMonth() < '2026-09' ? '2026-09' : currentMonth()
  const contributions = members
    .filter((_, i) => i % 5 !== 3 && i % 7 !== 5)
    .map((m) => {
      const role = (m as unknown as { role: keyof typeof DEFAULT_RATES }).role
      return row('finance', false, { member_id: m.id, month, amount: DEFAULT_RATES[role], method: 'wave', paid_on: addDays(today, -2) }, 'cot')
    })

  const transactions = [
    row('finance', false, { date: addDays(today, -2), label: 'Cotisations de septembre (Wave)', kind: 'entree', amount: contributions.reduce((s, c) => s + (c as unknown as { amount: number }).amount, 0), category: 'Cotisations' }, 'trx'),
    row('finance', false, { date: addDays(today, -1), label: 'Impression des badges', kind: 'sortie', amount: 3500, category: 'Logistique' }, 'trx'),
  ]

  const ideas = [
    row('finance', true, { title: 'Goodies au logo de la Commission', details: 'T-shirts, stickers et porte-clés à prix accessibles aux étudiants.', status: 'etude', budget: 50000, revenue: null }, 'ide'),
    row('finance', true, { title: 'Buvette pendant les soirées', details: 'Vente de boissons et de snacks lors des activités.', status: 'idee', budget: null, revenue: null }, 'ide'),
  ]

  const partners = [
    row('finance', true, { name: 'Réseau des Alumni ESP', organisation: 'Alumni ESP', kind: 'alumni', status: 'en_discussion', contact: null, last_contact: addDays(today, -6), notes: 'Premier échange pour un parrainage des activités.' }, 'par'),
  ]

  const meetings = [
    row('secretariat', true, { audience: 'conseil', date: lastMeeting, time: '18:00', place: 'Case CEE', agenda: 'Présentation des pôles\nAdoption du montant des cotisations\nPlanning des activités 2026–2027' }, 'mtg'),
    row('secretariat', true, { audience: 'conseil', date: nextMeeting, time: '18:00', place: 'Case CEE', agenda: 'Point sur les intégrations communales\nRénovation de la Case CEE\nNom de l’activité de novembre\nÉtat des cotisations\nDivers' }, 'mtg'),
  ]

  const attendance = members.slice(0, 6).map((m, i) =>
    row('secretariat', true, { meeting_id: meetings[0].id, member_id: m.id, status: i === 4 ? 'excuse' : 'present' }, 'att'),
  )

  const minutes = [
    row('secretariat', true, {
      title: 'Réunion de lancement des pôles',
      meeting_date: lastMeeting,
      summary: 'Présentation des missions des quatre pôles, adoption du montant des cotisations mensuelles et revue du planning annuel.',
      body: "1. Chaque président de pôle a présenté ses missions et ses attentes.\n2. Le montant des cotisations mensuelles est adopté suite au sondage.\n3. Le planning 2026–2027 est validé ; le nom de l’activité de novembre reste à trouver.",
      link: null,
    }, 'pv'),
  ]

  const decisions = [
    row('secretariat', true, { number: 1, date: lastMeeting, title: 'Création des quatre pôles de la Commission', details: 'Logistique & Événementiel, Communication, Finance et Secrétariat général.', concerns: 'commission', status: 'appliquee' }, 'dec'),
    row('secretariat', true, { number: 2, date: lastMeeting, title: 'Montant des cotisations mensuelles adopté', details: 'Barème par rôle adopté suite au sondage, à partir de septembre. Le détail est tenu par le pôle Finance.', concerns: 'finance', status: 'en_application' }, 'dec'),
    row('secretariat', true, { number: 3, date: lastMeeting, title: 'Note de rénovation de la Case CEE transmise', details: 'Dix postes de travaux listés par la Commission Organisation.', concerns: 'commission', status: 'adoptee' }, 'dec'),
  ]

  const settings = [
    row('finance', false, { key: 'wave_number', value: '77 000 00 00' }, 'set'),
    row('finance', false, { key: 'rates', value: JSON.stringify(DEFAULT_RATES) }, 'set'),
    row('finance', true, { key: 'publish_rate', value: 'true' }, 'set'),
    row('finance', true, { key: 'caisse_supervisors', value: 'true' }, 'set'),
    row('finance', true, { key: `rate:${month}`, value: JSON.stringify({ paid: contributions.length, total: members.length }) }, 'set'),
  ]

  return {
    members, activities, checklist, tasks, incidents, announcements, visuals, posts,
    contributions, transactions, ideas, partners, meetings, attendance, minutes, decisions, settings,
  }
}
