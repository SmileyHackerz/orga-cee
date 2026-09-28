import type { Contribution, Member, MemberRole } from './types'
import { ACADEMIC_MONTHS, MEMBER_ROLE } from './poles'
import { OPTIONS, optionOf } from './options'
import { monthShort, todayISO } from './dates'

type Cell = { value: string | number | null; fontWeight?: 'bold'; type?: StringConstructor | NumberConstructor } | null

async function download(rows: Cell[][], widths: number[], fileName: string, sheet: string) {
  const { default: writeExcelFile } = await import('write-excel-file/universal')
  const blob = await writeExcelFile(rows as never, { columns: widths.map((width) => ({ width })), sheet, stickyRowsCount: 1 } as never).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const head = (labels: string[]): Cell[] => labels.map((value) => ({ value, fontWeight: 'bold' }))
const text = (v: string | null | undefined): Cell => ({ value: v ?? '', type: String })
const poleLabel = (m: Member) => (m.member_poles ?? []).map((p) => optionOf(OPTIONS.memberPole, p)?.label ?? p).join(', ')
const byName = (a: Member, b: Member) => a.name.localeCompare(b.name, 'fr')

export async function exportMembers(members: Member[]) {
  const rows: Cell[][] = [
    head(['Prénom et nom', 'Rôle', 'Pôles', 'Téléphone', 'Niveau', 'Département']),
    ...[...members].sort(byName).map((m) => [
      text(m.name), text(MEMBER_ROLE[m.role]), text(poleLabel(m)), text(m.phone), text(m.level), text(m.department),
    ]),
  ]
  await download(rows, [30, 16, 34, 16, 16, 22], `membres-orga-${todayISO()}.xlsx`, 'Membres')
}

export async function exportContributions(members: Member[], contributions: Contribution[], rates: Record<MemberRole, number>) {
  const paid = new Set(contributions.map((c) => `${c.member_id}:${c.month}`))
  const rows: Cell[][] = [
    head(['Prénom et nom', 'Rôle', 'Téléphone', 'Montant mensuel (F CFA)', ...ACADEMIC_MONTHS.map((m) => `${monthShort(m)} ${m.slice(2, 4)}`), 'Mois payés']),
    ...[...members].sort(byName).map((m) => {
      const months = ACADEMIC_MONTHS.map((month) => paid.has(`${m.id}:${month}`))
      return [
        text(m.name),
        text(MEMBER_ROLE[m.role]),
        text(m.phone),
        { value: rates[m.role], type: Number },
        ...months.map((ok) => text(ok ? 'Payé' : '')),
        { value: months.filter(Boolean).length, type: Number },
      ] as Cell[]
    }),
  ]
  await download(rows, [30, 16, 16, 12, ...ACADEMIC_MONTHS.map(() => 9), 11], `cotisations-orga-${todayISO()}.xlsx`, 'Cotisations')
}
