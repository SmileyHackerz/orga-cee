import { Suspense, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  CalendarDays, LayoutGrid, LogOut, Megaphone, Menu, PanelLeftClose, PanelLeftOpen, ScrollText, Search, SlidersHorizontal, Wallet, X,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { usePublishedRows } from '../lib/store'
import { isLate } from '../lib/derived'
import { POLES, poleById } from '../lib/poles'
import type { PoleId } from '../lib/types'
import { resetDemo } from '../lib/localBackend'
import { Avatar, EASE, Skeleton } from './ui'
import { CommandPalette } from './CommandPalette'

const ICONS: Record<PoleId, typeof LayoutGrid> = {
  logistique: CalendarDays,
  communication: Megaphone,
  finance: Wallet,
  secretariat: ScrollText,
}

function NavItem({ to, icon: Icon, label, code, badge, end, group, collapsed }: {
  to: string
  icon?: typeof LayoutGrid
  label: string
  code?: string
  badge?: number
  end?: boolean
  group: string
  collapsed?: boolean
}) {
  return (
    <NavLink to={to} end={end} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId={`nav-active-${group}`} className="nav-link__bg" transition={{ type: 'spring', stiffness: 480, damping: 38 }} />}
          {Icon ? <Icon size={18} strokeWidth={1.8} /> : null}
          <span>{label}</span>
          {badge ? <span className="nav-badge" aria-label={`${badge} en retard`}>{badge}</span> : code ? <span className="nav-link__code">{code}</span> : <span />}
        </>
      )}
    </NavLink>
  )
}

function SessionClock({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(t)
  }, [])
  const min = Math.max(0, Math.ceil((endsAt - now) / 60_000))
  return (
    <span className={`me__session ${min <= 5 ? 'is-soon' : ''}`} title="Par sécurité, la session dure au maximum 1 heure.">
      Session : {min} min
    </span>
  )
}

function Sidebar({ onSearch, group, onClose, collapsed = false, onToggle }: { onSearch: () => void; group: string; onClose?: () => void; collapsed?: boolean; onToggle?: () => void }) {
  const { profile, isSupervisor, logout, mode, sessionEndsAt } = useAuth()
  const tasks = usePublishedRows('tasks')
  const incidents = usePublishedRows('incidents')
  const navigate = useNavigate()

  const alerts = useMemo(() => {
    const out: Partial<Record<PoleId, number>> = {}
    tasks.filter(isLate).forEach((t) => (out[t.pole] = (out[t.pole] ?? 0) + 1))
    const open = incidents.filter((i) => i.status === 'ouvert').length
    if (open) out.logistique = (out.logistique ?? 0) + open
    return out
  }, [tasks, incidents])

  if (!profile) return null
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="brand">
        <Link className="brand__link" to="/" aria-label="ORGA, retour à l’accueil" title="Retour à l’accueil" onClick={onClose}>
          <img className="brand__mark" src="/orga-mark.png" alt="" width={44} height={44} />
          <div className="brand__text">
            <span className="brand__word">ORGA</span>
            <span className="brand__sub">Commission · CEE ESP</span>
          </div>
        </Link>
        {onToggle && (
          <button
            className="icon-btn sidebar__toggle"
            aria-label={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
            onClick={onToggle}
          >
            {collapsed ? <PanelLeftOpen size={19} strokeWidth={1.8} /> : <PanelLeftClose size={19} strokeWidth={1.8} />}
          </button>
        )}
        {onClose && (
          <button className="icon-btn" aria-label="Fermer le menu" onClick={onClose} style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
            <X size={20} />
          </button>
        )}
      </div>

      <button className="search-btn" onClick={onSearch} aria-label="Rechercher" title={collapsed ? 'Rechercher' : undefined}>
        <Search size={16} strokeWidth={1.8} /> <span className="search-btn__text">Rechercher</span>
        <kbd>{mac ? '⌘' : 'Ctrl'} K</kbd>
      </button>

      <nav className="nav-group" aria-label="Zones">
        <div className="nav-group__label">Zones</div>
        <NavItem group={group} to="/" end icon={LayoutGrid} label="Vue commune" collapsed={collapsed} />
        {POLES.map((p) => (
          <NavItem group={group} key={p.id} to={p.path} icon={ICONS[p.id]} label={p.short} code={p.code} badge={alerts[p.id]} collapsed={collapsed} />
        ))}
      </nav>

      <nav className="nav-group" aria-label="Administration">
        <div className="nav-group__label">
          <span>Admin</span>
          {isSupervisor && <span style={{ letterSpacing: '.1em' }}>Lecture seule</span>}
        </div>
        {profile.pole && !isSupervisor && (
          <NavItem group={group} to={`/admin/${profile.pole}`} icon={SlidersHorizontal} label="Mon espace admin" code={poleById(profile.pole).code} collapsed={collapsed} />
        )}
        {isSupervisor && (
          <>
            <NavItem group={group} to="/admin" end icon={SlidersHorizontal} label="Espaces admin" collapsed={collapsed} />
            <div className="nav-sub">
              {POLES.map((p) => (
                <NavItem group={group} key={p.id} to={`/admin/${p.id}`} label={p.short} code={p.code} />
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="me">
        <div className="me__card">
          <Avatar name={profile.full_name} size={36} />
          <div style={{ minWidth: 0 }}>
            <div className="me__name">{profile.full_name}</div>
            <span className="me__role">{profile.title}</span>
            {sessionEndsAt && <SessionClock endsAt={sessionEndsAt} />}
            <span className={`me__access ${isSupervisor ? '' : 'me__access--crew'}`}>
              {isSupervisor ? 'Accès complet' : `Équipe · ${profile.pole ? poleById(profile.pole).code : ''}`}
            </span>
          </div>
          <button
            className="icon-btn"
            aria-label="Se déconnecter"
            title={mode === 'demo' ? 'Changer de profil' : 'Se déconnecter'}
            onClick={async () => {
              await logout()
              navigate('/connexion')
            }}
          >
            <LogOut size={17} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function AppShell() {
  const { mode } = useAuth()
  const location = useLocation()
  const [menu, setMenu] = useState(false)
  const [palette, setPalette] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('orga-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const toggleSidebar = () =>
    setCollapsed((v) => {
      try {
        localStorage.setItem('orga-sidebar', v ? 'open' : 'collapsed')
      } catch {
        /* ignore */
      }
      return !v
    })

  useEffect(() => setMenu(false), [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`app ${collapsed ? 'is-collapsed' : ''}`}>
      <Sidebar onSearch={() => setPalette(true)} group="desk" collapsed={collapsed} onToggle={toggleSidebar} />

      <div className="main">
        <header className="topbar">
          <Link className="brand brand__link" to="/" aria-label="ORGA, retour à l’accueil">
            <img className="brand__mark" src="/orga-mark.png" alt="" width={34} height={34} />
            <span className="brand__word">ORGA</span>
          </Link>
          <button className="icon-btn" aria-label="Rechercher" onClick={() => setPalette(true)}>
            <Search size={19} />
          </button>
          <button className="icon-btn" aria-label="Ouvrir le menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <Menu size={21} />
          </button>
        </header>

        {mode === 'demo' && (
          <div className="demo-bar">
            <strong>Mode démo</strong>
            <span>Données d’exemple, visibles dans ce navigateur seulement.</span>
            <button
              onClick={() => {
                resetDemo()
                window.location.reload()
              }}
            >
              Réinitialiser la démo
            </button>
          </div>
        )}

        <motion.main
          key={location.pathname}
          className="page"
          initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <Suspense fallback={<Skeleton lines={5} />}>
            <Outlet />
          </Suspense>
        </motion.main>
      </div>

      <AnimatePresence>
        {menu && (
          <div className="mobile-nav-root">
            <motion.div className="mobile-nav-scrim" onClick={() => setMenu(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <Sidebar onSearch={() => { setMenu(false); setPalette(true) }} group="mobile" onClose={() => setMenu(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
