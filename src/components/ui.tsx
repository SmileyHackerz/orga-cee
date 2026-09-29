import {
  createContext, useCallback, useContext, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { Check, Eye, EyeOff, Lock, X } from 'lucide-react'
import type { PoleId } from '../lib/types'
import { poleById, initials } from '../lib/poles'

export const EASE = [0.16, 1, 0.3, 1] as const

/* ---------- small atoms ---------- */

export function PoleTag({ pole, tone = 'ink' }: { pole: PoleId; tone?: 'ink' | 'gold' | 'line' }) {
  const p = poleById(pole)
  return (
    <span className={`pole-tag pole-tag--${tone}`} title={p.name}>
      {p.code}
    </span>
  )
}

export type Tone = 'neutral' | 'ink' | 'gold' | 'red' | 'muted' | 'ok'

/** Only states that ask for attention get a filled pill; ordinary states read as quiet text. */
export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  if (tone === 'neutral' || tone === 'muted') return <span className="quiet-status">{children}</span>
  return (
    <motion.span
      key={String(children)}
      className={`pill pill--${tone}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {children}
    </motion.span>
  )
}

export function Avatar({ name, size = 32, tone = 'gold' }: { name: string; size?: number; tone?: 'gold' | 'ink' | 'stone' }) {
  return (
    <span className={`avatar avatar--${tone}`} style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }} aria-hidden>
      {initials(name)}
    </span>
  )
}

export function PrivateBadge() {
  return (
    <span className="private-badge" title="Visible seulement par le pôle et les superviseurs">
      <Lock size={11} strokeWidth={2.4} /> Privé
    </span>
  )
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'ghost' | 'line' | 'gold' | 'danger'
  size?: 'sm' | 'md'
  icon?: ReactNode
}

export function Button({ variant = 'line', size = 'md', icon, children, className = '', ...rest }: BtnProps) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      {icon}
      {children && <span>{children}</span>}
    </button>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {action}
    </div>
  )
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  )
}

/* ---------- numbers ---------- */

export function CountUp({ value, suffix = '', pad = 0 }: { value: number; suffix?: string; pad?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const from = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const out = (n: number) => `${String(Math.round(n)).padStart(pad, '0')}${suffix}`
    if (reduce) {
      el.textContent = out(value)
      return
    }
    const controls = animate(from.current, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => (el.textContent = out(v)),
    })
    from.current = value
    return () => controls.stop()
  }, [value, suffix, pad, reduce])
  return <span ref={ref} className="tabular">{`${String(value).padStart(pad, '0')}${suffix}`}</span>
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

export function Countdown({ to }: { to: Date }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ms = to.getTime() - now
  if (ms <= 0) return <span className="countdown countdown--live">En cours</span>
  const { d, h, m, s } = parts(ms)
  const cells: [number, string][] = d > 0 ? [[d, 'j'], [h, 'h'], [m, 'min']] : [[h, 'h'], [m, 'min'], [s, 's']]
  return (
    <span className="countdown" aria-label={`Dans ${d} jours ${h} heures ${m} minutes`}>
      {cells.map(([v, u]) => (
        <span key={u} className="countdown__cell">
          <span className="countdown__num">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={v}
                initial={{ y: '-60%', opacity: 0, filter: 'blur(2px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: '60%', opacity: 0, filter: 'blur(2px)' }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                {String(v).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="countdown__unit">{u}</span>
        </span>
      ))}
    </span>
  )
}

/* ---------- controls ---------- */

export function Segmented<T extends string>({
  options, value, onChange, label, size = 'md',
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
}) {
  const id = useId()
  return (
    <div className={`segmented segmented--${size}`} role="tablist" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={o.value} role="tab" aria-selected={on} className={`segmented__opt ${on ? 'is-on' : ''}`} onClick={() => onChange(o.value)}>
            {on && <motion.span layoutId={`seg-${id}`} className="segmented__thumb" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
            <span className="segmented__label">
              {o.label}
              {o.count !== undefined && <span className="segmented__count">{o.count}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function VisibilityToggle({ visible, onChange, disabled }: { visible: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`vis ${visible ? 'is-on' : ''}`}
      aria-pressed={visible}
      aria-label={visible ? 'Affiché au conseil' : 'Privé au pôle'}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!visible)
      }}
      title={visible ? 'Visible par tout le conseil — cliquer pour rendre privé' : 'Privé au pôle — cliquer pour afficher au conseil'}
    >
      <span className="vis__track">
        <motion.span className="vis__knob" layout transition={{ type: 'spring', stiffness: 600, damping: 36 }}>
          {visible ? <Eye size={12} strokeWidth={2.4} /> : <EyeOff size={12} strokeWidth={2.4} />}
        </motion.span>
      </span>
      <span className="vis__text">{visible ? 'Affiché' : 'Privé'}</span>
    </button>
  )
}

export function ConfirmButton({ onConfirm, children, disabled }: { onConfirm: () => void; children: ReactNode; disabled?: boolean }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3500)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button type="button" disabled={disabled} className={`btn btn--sm ${armed ? 'btn--danger' : 'btn--ghost'}`} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      <span>{armed ? 'Confirmer la suppression' : children}</span>
    </button>
  )
}

export function CheckBox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} disabled={disabled} className={`check ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <motion.span initial={false} animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }} transition={{ type: 'spring', stiffness: 700, damping: 30 }}>
        <Check size={13} strokeWidth={3} />
      </motion.span>
    </button>
  )
}

/* ---------- drawer ---------- */

export function Drawer({ open, onClose, title, children, footer, wide }: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => panel.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="drawer-root">
          <motion.div className="drawer-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
          <motion.aside
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className={`drawer ${wide ? 'drawer--wide' : ''}`}
            initial={{ x: '104%' }}
            animate={{ x: 0 }}
            exit={{ x: '104%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 42 }}
          >
            <header className="drawer__head">
              <div className="drawer__title">{title}</div>
              <button className="icon-btn" onClick={onClose} aria-label="Fermer">
                <X size={18} />
              </button>
            </header>
            <motion.div className="drawer__body" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4, ease: EASE }}>
              {children}
            </motion.div>
            {footer && <footer className="drawer__foot">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ---------- toasts ---------- */

interface Toast {
  id: number
  text: string
  tone: 'ok' | 'error'
}
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((l) => [...l.slice(-2), { id, text, tone }])
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              className={`toast toast--${t.tone}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            >
              {t.tone === 'ok' ? <Check size={15} strokeWidth={2.6} /> : <X size={15} strokeWidth={2.6} />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

/* ---------- layout helpers ---------- */

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
export const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export function Card({ title, action, children, className = '', id }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <motion.section variants={rise} className={`card ${className}`} id={id}>
      {(title || action) && (
        <header className="card__head">
          {title && <h2 className="card__title">{title}</h2>}
          {action && <div className="card__action">{action}</div>}
        </header>
      )}
      {children}
    </motion.section>
  )
}
