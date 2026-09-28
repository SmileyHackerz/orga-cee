import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { AuthField, AuthLayout } from '../components/AuthLayout'
import { rise } from '../components/ui'

const INITIAL = 'passer123'

export function FirstPassword() {
  const { profile, changePassword, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const rules = [
    { ok: password.length >= 8, text: 'Au moins 8 caractères' },
    { ok: password.length > 0 && password !== INITIAL, text: 'Différent du mot de passe provisoire' },
    { ok: confirm.length > 0 && confirm === password, text: 'Les deux saisies sont identiques' },
  ]
  const valid = rules.every((r) => r.ok)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) {
      setError('Vérifie les trois conditions ci-dessous.')
      return
    }
    setBusy(true)
    setError(await changePassword(password))
    setBusy(false)
  }

  return (
    <AuthLayout>
      <motion.h1 variants={rise}>Bienvenue, {profile?.full_name.split(' ')[0]}</motion.h1>
      <motion.p variants={rise} className="login__lead">
        C’est ta première connexion. Choisis ton propre mot de passe : c’est lui que tu utiliseras désormais, le mot de passe provisoire ne fonctionnera plus.
      </motion.p>

      <motion.form variants={rise} className="auth-form" onSubmit={submit} noValidate>
        <AuthField label="Nouveau mot de passe" icon={LockKeyhole} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        <AuthField label="Confirme le mot de passe" icon={ShieldCheck} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        <ul className="pw-rules" aria-live="polite">
          {rules.map((r) => (
            <li key={r.text} className={r.ok ? 'is-ok' : ''}>
              <span className="pw-rules__dot">{r.ok && <Check size={11} strokeWidth={3} />}</span>
              {r.text}
            </li>
          ))}
        </ul>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy || !valid}>
          <span>{busy ? 'Enregistrement…' : 'Enregistrer et entrer'}</span>
          {!busy && <ArrowRight size={18} />}
        </button>
      </motion.form>

      <motion.button variants={rise} type="button" className="auth-link" onClick={() => void logout()}>
        Ce n’est pas moi, se déconnecter
      </motion.button>
    </AuthLayout>
  )
}
