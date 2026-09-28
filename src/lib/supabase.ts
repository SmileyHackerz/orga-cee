import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Backend } from './store'
import type { BaseRow, TableName } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export function createSupabaseBackend(client: SupabaseClient): Backend {
  return {
    mode: 'supabase',
    async list(table) {
      const { data, error } = await client.from(table).select('*').order('created_at', { ascending: true })
      if (error) throw error
      return data as BaseRow[]
    },
    async insert(table, row) {
      const { data, error } = await client.from(table).insert(row).select().single()
      if (error) throw error
      return data as BaseRow
    },
    async update(table, id, patch) {
      const { data, error } = await client.from(table).update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as BaseRow
    },
    async remove(table, id) {
      const { error } = await client.from(table).delete().eq('id', id)
      if (error) throw error
    },
    subscribe(onChange) {
      // supabase-js returns the already-subscribed channel for a reused name, so each store gets its own.
      const channel = client
        .channel(`orga-db-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => onChange(payload.table as TableName))
        .subscribe()
      return () => void client.removeChannel(channel)
    },
  }
}
