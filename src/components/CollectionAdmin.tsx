import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Search } from 'lucide-react'
import type { CollectionDef } from '../lib/collections'
import { asRecord } from '../lib/collections'
import { useRows, useStore } from '../lib/store'
import type { PoleId, TableName } from '../lib/types'
import { RecordForm, type Values } from './RecordForm'
import { Button, ConfirmButton, Drawer, EmptyState, VisibilityToggle, useToast } from './ui'
import { AttachmentsAdmin, removeAttachmentsOf } from './Attachments'
import type { AttachmentParent } from '../lib/types'

type Editing = { mode: 'new' } | { mode: 'edit'; id: string } | null

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function CollectionAdmin({ def, pole, readOnly, editId, onEditHandled, toolbar }: {
  def: CollectionDef
  pole: PoleId
  readOnly: boolean
  editId?: string | null
  onEditHandled?: () => void
  toolbar?: ReactNode
}) {
  const store = useStore()
  const toast = useToast()
  const all = useRows(def.table as TableName)
  const activities = useRows('activities')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const [visible, setVisible] = useState(def.defaultVisible)
  const [busy, setBusy] = useState(false)

  const ctx = useMemo(() => ({ activities: new Map(activities.map((a) => [a.id, a])) }), [activities])
  const rows = useMemo(() => {
    const own = all.filter((r) => r.pole === pole).map(asRecord)
    const filtered = q ? own.filter((r) => norm(Object.values(r).join(' ')).includes(norm(q))) : own
    return def.sort ? [...filtered].sort(def.sort) : filtered
  }, [all, pole, q, def])

  useEffect(() => {
    if (!editId) return
    if (all.some((r) => r.id === editId)) {
      const r = all.find((x) => x.id === editId)!
      setVisible(r.visible)
      setEditing({ mode: 'edit', id: editId })
      onEditHandled?.()
    }
  }, [editId, all, onEditHandled])

  const current = editing?.mode === 'edit' ? rows.find((r) => r.id === editing.id) ?? asRecord(all.find((r) => r.id === editing.id)!) : undefined
  const formId = `form-${def.table}`

  const openNew = () => {
    setVisible(def.defaultVisible)
    setEditing({ mode: 'new' })
  }
  const openEdit = (r: Record<string, unknown>) => {
    setVisible(Boolean(r.visible))
    setEditing({ mode: 'edit', id: String(r.id) })
  }

  const save = async (values: Values) => {
    setBusy(true)
    try {
      if (editing?.mode === 'edit') {
        await store.update(def.table, editing.id, { ...values, visible } as never)
        toast('Modifications enregistrées')
      } else {
        const created = await store.insert(def.table, { ...values, pole, visible } as never)
        if (def.attachments) {
          toast('Ajouté. Tu peux maintenant joindre des fichiers.')
          setEditing({ mode: 'edit', id: created.id })
          setBusy(false)
          return
        }
        toast(`Ajouté à « ${def.label} »`)
      }
      setEditing(null)
    } catch {
      toast('Enregistrement impossible. Vérifie ta connexion et réessaie.', 'error')
    }
    setBusy(false)
  }

  const remove = async () => {
    if (editing?.mode !== 'edit') return
    try {
      if (def.attachments) await removeAttachmentsOf(store, def.table as AttachmentParent, editing.id)
      await store.remove(def.table, editing.id)
      toast('Supprimé')
      setEditing(null)
    } catch {
      toast('Suppression impossible', 'error')
    }
  }

  const toggle = async (r: Record<string, unknown>, v: boolean) => {
    try {
      await store.update(def.table, String(r.id), { visible: v } as never)
      toast(v ? 'Affiché au conseil' : 'Rendu privé')
    } catch {
      toast('Modification impossible', 'error')
    }
  }

  const initial: Values = editing?.mode === 'edit' && current ? current : { ...(def.defaults ?? {}) }

  return (
    <div>
      <div className="coll-bar">
        {def.help ? <p className="coll-help">{def.help}</p> : <span />}
        <div className="coll-tools">
          {toolbar}
          <label className="searchbox">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label={`Rechercher dans ${def.label}`} />
          </label>
          {!readOnly && (
            <Button variant="solid" icon={<Plus size={16} />} onClick={openNew}>
              {def.newLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '6px 22px 8px' }}>
        {rows.length === 0 ? (
          <EmptyState
            title={q ? 'Aucun résultat' : `Aucun élément dans « ${def.label} »`}
            text={q ? 'Essaie un autre mot.' : readOnly ? 'Le pôle n’a encore rien ajouté ici.' : 'Commence par en ajouter un : tu choisiras ensuite s’il est visible par le conseil.'}
            action={!readOnly && !q ? <Button variant="line" size="sm" icon={<Plus size={14} />} onClick={openNew}>{def.newLabel}</Button> : undefined}
          />
        ) : (
          <div className="table-wrap">
            <table className="table admin-table">
              <thead>
                <tr>
                  {def.columns.map((c) => (
                    <th key={c.label} className={c.hideSm ? 'hide-sm' : ''} style={{ width: c.width }}>{c.label}</th>
                  ))}
                  {!def.alwaysVisible && <th style={{ width: 120 }}>Conseil</th>}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((r, i) => (
                    <motion.tr
                      key={String(r.id)}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.025, duration: 0.35 } }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      onClick={() => openEdit(r)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && openEdit(r)}
                      aria-label={`Ouvrir ${def.title(r)}`}
                    >
                      {def.columns.map((c) => (
                        <td key={c.label} className={c.hideSm ? 'hide-sm' : ''}>{c.render(r, ctx)}</td>
                      ))}
                      {!def.alwaysVisible && (
                        <td>
                          <VisibilityToggle visible={Boolean(r.visible)} disabled={readOnly} onChange={(v) => toggle(r, v)} />
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          <>
            <h2>{editing?.mode === 'new' ? def.newLabel : current ? def.title(current) : ''}</h2>
            <div className="drawer-kick"><span>{def.label}</span>{readOnly && <span>· Lecture seule</span>}</div>
          </>
        }
        footer={
          readOnly ? (
            <span className="dim" style={{ fontSize: 13 }}>Seul le président du pôle peut modifier.</span>
          ) : (
            <>
              {editing?.mode === 'edit' ? <ConfirmButton onConfirm={remove}>Supprimer</ConfirmButton> : <span />}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Annuler</Button>
                <Button variant="solid" size="sm" type="submit" form={formId} disabled={busy}>
                  {busy ? 'Enregistrement…' : editing?.mode === 'new' ? 'Ajouter' : 'Enregistrer'}
                </Button>
              </div>
            </>
          )
        }
      >
        {editing && (
          <RecordForm
            key={editing.mode === 'edit' ? editing.id : 'new'}
            id={formId}
            fields={def.fields}
            initial={initial}
            visible={visible}
            onVisible={setVisible}
            hideVisibility={def.alwaysVisible}
            disabled={readOnly}
            onSubmit={save}
          />
        )}
        {def.attachments && editing?.mode === 'edit' && (
          <AttachmentsAdmin
            parent={def.table as AttachmentParent}
            parentId={editing.id}
            pole={pole}
            readOnly={readOnly}
            title={def.attachments.title}
            hint={def.attachments.hint}
          />
        )}
        {def.attachments && editing?.mode === 'new' && (
          <p className="coll-help" style={{ marginTop: 18 }}>Après « Ajouter », tu pourras joindre des fichiers ({def.attachments.title.toLowerCase()}).</p>
        )}
      </Drawer>
    </div>
  )
}
