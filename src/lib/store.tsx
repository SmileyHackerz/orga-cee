import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import type { BaseRow, NewRow, TableName, Tables } from './types'
import { useAuth } from './auth'

export interface Backend {
  mode: 'demo' | 'supabase'
  list(table: TableName): Promise<BaseRow[]>
  insert(table: TableName, row: Record<string, unknown>): Promise<BaseRow>
  update(table: TableName, id: string, patch: Record<string, unknown>): Promise<BaseRow>
  remove(table: TableName, id: string): Promise<void>
  subscribe(onChange: (table: TableName | '*') => void): () => void
  /** Stored files: upload, temporary links (1 h), deletion. */
  upload(path: string, file: File, contentType: string): Promise<void>
  fileUrl(path: string, downloadName?: string): Promise<string>
  removeFile(path: string): Promise<void>
}

type Status = 'idle' | 'loading' | 'ready' | 'error'
const EMPTY: BaseRow[] = []

export class DataStore {
  private cache = new Map<TableName, BaseRow[]>()
  private status = new Map<TableName, Status>()
  private listeners = new Set<() => void>()
  private unsub: () => void
  backend: Backend

  constructor(backend: Backend) {
    this.backend = backend
    this.unsub = backend.subscribe((t) => {
      if (t === '*') this.cache.forEach((_, name) => void this.load(name))
      else if (this.status.get(t) === 'ready') void this.load(t)
    })
  }

  dispose() {
    this.unsub()
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }

  get(table: TableName) {
    return this.cache.get(table) ?? EMPTY
  }

  isReady(table: TableName) {
    return this.status.get(table) === 'ready'
  }

  ensure(table: TableName) {
    if (!this.status.get(table) || this.status.get(table) === 'idle') void this.load(table)
  }

  async load(table: TableName) {
    if (!this.cache.has(table)) this.status.set(table, 'loading')
    try {
      const rows = await this.backend.list(table)
      this.cache.set(table, rows)
      this.status.set(table, 'ready')
    } catch (e) {
      console.error(`Chargement de ${table} impossible`, e)
      this.status.set(table, 'error')
    }
    this.emit()
  }

  private set(table: TableName, rows: BaseRow[]) {
    this.cache.set(table, rows)
    this.emit()
  }

  async insert<T extends TableName>(table: T, row: NewRow<Tables[T]>) {
    const created = await this.backend.insert(table, row as Record<string, unknown>)
    this.set(table, [...this.get(table).filter((r) => r.id !== created.id), created])
    return created as Tables[T]
  }

  async update<T extends TableName>(table: T, id: string, patch: Partial<Tables[T]>) {
    const before = this.get(table)
    this.set(table, before.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    try {
      const saved = await this.backend.update(table, id, patch as Record<string, unknown>)
      this.set(table, this.get(table).map((r) => (r.id === id ? saved : r)))
      return saved as Tables[T]
    } catch (e) {
      this.set(table, before)
      throw e
    }
  }

  async remove(table: TableName, id: string) {
    const before = this.get(table)
    this.set(table, before.filter((r) => r.id !== id))
    try {
      await this.backend.remove(table, id)
    } catch (e) {
      this.set(table, before)
      throw e
    }
  }
}

const StoreContext = createContext<DataStore | null>(null)

export function StoreProvider({ store, children }: { store: DataStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const s = useContext(StoreContext)
  if (!s) throw new Error('StoreProvider manquant')
  return s
}

/** All rows of a table the current member is allowed to read. */
export function useRows<T extends TableName>(table: T): Tables[T][] {
  const store = useStore()
  const { canSeePrivate, isSupervisor } = useAuth()
  const guarded = table === 'transactions' && isSupervisor
  useEffect(() => {
    store.ensure(table)
    if (guarded) store.ensure('settings')
  }, [store, table, guarded])
  const rows = useSyncExternalStore(store.subscribe, () => store.get(table))
  const settings = useSyncExternalStore(store.subscribe, () => store.get('settings'))
  const caisseClosed = guarded && (settings as Tables['settings'][]).some((s) => s.pole === 'finance' && s.key === 'caisse_supervisors' && s.value === 'false')
  return useMemo(
    () => (rows as Tables[T][]).filter((r) => r.visible || (canSeePrivate(r.pole) && !caisseClosed)),
    [rows, canSeePrivate, caisseClosed],
  )
}

/** What a pole has chosen to show the council. Public pages read only this; private detail stays in the admin spaces. */
export function usePublishedRows<T extends TableName>(table: T): Tables[T][] {
  const store = useStore()
  useEffect(() => store.ensure(table), [store, table])
  const rows = useSyncExternalStore(store.subscribe, () => store.get(table))
  return useMemo(() => (rows as Tables[T][]).filter((r) => r.visible), [rows])
}

export function useReady(...tables: TableName[]) {
  const store = useStore()
  useSyncExternalStore(store.subscribe, () => tables.map((t) => store.isReady(t)).join())
  return tables.every((t) => store.isReady(t))
}
