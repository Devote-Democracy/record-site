import { useState } from 'react'
import { Link } from 'react-router'
import { WithRecord } from '../components/Status.tsx'
import { useRecord } from '../record.tsx'

const TYPES = ['all', 'manifest', 'admission', 'revocation', 'ballot', 'reveal', 'tally', 'snapshot', 'query', 'audit', 'appBuild', 'anchor'] as const
const PAGE = 50

export default function EntriesPage() {
  return (
    <div>
      <h1 className="text-3xl">All entries</h1>
      <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">Everything in the log, in order. Ballots are anonymous: their contents stay encrypted until the vote closes, and each voter’s last ballot is then published at the level of detail that keeps them unidentifiable.</p>
      <div className="mt-6"><WithRecord><List /></WithRecord></div>
    </div>
  )
}

function summary(type: string, body: any): string {
  switch (type) {
    case 'manifest': return `${body.legislation.title} · ${body.stage.label}`
    case 'admission': return `Credential admitted to ${body.franchise}`
    case 'revocation': return `Credential retired (${body.reason})`
    case 'ballot': return `${body.rowType === 'demographic' ? `Demographic row (${body.dimension})` : body.rowType === 'full' ? 'Full row (never published)' : 'Ballot'} for vote #${body.manifest}`
    case 'reveal': return `${body.rows.length} rows published for vote #${body.manifest}`
    case 'tally': return `Result for vote #${body.manifest}`
    case 'appBuild': return `${body.platform} ${body.version} (${body.build})`
    case 'anchor': return `Checkpoint ${body.checkpoint.size} anchored (${body.scheme})`
    case 'audit': return `Audit: ${body.kind}`
    case 'query': return `Live query on vote #${body.manifest}: by ${body.descriptor.groupBy.join(', ') || 'total'}`
    case 'snapshot': return `Live snapshot fingerprint for vote #${body.manifest}`
    default: return type
  }
}

function List() {
  const state = useRecord()
  const [type, setType] = useState<(typeof TYPES)[number]>('all')
  const [page, setPage] = useState(0)
  if (state.status !== 'ok') return null
  const all = state.log.entries.filter((e) => type === 'all' || e.envelope.type === type).reverse()
  const shown = all.slice(page * PAGE, (page + 1) * PAGE)
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button key={t} onClick={() => { setType(t); setPage(0) }} className={`pill border ${type === t ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'}`}>{t === 'all' ? 'All' : t}</button>
        ))}
      </div>
      <ul className="card mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {shown.map((e) => (
          <li key={e.index}>
            <Link to={`/entries/${e.index}`} className="flex items-baseline gap-4 px-4 py-3 text-slate-800 no-underline hover:bg-slate-50 hover:no-underline dark:text-slate-200 dark:hover:bg-slate-800/50">
              <span className="w-14 shrink-0 font-mono text-xs text-slate-500">#{e.index}</span>
              <span className="w-24 shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-200">{e.envelope.type}</span>
              <span className="min-w-0 truncate text-sm">{summary(e.envelope.type, e.envelope.body)}</span>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">No entries of this type.</li>}
      </ul>
      {all.length > PAGE && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <button className="btn-quiet" disabled={page === 0} onClick={() => setPage(page - 1)}>Newer</button>
          <span className="text-slate-500">{page * PAGE + 1}–{Math.min((page + 1) * PAGE, all.length)} of {all.length}</span>
          <button className="btn-quiet" disabled={(page + 1) * PAGE >= all.length} onClick={() => setPage(page + 1)}>Older</button>
        </div>
      )}
    </>
  )
}
