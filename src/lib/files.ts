import type { AttachmentParent, PoleId } from './types'

/** 50 Mo: the per-file ceiling of Supabase's free plan. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024

/** Same list as the storage bucket (migration_005_fichiers.sql): anything else is refused by the server too. */
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
  pdf: 'application/pdf',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  odt: 'application/vnd.oasis.opendocument.text', odp: 'application/vnd.oasis.opendocument.presentation', ods: 'application/vnd.oasis.opendocument.spreadsheet',
  txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', rtf: 'application/rtf',
  mp4: 'video/mp4', mov: 'video/quicktime',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', opus: 'audio/ogg',
}
const ALLOWED = new Set(Object.values(MIME_BY_EXT))

export const ACCEPT = Object.keys(MIME_BY_EXT).map((e) => `.${e}`).join(',')

const ext = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '')

/** The type stored with the file, or null when the format is not accepted. */
export function contentTypeFor(file: File): string | null {
  const byExt = MIME_BY_EXT[ext(file.name)]
  if (file.type && ALLOWED.has(file.type)) return file.type
  return byExt ?? null
}

export type FileKind = 'image' | 'pdf' | 'word' | 'slides' | 'sheet' | 'text' | 'video' | 'audio' | 'other'

export function fileKind(mime: string | null, name: string): FileKind {
  const m = mime ?? MIME_BY_EXT[ext(name)] ?? ''
  if (m.startsWith('image/')) return 'image'
  if (m === 'application/pdf') return 'pdf'
  if (m.startsWith('video/')) return 'video'
  if (m.startsWith('audio/')) return 'audio'
  if (/word|opendocument\.text|rtf/.test(m)) return 'word'
  if (/powerpoint|presentation/.test(m)) return 'slides'
  if (/excel|sheet|csv/.test(m)) return 'sheet'
  if (m.startsWith('text/')) return 'text'
  return 'other'
}

export const KIND_LABEL: Record<FileKind, string> = {
  image: 'Photo', pdf: 'PDF', word: 'Document', slides: 'Présentation', sheet: 'Tableur', text: 'Notes', video: 'Vidéo', audio: 'Audio', other: 'Fichier',
}

/** Browsers can show these directly; the others are downloaded under their real name. */
export const opensInline = (k: FileKind) => k === 'image' || k === 'pdf' || k === 'video' || k === 'audio' || k === 'text'

export function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0).replace('.', ',')} Mo`
}

/** The first folder is the pole: storage rules only let a pole write inside its own folder. */
export function storagePath(pole: PoleId, parent: AttachmentParent, parentId: string, name: string) {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  const e = ext(name)
  return `${pole}/${parent}/${parentId}/${id}${e ? `.${e}` : ''}`
}
