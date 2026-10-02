import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { File, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, LoaderCircle, NotebookText, Presentation, Trash2, Upload } from 'lucide-react'
import { usePublishedRows, useRows, useStore, type DataStore } from '../lib/store'
import { ACCEPT, KIND_LABEL, MAX_FILE_BYTES, contentTypeFor, fileKind, formatSize, opensInline, storagePath, type FileKind } from '../lib/files'
import { shortDate } from '../lib/dates'
import type { Attachment, AttachmentParent, PoleId } from '../lib/types'
import { VisibilityToggle, useToast } from './ui'

const ICONS: Record<FileKind, typeof File> = {
  image: FileImage, pdf: FileText, word: FileText, slides: Presentation, sheet: FileSpreadsheet, text: NotebookText, video: FileVideo, audio: FileAudio, other: File,
}

const ofParent = (rows: Attachment[], parent: AttachmentParent, parentId: string) =>
  rows.filter((a) => a.parent_table === parent && a.parent_id === parentId).sort((a, b) => a.created_at.localeCompare(b.created_at))

/** Temporary links (1 h, like the session). Files that browsers cannot show open as a download under their real name. */
function useFileUrls(items: Attachment[]) {
  const store = useStore()
  const [urls, setUrls] = useState<Record<string, string>>({})
  const key = items.map((i) => i.id).join()
  useEffect(() => {
    let alive = true
    const missing = items.filter((i) => !(i.id in urls))
    if (!missing.length) return
    Promise.all(
      missing.map(async (i) => {
        try {
          return [i.id, await store.backend.fileUrl(i.path, opensInline(fileKind(i.mime, i.name)) ? undefined : i.name)] as const
        } catch {
          return [i.id, ''] as const
        }
      }),
    ).then((pairs) => alive && setUrls((u) => ({ ...u, ...Object.fromEntries(pairs) })))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, store])
  return urls
}

/** Deletes the files of an activity or a meeting before the item itself goes. */
export async function removeAttachmentsOf(store: DataStore, parent: AttachmentParent, parentId: string) {
  for (const a of ofParent(store.get('attachments') as Attachment[], parent, parentId)) {
    await store.backend.removeFile(a.path)
    await store.remove('attachments', a.id)
  }
}

function FileRow({ a, url, children }: { a: Attachment; url: string | undefined; children?: ReactNode }) {
  const kind = fileKind(a.mime, a.name)
  const Icon = ICONS[kind]
  const meta = [KIND_LABEL[kind], formatSize(a.size), shortDate(a.created_at.slice(0, 10))].filter(Boolean).join(' · ')
  return (
    <div className="file-row">
      {kind === 'image' && url ? (
        <img className="file-row__thumb" src={url} alt="" loading="lazy" />
      ) : (
        <span className={`file-row__icon file-row__icon--${kind}`} aria-hidden><Icon size={18} /></span>
      )}
      <div className="file-row__text">
        {url ? (
          <a className="file-row__name" href={url} target="_blank" rel="noreferrer" title={opensInline(kind) ? 'Ouvrir' : 'Télécharger'}>{a.name}</a>
        ) : (
          <span className="file-row__name is-pending">{a.name}</span>
        )}
        <span className="file-row__meta">{meta}</span>
      </div>
      {children}
    </div>
  )
}

/** What the council sees in an activity sheet or a meeting: published files only. */
export function AttachmentList({ parent, parentId }: { parent: AttachmentParent; parentId: string }) {
  const all = usePublishedRows('attachments')
  const items = useMemo(() => ofParent(all, parent, parentId), [all, parent, parentId])
  const urls = useFileUrls(items)
  if (!items.length) return null
  const photos = items.filter((a) => fileKind(a.mime, a.name) === 'image')
  const docs = items.filter((a) => fileKind(a.mime, a.name) !== 'image')
  return (
    <div className="files">
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((a) =>
            urls[a.id] ? (
              <a key={a.id} href={urls[a.id]} target="_blank" rel="noreferrer" className="photo-grid__item" aria-label={`Ouvrir la photo ${a.name}`}>
                <img src={urls[a.id]} alt={a.name} loading="lazy" />
              </a>
            ) : (
              <span key={a.id} className="photo-grid__item is-pending" aria-label={a.name} />
            ),
          )}
        </div>
      )}
      {docs.map((a) => <FileRow key={a.id} a={a} url={urls[a.id]} />)}
    </div>
  )
}

/** Admin side: the pole president adds, publishes or removes files; supervisors read. */
export function AttachmentsAdmin({ parent, parentId, pole, readOnly, title, hint }: {
  parent: AttachmentParent
  parentId: string
  pole: PoleId
  readOnly: boolean
  title: string
  hint: string
}) {
  const store = useStore()
  const toast = useToast()
  const all = useRows('attachments')
  const items = useMemo(() => ofParent(all, parent, parentId), [all, parent, parentId])
  const urls = useFileUrls(items)
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ key: string; name: string }[]>([])
  const [over, setOver] = useState(false)
  const [armed, setArmed] = useState<string | null>(null)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(null), 3500)
    return () => clearTimeout(t)
  }, [armed])

  const add = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const type = contentTypeFor(file)
      if (!type) {
        toast(`« ${file.name} » : format non accepté (photos, PDF, Word, PowerPoint, Excel, notes, audio, vidéo).`, 'error')
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        toast(`« ${file.name} » dépasse 50 Mo.`, 'error')
        continue
      }
      const path = storagePath(pole, parent, parentId, file.name)
      const key = path
      setPending((p) => [...p, { key, name: file.name }])
      try {
        await store.backend.upload(path, file, type)
        try {
          await store.insert('attachments', { pole, visible: true, parent_table: parent, parent_id: parentId, name: file.name, path, size: file.size, mime: type })
          toast(`« ${file.name} » ajouté`)
        } catch (e) {
          await store.backend.removeFile(path).catch(() => undefined)
          throw e
        }
      } catch (e) {
        const msg = e instanceof Error && /démonstration/.test(e.message) ? e.message : `« ${file.name} » n’a pas pu être envoyé. Vérifie ta connexion et réessaie.`
        toast(msg, 'error')
      }
      setPending((p) => p.filter((x) => x.key !== key))
    }
  }

  const remove = async (a: Attachment) => {
    try {
      await store.backend.removeFile(a.path)
      await store.remove('attachments', a.id)
      toast('Fichier retiré')
    } catch {
      toast('Suppression impossible', 'error')
    }
    setArmed(null)
  }

  const publish = async (a: Attachment, v: boolean) => {
    try {
      await store.update('attachments', a.id, { visible: v })
      toast(v ? 'Affiché au conseil' : 'Rendu privé')
    } catch {
      toast('Modification impossible', 'error')
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (!readOnly && e.dataTransfer.files.length) void add(e.dataTransfer.files)
  }

  return (
    <section className="attach" aria-label={title}>
      <div className="attach__head">
        <h3>{title}</h3>
        {items.length > 0 && <span className="sheet__count">{items.length} fichier{items.length > 1 ? 's' : ''}</span>}
      </div>

      {!readOnly && (
        <div
          className={`dropzone ${over ? 'is-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <button type="button" className="btn btn--line btn--sm" onClick={() => input.current?.click()}>
            <Upload size={15} /> <span>Ajouter des fichiers</span>
          </button>
          <p>{hint}</p>
          <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = '' }} />
        </div>
      )}

      <div className="files">
        {items.length === 0 && pending.length === 0 && (
          <p className="dim" style={{ fontSize: 14 }}>Aucun fichier pour l’instant.</p>
        )}
        <AnimatePresence initial={false}>
          {items.map((a) => (
            <motion.div key={a.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <FileRow a={a} url={urls[a.id]}>
                <VisibilityToggle visible={a.visible} disabled={readOnly} onChange={(v) => publish(a, v)} />
                {!readOnly && (
                  armed === a.id ? (
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => remove(a)}><span>Retirer</span></button>
                  ) : (
                    <button type="button" className="icon-btn" aria-label={`Retirer ${a.name}`} onClick={() => setArmed(a.id)}><Trash2 size={16} /></button>
                  )
                )}
              </FileRow>
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.map((x) => (
          <div key={x.key} className="file-row is-uploading">
            <span className="file-row__icon" aria-hidden><LoaderCircle size={18} className="spin" /></span>
            <div className="file-row__text">
              <span className="file-row__name">{x.name}</span>
              <span className="file-row__meta">Envoi en cours…</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
