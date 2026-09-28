import { formatCFA, monthLabel } from './dates'

/** Senegalese numbers are stored as typed ("77 123 45 67", "+221…", "00221…"); wa.me wants 221XXXXXXXXX. */
export function waNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 9) d = `221${d}`
  return /^221[0-9]{9}$/.test(d) ? d : null
}

export function reminderMessage(name: string, month: string, amount: number, wave: string | null) {
  const first = name.trim().split(/\s+/)[0]
  return [
    `Bonjour ${first},`,
    `Ceci est un rappel pour la cotisation mensuelle de la Commission Organisation (${monthLabel(month)}), d’un montant de ${formatCFA(amount)} CFA.`,
    wave ? `Numéro Wave : ${wave}.` : null,
    'Merci de procéder au paiement le plus tôt possible. Bonne journée !',
  ]
    .filter(Boolean)
    .join('\n')
}

export const waLink = (number: string, message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`
