import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ChoiceBar } from '../components/Bars.tsx'
import { Check, WithRecord } from '../components/Status.tsx'
import { formatDate, isOpen, useRecord } from '../record.tsx'

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl">Every vote on Devote, checkable by anyone.</h1>
        <Lede />
      </section>
      <WithRecord>
        <Verified />
        <Stages />
      </WithRecord>
    </div>
  )
}

function Lede() {
  const state = useRecord()
  const anchored = state.status === 'ok' && state.log.entries.some((e) => e.envelope.type === 'anchor')
  return (
    <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
      Votes are anonymous. The record of them is public and permanent, {anchored ? 'and anchored in public blockchains (Bitcoin and Ethereum),' : 'and is being anchored in public blockchains (Bitcoin and Ethereum),'} so nobody (Devote included) can change it without being caught. This page has just checked it, in your browser.
    </p>
  )
}

function Verified() {
  const state = useRecord()
  if (state.status !== 'ok') return null
  const { log, verifiedAt } = state
  const anchors = log.entries.filter((e) => e.envelope.type === 'anchor').length
  return (
    <section className="card p-6">
      <h2 className="text-xl">Checked in your browser</h2>
      <ul className="mt-4 space-y-2">
        <Check ok>The latest checkpoint is signed by the record’s published key ({log.checkpoint.origin}).</Check>
        <Check ok>All {log.checkpoint.size.toLocaleString()} entries downloaded, each well formed and in canonical form.</Check>
        <Check ok>Together they hash to the signed root, so none was changed, removed or reordered.</Check>
        <Check ok={anchors > 0 ? true : null}>{anchors > 0 ? `${anchors} anchors in Bitcoin and Ethereum fix earlier checkpoints in public chains.` : 'Anchors in Bitcoin and Ethereum will appear here once published.'}</Check>
      </ul>
      <p className="mt-4 text-xs text-slate-500">Checked {verifiedAt.toLocaleString('en-GB')}. Want to check without this site? <Link to="/how-it-works">Use the open-source verifier</Link>.</p>
    </section>
  )
}

function Stages() {
  const state = useRecord()
  if (state.status !== 'ok') return null
  const manifests = state.log.entries.filter((e) => e.envelope.type === 'manifest').reverse()
  const tallies = new Map(state.log.entries.filter((e) => e.envelope.type === 'tally').map((e) => [e.envelope.body.manifest as number, e.envelope.body]))
  return (
    <section>
      <h2 className="text-2xl">Votes</h2>
      {manifests.length === 0 && <p className="mt-3 text-slate-500">No votes have opened yet.</p>}
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {manifests.map((m) => {
          const b = m.envelope.body
          const tally = tallies.get(m.index)
          const open = isOpen(b)
          return (
            <li key={m.index} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{b.stage.label}</div>
                  <h3 className="mt-1 text-lg">{b.legislation.title}</h3>
                </div>
                <span className={`pill ${open ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : tally ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'}`}>{open ? 'Open' : tally ? 'Closed' : 'Counting'}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{formatDate(b.opensAt)} to {formatDate(b.closesAt)}</p>
              <div className="mt-4 flex-1">{tally ? <ChoiceBar counts={tally.totals} choices={b.choices} labels={b.choiceLabels} /> : <p className="text-sm text-slate-500">{open ? 'Results are published when the vote closes.' : 'Results are being published.'}</p>}</div>
              <Link to={`/stage/${m.index}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Details and recount <ArrowRight className="size-4" /></Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
