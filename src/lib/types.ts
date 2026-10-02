export type PoleId = 'logistique' | 'communication' | 'finance' | 'secretariat'

export interface BaseRow {
  id: string
  pole: PoleId
  visible: boolean
  created_at: string
  updated_at: string
}

export type ActivityStatus = 'preparation' | 'prete' | 'probleme'
export type TaskStatus = 'a_faire' | 'en_cours' | 'termine' | 'bloque'
export type MemberRole = 'membre' | 'chef_pole' | 'secretaire' | 'president' | 'adjoint'

export interface Member extends BaseRow {
  name: string
  role: MemberRole
  member_poles: PoleId[]
  phone: string | null
  level: string | null
  department: string | null
}

export interface Activity extends BaseRow {
  title: string
  month: string
  date: string | null
  time: string | null
  place: string | null
  status: ActivityStatus
  objective: string | null
  audience: string | null
  expected: number | null
  program: string | null
  speakers: string | null
  lead: string | null
}

export interface ChecklistItem extends BaseRow {
  activity_id: string
  label: string
  quantity: number | null
  owner: string | null
  done: boolean
}

export interface Incident extends BaseRow {
  title: string
  details: string | null
  activity_id: string | null
  severity: 'faible' | 'moyenne' | 'haute'
  status: 'ouvert' | 'resolu'
}

export interface Task extends BaseRow {
  title: string
  details: string | null
  activity_id: string | null
  assignee: string | null
  status: TaskStatus
  due: string | null
}

export interface Announcement extends BaseRow {
  title: string
  body: string | null
  audience: 'commission' | 'cee' | 'eleves'
  status: 'brouillon' | 'programmee' | 'publiee'
  date: string | null
  pinned: boolean
}

export interface Visual extends BaseRow {
  title: string
  activity_id: string | null
  link: string | null
  status: 'a_faire' | 'en_cours' | 'a_valider' | 'valide'
  assignee: string | null
  due: string | null
}

export interface Post extends BaseRow {
  date: string
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'affiche' | 'autre'
  content: string
  status: 'prevu' | 'publie'
}

export interface Contribution extends BaseRow {
  member_id: string
  month: string
  amount: number
  method: 'wave' | 'especes'
  paid_on: string | null
}

export interface Transaction extends BaseRow {
  date: string
  label: string
  kind: 'entree' | 'sortie'
  amount: number
  category: string | null
}

export interface Idea extends BaseRow {
  title: string
  details: string | null
  status: 'idee' | 'etude' | 'en_cours' | 'realise' | 'abandonne'
  budget: number | null
  revenue: number | null
}

export interface Partner extends BaseRow {
  name: string
  organisation: string | null
  kind: 'alumni' | 'entreprise' | 'institution' | 'autre'
  status: 'a_contacter' | 'en_discussion' | 'partenaire' | 'inactif'
  contact: string | null
  last_contact: string | null
  notes: string | null
}

export type MeetingAudience = 'conseil' | 'commission' | 'logistique' | 'communication' | 'finance'

export interface Meeting extends BaseRow {
  audience: MeetingAudience
  date: string
  time: string | null
  place: string | null
  agenda: string | null
}

export interface Attendance extends BaseRow {
  meeting_id: string
  member_id: string
  status: 'present' | 'absent' | 'excuse'
}

export interface Minute extends BaseRow {
  title: string
  meeting_date: string
  summary: string | null
  body: string | null
  link: string | null
}

export interface Decision extends BaseRow {
  number: number
  date: string
  title: string
  details: string | null
  concerns: PoleId | 'commission'
  status: 'adoptee' | 'en_application' | 'appliquee' | 'abandonnee'
}

/** A file attached to an activity (Logistique: fiches) or a meeting (Secrétariat: PV). */
export type AttachmentParent = 'activities' | 'meetings'

export interface Attachment extends BaseRow {
  parent_table: AttachmentParent
  parent_id: string
  name: string
  path: string
  size: number | null
  mime: string | null
}

export interface Setting extends BaseRow {
  key: string
  value: string
}

export interface Tables {
  members: Member
  activities: Activity
  checklist: ChecklistItem
  incidents: Incident
  tasks: Task
  announcements: Announcement
  visuals: Visual
  posts: Post
  contributions: Contribution
  transactions: Transaction
  ideas: Idea
  partners: Partner
  meetings: Meeting
  attendance: Attendance
  minutes: Minute
  decisions: Decision
  settings: Setting
  attachments: Attachment
}

export type TableName = keyof Tables

export type NewRow<T extends BaseRow> = Omit<T, 'id' | 'created_at' | 'updated_at'> & { id?: string }

export interface Profile {
  id: string
  full_name: string
  kind: 'supervisor' | 'president'
  pole: PoleId | null
  title: string
  must_change_password?: boolean
}
