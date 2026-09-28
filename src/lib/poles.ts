import type { ActivityStatus, MemberRole, PoleId, Profile, TaskStatus } from './types'

export interface PoleDef {
  id: PoleId
  code: string
  name: string
  short: string
  path: string
  mission: string
}

export const POLES: PoleDef[] = [
  {
    id: 'logistique',
    code: 'LOG',
    name: 'Logistique & Événementiel',
    short: 'Logistique',
    path: '/logistique',
    mission: "Transformer l'idée d'un événement en un plan concret et réaliste : tout prévoir à l'avance, que chacun sache quoi faire, réagir vite en cas d'imprévu.",
  },
  {
    id: 'communication',
    code: 'COM',
    name: 'Communication',
    short: 'Communication',
    path: '/communication',
    mission: "La courroie de transmission à trois niveaux : entre nous, avec les autres commissions du CEE, et avec les élèves.",
  },
  {
    id: 'finance',
    code: 'FIN',
    name: 'Finance',
    short: 'Finance',
    path: '/finance',
    mission: "Trois axes : la gestion des cotisations, l'autofinancement de la Commission et les relations extérieures, dont le réseau des Alumni.",
  },
  {
    id: 'secretariat',
    code: 'SG',
    name: 'Secrétariat général',
    short: 'Secrétariat',
    path: '/secretariat',
    mission: 'La mémoire du Conseil : procès-verbaux, décisions, présences, suivi des missions et préparation des réunions.',
  },
]

export const poleById = (id: PoleId) => POLES.find((p) => p.id === id)!

export const COUNCIL: Profile[] = [
  { id: 'jacques', full_name: 'Jacques Sambou', kind: 'supervisor', pole: null, title: 'Président de la Commission' },
  { id: 'mohamed', full_name: 'Mohamed Faye', kind: 'supervisor', pole: null, title: 'Adjoint au Président' },
  { id: 'cheikh', full_name: 'Cheikh Beye', kind: 'president', pole: 'secretariat', title: 'Secrétaire général' },
  { id: 'pape', full_name: 'Pape Samba Ba', kind: 'president', pole: 'communication', title: 'Président · Communication' },
  { id: 'aicha', full_name: 'Aïcha Diagana', kind: 'president', pole: 'logistique', title: 'Présidente · Logistique & Événementiel' },
  { id: 'viviane', full_name: 'Viviane Gnacadja', kind: 'president', pole: 'finance', title: 'Présidente · Finance' },
]

export const initials = (name: string) =>
  name
    .replace(/[«»"]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const ACTIVITY_STATUS: Record<ActivityStatus, string> = {
  preparation: 'En préparation',
  prete: 'Prête',
  probleme: 'Problème',
}

export const TASK_STATUS: Record<TaskStatus, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  termine: 'Terminé',
  bloque: 'Bloqué',
}

export const MEMBER_ROLE: Record<MemberRole, string> = {
  membre: 'Membre',
  chef_pole: 'Chef de pôle',
  secretaire: 'Secrétaire',
  president: 'Président',
  adjoint: 'Adjoint',
}

export const DEFAULT_RATES: Record<MemberRole, number> = {
  membre: 1000,
  chef_pole: 1500,
  secretaire: 1500,
  president: 2000,
  adjoint: 2000,
}

export const ACADEMIC_MONTHS = [
  '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02',
  '2027-03', '2027-04', '2027-05', '2027-06', '2027-07',
]
