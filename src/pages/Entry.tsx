import { canonicalize, toHex } from '@devotedemocracy/record-verifier'
import { Link, useParams } from 'react-router'
import { WithRecord } from '../components/Status.tsx'
import { useRecord } from '../record.tsx'

export default function EntryPage() {
  return <WithRecord><Entry /></WithRecord>
}

function Entry() {
  const state = useRecord()
  const index = Number(useParams().index)
  if (state.status !== 'ok') return null
  const e = state.log.entries[index]
  if (!e) return <p>There’s no entry #{index}.</p>
  return (
    <div className="space-y-6">
      <div>
        <Link to="/entries" className="text-sm">← All entries</Link>
        <h1 className="mt-3 text-3xl">Entry #{index} <span className="text-brand-600 dark:text-brand-200">{e.envelope.type}</span></h1>
        {e.envelope.type === 'manifest' && <p className="mt-2"><Link to={`/stage/${index}`}>See this vote’s result and recount</Link></p>}
      </div>
      <dl className="card grid gap-x-6 gap-y-2 p-5 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="text-slate-500">Leaf hash</dt>
        <dd className="font-mono text-xs break-all">{toHex(state.log.leafHashes[index]!)}</dd>
        <dt className="text-slate-500">In the log</dt>
        <dd>Yes: it is part of the {state.log.checkpoint.size.toLocaleString()} entries that hash to the signed root checked on this visit.</dd>
        <dt className="text-slate-500">Size</dt>
        <dd>{new TextEncoder().encode(canonicalize(e.envelope)).length.toLocaleString()} bytes (canonical JSON)</dd>
      </dl>
      <pre className="card overflow-x-auto p-5 font-mono text-xs leading-relaxed">{JSON.stringify(e.envelope, null, 2)}</pre>
    </div>
  )
}
