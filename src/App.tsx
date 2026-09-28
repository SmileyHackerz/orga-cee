import { lazy, useEffect, useMemo } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { AuthProvider, useAuth } from './lib/auth'
import { DataStore, StoreProvider } from './lib/store'
import { createLocalBackend } from './lib/localBackend'
import { createSupabaseBackend, supabase } from './lib/supabase'
import { AppShell } from './components/AppShell'
import { EmptyState, Skeleton, ToastProvider } from './components/ui'
import { Login } from './pages/Login'
import { FirstPassword } from './pages/FirstPassword'
import { Dashboard } from './pages/Dashboard'

const Logistique = lazy(() => import('./pages/Logistique').then((m) => ({ default: m.Logistique })))
const Communication = lazy(() => import('./pages/Communication').then((m) => ({ default: m.Communication })))
const Finance = lazy(() => import('./pages/Finance').then((m) => ({ default: m.Finance })))
const Secretariat = lazy(() => import('./pages/Secretariat').then((m) => ({ default: m.Secretariat })))
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))
const AdminIndex = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminIndex })))

function Protected() {
  const { profile, ready, mustChangePassword } = useAuth()
  const profileId = profile?.id
  const store = useMemo(
    () => (profileId ? new DataStore(supabase ? createSupabaseBackend(supabase) : createLocalBackend()) : null),
    [profileId],
  )
  useEffect(() => () => store?.dispose(), [store])

  if (!ready) return <div style={{ padding: 40 }}><Skeleton lines={4} /></div>
  if (!profile || !store) return <Navigate to="/connexion" replace />
  if (mustChangePassword) return <FirstPassword />
  return (
    <StoreProvider store={store}>
      <Outlet />
    </StoreProvider>
  )
}

function MissingConfig() {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <EmptyState title="Configuration manquante" text="Cette version en ligne n’est pas reliée à la base de données. L’administrateur doit renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY." />
    </div>
  )
}

export default function App() {
  if (import.meta.env.PROD && !supabase && import.meta.env.VITE_ALLOW_DEMO !== 'true') return <MissingConfig />
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/connexion" element={<Login />} />
              <Route element={<Protected />}>
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="logistique" element={<Logistique />} />
                  <Route path="communication" element={<Communication />} />
                  <Route path="finance" element={<Finance />} />
                  <Route path="secretariat" element={<Secretariat />} />
                  <Route path="admin" element={<AdminIndex />} />
                  <Route path="admin/:pole" element={<Admin />} />
                  <Route path="*" element={<EmptyState title="Page introuvable" text="Ce lien ne mène nulle part. Reviens à la vue commune." />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </MotionConfig>
  )
}
