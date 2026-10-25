import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRecord } from '../record.tsx'

/** Renders children only once the log has been loaded and verified; otherwise explains why not. */
export function WithRecord({ children }: { children: ReactNode }) {
  const state = useRecord()
  if (state.status === 'loading') return <p className="flex items-center gap-2 text-slate-500"><Loader2 className="size-4 animate-spin" /> Downloading and checking the record…</p>
  if (state.status === 'unconfigured') return <Notice tone="info">The record isn’t connected yet. It starts with the first vote.</Notice>
  if (state.status === 'empty') return <Notice tone="info">The record is empty: no entries have been published yet.</Notice>
  if (state.status === 'error') return <Notice tone="bad">The record failed verification in your browser: {state.error}. Please tell us, and don’t rely on what this site shows until it’s explained.</Notice>
  return <>{children}</>
}

export function Notice({ tone, children }: { tone: 'info' | 'good' | 'bad'; children: ReactNode }) {
  const style = tone === 'bad' ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200' : tone === 'good' ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
  const Icon = tone === 'bad' ? AlertTriangle : CheckCircle2
  return <div className={`flex gap-3 rounded-xl border p-4 text-sm ${style}`}><Icon className="mt-0.5 size-4 shrink-0" /><div>{children}</div></div>
}

export function Check({ ok, children }: { ok: boolean | null; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok === null ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-slate-400" /> : ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />}
      <span>{children}</span>
    </li>
  )
}
