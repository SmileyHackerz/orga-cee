import type { Backend } from './store'
import type { BaseRow, TableName } from './types'
import { buildSeed } from './seed'

const KEY = 'orga-demo-v5'

type Db = Partial<Record<TableName, BaseRow[]>>

function read(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    /* storage unavailable: fall through to a fresh seed */
  }
  const seeded = buildSeed()
  write(seeded)
  return seeded
}

function write(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* private mode: data lives for this tab only */
  }
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export function createLocalBackend(): Backend {
  let db = read()
  const pause = () => new Promise((r) => setTimeout(r, 120))

  return {
    mode: 'demo',
    async list(table) {
      await pause()
      return [...(db[table] ?? [])]
    },
    async insert(table, row) {
      const now = new Date().toISOString()
      const created = { ...row, id: (row.id as string) ?? uid(), created_at: now, updated_at: now } as BaseRow
      db = { ...db, [table]: [...(db[table] ?? []), created] }
      write(db)
      return created
    },
    async update(table, id, patch) {
      let saved: BaseRow | undefined
      db = {
        ...db,
        [table]: (db[table] ?? []).map((r) => {
          if (r.id !== id) return r
          saved = { ...r, ...patch, updated_at: new Date().toISOString() } as BaseRow
          return saved
        }),
      }
      if (!saved) throw new Error('Élément introuvable')
      write(db)
      return saved
    },
    async remove(table, id) {
      db = { ...db, [table]: (db[table] ?? []).filter((r) => r.id !== id) }
      write(db)
    },
    subscribe(onChange) {
      const handler = (e: StorageEvent) => {
        if (e.key !== KEY) return
        db = read()
        onChange('*')
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
  }
}
