import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'
import { save } from '../lib/store.js'

const links = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/mock-exam', label: 'Mock Exam', icon: 'exam' },
]

// index.html applies the saved theme before paint; this keeps it in sync after.
function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    document.documentElement.classList.toggle('dark', !dark)
    save('cse-theme', dark ? 'light' : 'dark')
    setDark(!dark)
  }
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="grid h-10 w-10 place-items-center rounded-full bg-surface text-navy-950/70 ring-1 ring-navy-950/5 transition hover:text-navy-950"
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-navy-950/5 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-20 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="./csc-logo.png" alt="" className="h-8 w-auto dark:rounded-lg dark:bg-white dark:p-1 md:h-9" />
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight text-navy-950">CSE Reviewer</span>
              <span className="block text-[11px] font-medium text-navy-950/50">Professional &amp; Sub-Professional</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <nav aria-label="Main" className="hidden md:block">
              <ul className="flex items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-navy-950/5">
                {links.map((l) => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      end
                      className={({ isActive }) =>
                        `block rounded-full px-5 py-2 text-sm font-semibold transition ${
                          isActive ? 'bg-navy-900 text-white' : 'text-navy-950/60 hover:text-navy-950'
                        }`
                      }
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
        {/* key: re-clicking a nav link (e.g. Practice while inside a topic) resets that page */}
        <Outlet key={useLocation().key} />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-navy-950/40 md:px-6">
        Independent review tool. Not affiliated with or endorsed by the Civil Service Commission.
      </footer>

      {/* Mobile tab bar */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-950/5 bg-surface/95 backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-md justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {links.map((l) => (
            <li key={l.to} className="flex-1">
              <NavLink
                to={l.to}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${isActive ? 'text-navy-950' : 'text-navy-950/40'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition ${isActive ? 'bg-navy-100' : ''}`}>
                      <Icon name={l.icon} />
                    </span>
                    {l.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
