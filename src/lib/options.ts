import type { Tone } from '../components/ui'

export interface Option {
  value: string
  label: string
  tone?: Tone
}

const o = (value: string, label: string, tone: Tone = 'neutral'): Option => ({ value, label, tone })

export const OPTIONS = {
  activityStatus: [o('preparation', 'En préparation'), o('prete', 'Prête', 'ok'), o('probleme', 'Problème', 'red')],
  taskStatus: [o('a_faire', 'À faire', 'muted'), o('en_cours', 'En cours', 'gold'), o('termine', 'Terminé', 'ok'), o('bloque', 'Bloqué', 'red')],
  severity: [o('faible', 'Faible', 'muted'), o('moyenne', 'Moyenne'), o('haute', 'Haute', 'red')],
  incidentStatus: [o('ouvert', 'Ouvert', 'red'), o('resolu', 'Résolu', 'ok')],
  audience: [o('commission', 'Commission'), o('cee', 'CEE'), o('eleves', 'Élèves')],
  announcementStatus: [o('brouillon', 'Brouillon', 'muted'), o('programmee', 'Programmée'), o('publiee', 'Publiée', 'ok')],
  visualStatus: [o('a_faire', 'À faire', 'muted'), o('en_cours', 'En cours', 'gold'), o('a_valider', 'À valider'), o('valide', 'Validé', 'ok')],
  channel: [o('whatsapp', 'WhatsApp'), o('instagram', 'Instagram'), o('facebook', 'Facebook'), o('affiche', 'Affiche'), o('autre', 'Autre')],
  postStatus: [o('prevu', 'Prévu'), o('publie', 'Publié', 'ok')],
  txKind: [o('entree', 'Entrée', 'ok'), o('sortie', 'Sortie')],
  ideaStatus: [o('idee', 'Idée', 'muted'), o('etude', 'À l’étude'), o('en_cours', 'En cours', 'gold'), o('realise', 'Réalisé', 'ok'), o('abandonne', 'Abandonné', 'muted')],
  partnerKind: [o('alumni', 'Alumni'), o('entreprise', 'Entreprise'), o('institution', 'Institution'), o('autre', 'Autre')],
  partnerStatus: [o('a_contacter', 'À contacter', 'muted'), o('en_discussion', 'En discussion', 'gold'), o('partenaire', 'Partenaire', 'ok'), o('inactif', 'Inactif', 'muted')],
  decisionStatus: [o('adoptee', 'Adoptée', 'gold'), o('en_application', 'En application'), o('appliquee', 'Appliquée', 'ok'), o('abandonnee', 'Abandonnée', 'muted')],
  concerns: [o('commission', 'Toute la Commission'), o('logistique', 'Logistique'), o('communication', 'Communication'), o('finance', 'Finance'), o('secretariat', 'Secrétariat')],
  memberRole: [o('membre', 'Membre'), o('chef_pole', 'Chef de pôle'), o('secretaire', 'Secrétaire'), o('president', 'Président'), o('adjoint', 'Adjoint')],
  memberPole: [o('', 'Aucun pôle'), o('logistique', 'Logistique'), o('communication', 'Communication'), o('finance', 'Finance'), o('secretariat', 'Secrétariat')],
  payMethod: [o('wave', 'Wave'), o('especes', 'Espèces')],
  attendance: [o('present', 'Présent', 'ok'), o('excuse', 'Excusé'), o('absent', 'Absent', 'red')],
  meetingAudience: [
    o('conseil', 'Réunion du conseil'),
    o('commission', 'Réunion de toute la Commission'),
    o('logistique', 'Réunion du pôle Logistique'),
    o('communication', 'Réunion du pôle Communication'),
    o('finance', 'Réunion du pôle Finance'),
  ],
} satisfies Record<string, Option[]>

export function optionOf(list: Option[], value: string | null | undefined) {
  return list.find((x) => x.value === value)
}
