import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { EASE, stagger } from './ui'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="login">
      <div className="login__art">
        <motion.div className="login__plate" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE }}>
          <img src="/orga-logo.jpg" alt="Logo de la Commission Organisation" width={1059} height={992} />
        </motion.div>
        <div className="login__brand">
          <motion.div className="login__word" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}>
            ORGA
          </motion.div>
          <p className="login__motto">Commission Organisation du CEE · ESP<span> — </span><em>L’engagement au service des valeurs</em></p>
        </div>
      </div>

      <div className="login__panel">
        <motion.div className="login__box" variants={stagger} initial="hidden" animate="show">
          {children}
        </motion.div>
      </div>
    </div>
  )
}

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  icon: LucideIcon
  type?: 'email' | 'password' | 'text'
}

export function AuthField({ label, icon: Icon, type = 'text', ...input }: AuthFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-field__box">
        <Icon size={18} strokeWidth={1.8} className="auth-field__icon" aria-hidden />
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          {...input}
          onFocus={(e) => {
            input.onFocus?.(e)
            // On phones the keyboard opens after focus; bring the field above it once the viewport has resized.
            const el = e.currentTarget
            if (window.matchMedia('(max-width: 860px)').matches) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320)
          }}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-field__eye"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        )}
      </div>
    </div>
  )
}
