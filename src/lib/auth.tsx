import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PoleId, Profile } from './types'
import { COUNCIL } from './poles'
import { supabase } from './supabase'

interface AuthValue {
  mode: 'demo' | 'supabase'
  profile: Profile | null
  /** Signed in with Supabase, but no council profile is linked to this account yet. */
  unlinkedEmail: string | null
  ready: boolean
  mustChangePassword: boolean
  changePassword: (password: string) => Promise<string | null>
  isSupervisor: boolean
  canEdit: (pole: PoleId) => boolean
  canSeePrivate: (pole: PoleId) => boolean
  loginDemo: (id: string) => void
  loginPassword: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  /** When the current Supabase session is forcibly ended (1 h after sign-in). */
  sessionEndsAt: number | null
  logoutReason: 'expired' | null
}

const AuthContext = createContext<AuthValue | null>(null)
const DEMO_KEY = 'orga-demo-profile'
export const SESSION_MAX_MS = 60 * 60 * 1000

/** Sign-in time from the signed JWT "amr" claim: the same value the database checks in session_fresh(). */
function signedInAt(accessToken: string | undefined): number | null {
  if (!accessToken) return null
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { amr?: { timestamp: number }[] }
    const stamps = (payload.amr ?? []).map((a) => a.timestamp).filter(Number.isFinite)
    return stamps.length ? Math.max(...stamps) * 1000 : null
  } catch {
    return null
  }
}

function readDemoProfile(): Profile | null {
  try {
    const id = localStorage.getItem(DEMO_KEY)
    return COUNCIL.find((p) => p.id === id) ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode = supabase ? 'supabase' : 'demo'
  const [profile, setProfile] = useState<Profile | null>(() => (mode === 'demo' ? readDemoProfile() : null))
  const [ready, setReady] = useState(mode === 'demo')
  const [unlinkedEmail, setUnlinkedEmail] = useState<string | null>(null)
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null)
  const [logoutReason, setLogoutReason] = useState<'expired' | null>(null)

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    const loadProfile = async (session: { user: { id: string; email?: string }; access_token: string } | null | undefined) => {
      const user = session?.user
      if (!user) {
        setProfile(null)
        setUnlinkedEmail(null)
        setSessionEndsAt(null)
        setReady(true)
        return
      }
      const started = signedInAt(session.access_token)
      const ends = (started ?? Date.now()) + SESSION_MAX_MS
      if (Date.now() >= ends) {
        setLogoutReason('expired')
        await client.auth.signOut()
        return
      }
      setSessionEndsAt(ends)
      setLogoutReason(null)
      const { data } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setProfile((data as Profile) ?? null)
      setUnlinkedEmail(data ? null : user.email ?? '')
      setReady(true)
    }
    client.auth.getSession().then(({ data }) => loadProfile(data.session))
    // Supabase advises against awaiting its own calls inside this callback; defer the profile read.
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => void loadProfile(session), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Hard stop 1 h after sign-in. The database refuses the stale token anyway; this ends the UI cleanly.
  useEffect(() => {
    if (!supabase || !sessionEndsAt) return
    const client = supabase
    const expire = () => {
      setLogoutReason('expired')
      setSessionEndsAt(null)
      void client.auth.signOut()
    }
    const check = () => {
      if (Date.now() >= sessionEndsAt) expire()
    }
    const timer = setTimeout(expire, Math.max(0, sessionEndsAt - Date.now()))
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [sessionEndsAt])

  const loginDemo = useCallback((id: string) => {
    const p = COUNCIL.find((c) => c.id === id) ?? null
    try {
      if (p) localStorage.setItem(DEMO_KEY, p.id)
    } catch {
      /* ignore */
    }
    setProfile(p)
  }, [])

  const loginPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Supabase non configuré.'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    return error.message.includes('Invalid login')
      ? 'E-mail ou mot de passe incorrect.'
      : 'Connexion impossible pour le moment. Réessaie dans un instant.'
  }, [])

  const changePassword = useCallback(async (password: string) => {
    if (!supabase) return 'Supabase non configuré.'
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      if (/different from the old/i.test(error.message)) return 'Choisis un mot de passe différent de passer123.'
      if (/at least/i.test(error.message)) return 'Mot de passe trop court.'
      if (/weak|pwned|leaked/i.test(error.message)) return 'Ce mot de passe est trop facile à deviner. Choisis-en un autre.'
      return 'Impossible d’enregistrer le mot de passe pour le moment. Réessaie dans un instant.'
    }
    const { data: unlocked, error: flagError } = await supabase.rpc('password_changed')
    if (flagError) return 'Mot de passe enregistré, mais la confirmation a échoué. Recharge la page.'
    if (unlocked === false) return 'Le mot de passe n’a pas été modifié. Choisis-en un différent de passer123.'
    setProfile((p) => (p ? { ...p, must_change_password: false } : p))
    return null
  }, [])

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    try {
      localStorage.removeItem(DEMO_KEY)
    } catch {
      /* ignore */
    }
    setProfile(null)
    setUnlinkedEmail(null)
    setSessionEndsAt(null)
  }, [])

  const value = useMemo<AuthValue>(() => {
    const isSupervisor = profile?.kind === 'supervisor'
    return {
      mode,
      profile,
      unlinkedEmail,
      ready,
      mustChangePassword: mode === 'supabase' && profile?.must_change_password === true,
      changePassword,
      isSupervisor,
      canEdit: (pole) => profile?.kind === 'president' && profile.pole === pole,
      canSeePrivate: (pole) => isSupervisor || profile?.pole === pole,
      loginDemo,
      loginPassword,
      logout,
      sessionEndsAt,
      logoutReason,
    }
  }, [mode, profile, unlinkedEmail, ready, loginDemo, loginPassword, changePassword, logout, sessionEndsAt, logoutReason])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const v = useContext(AuthContext)
  if (!v) throw new Error('AuthProvider manquant')
  return v
}
