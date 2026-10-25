import { FlaskConical } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { DEMO, SPEC_URL, VERIFIER_URL } from '../config.ts'

const nav = [
  { to: '/', label: 'Record', end: true },
  { to: '/entries', label: 'All entries' },
  { to: '/how-it-works', label: 'How it works' },
]

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      {DEMO && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
          <FlaskConical className="size-4" /> Demo: synthetic data for testing, not the real record.
        </div>
      )}
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <NavLink to="/" className="flex items-baseline gap-2 text-slate-900 no-underline hover:no-underline dark:text-white">
            <span className="font-display text-2xl">Devote</span>
            <span className="text-sm font-semibold tracking-wide text-brand-600 uppercase dark:text-brand-200">Public Record</span>
          </NavLink>
          <nav className="flex flex-wrap gap-1 text-sm">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `rounded-lg px-3 py-1.5 font-medium no-underline hover:no-underline ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 text-sm text-slate-500 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-3 px-4 py-6">
          <span>Every check on this site runs in your browser, against the public log.</span>
          <span className="flex gap-4">
            <a href={SPEC_URL}>Specification</a>
            <a href={VERIFIER_URL}>Open-source verifier</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
