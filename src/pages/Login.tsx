import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Clock, KeyRound, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { COUNCIL } from '../lib/poles'
import { AuthField, AuthLayout } from '../components/AuthLayout'
import { Avatar, Button, rise } from '../components/ui'

export function Login() {
  const { profile, mode, unlinkedEmail, loginDemo, loginPassword, logout, logoutReason } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (profile) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(await loginPassword(email.trim(), password))
    setBusy(false)
  }

  return (
    <AuthLayout>
      <motion.h1 variants={rise}>Espace du conseil</motion.h1>

      {mode === 'demo' ? (
        <>
          <motion.p variants={rise} className="login__lead">Mode démo : choisis un membre du conseil pour voir l’app avec ses droits.</motion.p>
          <div className="profiles">
            {COUNCIL.map((p) => (
              <motion.button
                key={p.id}
                variants={rise}
                className="profile-card"
                onClick={() => {
                  loginDemo(p.id)
                  navigate('/')
                }}
              >
                <Avatar name={p.full_name} size={40} tone={p.kind === 'supervisor' ? 'gold' : 'ink'} />
                <span>
                  <b>{p.full_name}</b>
                  <small>{p.title}</small>
                  {p.kind === 'supervisor' && <span className="me__access">Accès complet</span>}
                </span>
              </motion.button>
            ))}
          </div>
        </>
      ) : unlinkedEmail !== null ? (
        <>
          <motion.p variants={rise} className="login__lead">
            Le compte {unlinkedEmail || 'utilisé'} existe, mais il n’est pas encore rattaché à un membre du conseil. Demande à l’administrateur de l’app de l’ajouter.
          </motion.p>
          <motion.div variants={rise} style={{ marginTop: 22 }}>
            <Button variant="line" onClick={() => void logout()}>Se déconnecter</Button>
          </motion.div>
        </>
      ) : (
        <>
          <motion.p variants={rise} className="login__lead">Connecte-toi avec ton adresse e-mail pour accéder à l’espace de la Commission.</motion.p>
          {logoutReason === 'expired' && (
            <motion.p variants={rise} className="session-note" role="status">
              <Clock size={16} /> Ta session a expiré : par sécurité, la connexion dure au maximum 1 heure. Reconnecte-toi.
            </motion.p>
          )}
          <motion.form variants={rise} className="auth-form" onSubmit={submit} noValidate>
            <AuthField label="E-mail" icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder="prenom.nom@gmail.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthField label="Mot de passe" icon={LockKeyhole} type="password" autoComplete="current-password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy || !email || !password}>
              <span>{busy ? 'Connexion…' : 'Se connecter'}</span>
              {!busy && <ArrowRight size={18} />}
            </button>
          </motion.form>
          <motion.p variants={rise} className="auth-hint">
            <KeyRound size={15} />
            <span><b>Première connexion ?</b> Utilise le mot de passe provisoire qui t’a été envoyé : tu choisiras le tien juste après.</span>
          </motion.p>
        </>
      )}
    </AuthLayout>
  )
}
