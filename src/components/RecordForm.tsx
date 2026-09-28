import { useState, type FormEvent } from 'react'
import type { FieldDef } from '../lib/collections'
import { useRows } from '../lib/store'
import { capitalize, monthLabel } from '../lib/dates'
import { POLES } from '../lib/poles'
import { VisibilityToggle } from './ui'

export type Values = Record<string, unknown>

export function normalize(fields: FieldDef[], values: Values): Values {
  const out: Values = {}
  for (const f of fields) {
    const v = values[f.key]
    if (f.type === 'boolean') out[f.key] = !!v
    else if (f.type === 'poles') out[f.key] = Array.isArray(v) ? v : []
    else if (f.type === 'number') out[f.key] = v === '' || v === null || v === undefined ? null : Number(v)
    else if (typeof v === 'string') out[f.key] = v.trim() === '' ? null : v.trim()
    else out[f.key] = v ?? null
  }
  return out
}

export function RecordForm({ id, fields, initial, visible, onVisible, disabled, onSubmit, hideVisibility }: {
  id: string
  fields: FieldDef[]
  initial: Values
  visible: boolean
  onVisible: (v: boolean) => void
  disabled?: boolean
  onSubmit: (values: Values) => void
  hideVisibility?: boolean
}) {
  const members = useRows('members')
  const activities = useRows('activities')
  const [values, setValues] = useState<Values>(initial)
  const [error, setError] = useState<string | null>(null)
  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const missing = fields.find((f) => f.required && (values[f.key] === undefined || values[f.key] === null || String(values[f.key]).trim() === ''))
    if (missing) {
      setError(`Renseigne le champ « ${missing.label} ».`)
      return
    }
    setError(null)
    onSubmit(normalize(fields, values))
  }

  return (
    <form id={id} className="form" onSubmit={submit} noValidate>
      {!hideVisibility && <div className="setting-row field--full" style={{ padding: 14 }}>
        <div>
          <b style={{ fontSize: 14 }}>Visibilité</b>
          <p>{visible ? 'Affiché dans la vue commune, pour tout le conseil.' : 'Privé : seul ton pôle et les superviseurs le voient.'}</p>
        </div>
        <VisibilityToggle visible={visible} onChange={onVisible} disabled={disabled} />
      </div>}

      {fields.map((f) => {
        const v = values[f.key]
        const common = { id: `${id}-${f.key}`, disabled, className: 'input' }
        let control
        switch (f.type) {
          case 'textarea':
            control = <textarea {...common} value={(v as string) ?? ''} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
            break
          case 'select':
            control = (
              <select {...common} value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )
            break
          case 'member':
            control = (
              <select {...common} value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">—</option>
                {[...members].sort((a, b) => a.name.localeCompare(b.name)).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            )
            break
          case 'activity':
            control = (
              <select {...common} value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">Aucune</option>
                {[...activities].sort((a, b) => a.month.localeCompare(b.month)).map((a) => (
                  <option key={a.id} value={a.id}>{a.title} · {capitalize(monthLabel(a.month, 'short'))}</option>
                ))}
              </select>
            )
            break
          case 'poles': {
            const chosen = Array.isArray(v) ? (v as string[]) : []
            control = (
              <div className="pole-picker" role="group" aria-label={f.label}>
                {POLES.map((p) => {
                  const on = chosen.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={disabled}
                      aria-pressed={on}
                      className={`pole-chip ${on ? 'is-on' : ''}`}
                      onClick={() => set(f.key, on ? chosen.filter((x) => x !== p.id) : [...chosen, p.id])}
                    >
                      <span className="pole-chip__code">{p.code}</span>
                      {p.short}
                    </button>
                  )
                })}
              </div>
            )
            break
          }
          case 'boolean':
            control = (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 42 }}>
                <input type="checkbox" id={common.id} disabled={disabled} checked={!!v} onChange={(e) => set(f.key, e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--ink)' }} />
                <span style={{ fontSize: 14 }}>Oui</span>
              </label>
            )
            break
          default:
            control = (
              <input
                {...common}
                type={f.type === 'number' ? 'number' : f.type}
                inputMode={f.type === 'number' ? 'numeric' : undefined}
                value={v === null || v === undefined ? '' : String(v)}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )
        }
        return (
          <div key={f.key} className={`field ${f.full || f.type === 'textarea' ? 'field--full' : ''}`}>
            <span><label htmlFor={common.id}>{f.label}</label>{f.required && <span className="dim"> *</span>}</span>
            {control}
            {f.hint && <small>{f.hint}</small>}
          </div>
        )
      })}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}
