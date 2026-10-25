import { recountStage, type StageRecount } from '@devotedemocracy/record-verifier'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChoiceBar, choiceLabel } from '../components/Bars.tsx'
import { Check, Notice, WithRecord } from '../components/Status.tsx'
import { formatDate, isOpen, useRecord } from '../record.tsx'
import { tableTitle, trustLines } from '../trust.ts'

export default function StagePage() {
  return (
    <WithRecord>
      <Stage />
    </WithRecord>
  )
}

function Stage() {
  const state = useRecord()
  const index = Number(useParams().index)
  if (state.status !== 'ok') return null
  const entry = state.log.entries[index]
  if (!entry || entry.envelope.type !== 'manifest') return <p>There’s no vote at entry {index}.</p>
  const m = entry.envelope
  const b = m.body
  const tally = state.log.entries.find((e) => e.envelope.type === 'tally' && e.envelope.body.manifest === index)?.envelope.body
  const ballots = state.log.entries.filter((e) => e.envelope.type === 'ballot' && e.envelope.body.manifest === index)
  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-sm">← All votes</Link>
        <div className="mt-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{b.stage.label}</div>
        <h1 className="mt-1 text-3xl sm:text-4xl">{b.legislation.title}</h1>
        <p className="mt-2 text-slate-500">{formatDate(b.opensAt)} to {formatDate(b.closesAt)} · {isOpen(b) ? 'open now' : 'closed'} · <Link to={`/entries/${index}`}>manifest #{index}</Link></p>
      </div>

      <section className="card p-6">
        <h2 className="text-xl">Result</h2>
        {tally ? (
          <>
            <div className="mt-4"><ChoiceBar counts={tally.totals} choices={b.choices} /></div>
            <p className="mt-3 text-sm text-slate-500">{(Object.values(tally.totals) as number[]).reduce((n, v) => n + v, 0).toLocaleString()} votes counted. The log holds {ballots.length.toLocaleString()} ballot entries for this vote: votes, demographic rows, changed votes (only each voter’s last counts) and rows that stay private.</p>
          </>
        ) : (
          <p className="mt-3 text-slate-500">{isOpen(b) ? 'The vote is open. Ballots are logged as they arrive, encrypted; results and rows are published at close.' : 'Results haven’t been published yet.'}</p>
        )}
      </section>

      {tally && <Recount index={index} />}

      {tally && tally.tables.length > 0 && (
        <section>
          <h2 className="text-2xl">Breakdowns</h2>
          <p className="mt-1 text-sm text-slate-500">Each table is recomputed by the check above. Groups smaller than {b.disclosure.k} people, or where everyone chose the same, are never published.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {tally.tables.map((t: any) => (
              <div key={`${t.rowType}-${t.dimension ?? ''}-${t.field}-${t.level}`} className="card p-5">
                <h3 className="text-lg">{tableTitle(t)}</h3>
                <ul className="mt-3 space-y-4">
                  {[...t.rows].sort((a: any, z: any) => String(a.value).localeCompare(String(z.value))).map((r: any) => (
                    <li key={String(r.value)}>
                      <div className="mb-1 text-sm font-medium">{String(r.value)}</div>
                      <ChoiceBar counts={r.counts} choices={b.choices} legend={false} />
                      <div className="mt-1 text-xs text-slate-500">{b.choices.map((c: string) => `${choiceLabel(c)} ${r.counts[c] ?? 0}`).join(' · ')}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-6">
        <h2 className="text-xl">How this vote is protected</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {trustLines(m.schemes).map((l) => <li key={l}>{l}</li>)}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Disclosure rules: at least {b.disclosure.k} people and {b.disclosure.l} different choices in every published group.</p>
      </section>
    </div>
  )
}

function Recount({ index }: { index: number }) {
  const state = useRecord()
  const [result, setResult] = useState<StageRecount | 'running' | null>(null)
  if (state.status !== 'ok') return null
  const run = async () => {
    setResult('running')
    // The Groth16 verifier is large, so it loads only when someone recounts.
    const { verifyBallotProof } = await import('@devotedemocracy/record-verifier/semaphore')
    setResult(await recountStage(state.log.entries, index, { verifyProof: verifyBallotProof }))
  }
  const errors = result && result !== 'running' ? result.issues.filter((i) => i.severity === 'error') : []
  const warnings = result && result !== 'running' ? result.issues.filter((i) => i.severity === 'warning') : []
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl">Recount it yourself</h2>
          <p className="mt-1 text-sm text-slate-500">Runs in your browser on the entries already checked against the signed log.</p>
        </div>
        <button className="btn" onClick={run} disabled={result === 'running'}><Play className="size-4" /> {result === 'running' ? 'Checking every proof…' : result ? 'Recount again' : 'Recount'}</button>
      </div>
      {result && result !== 'running' && (
        <>
          <ul className="mt-5 space-y-2">
            <Check ok={!errors.some((e) => e.message.includes('commitment'))}>Every published value matches what was committed during the vote.</Check>
            <Check ok={!errors.some((e) => e.message.includes('final ballot') || e.message.includes('not revealed'))}>Exactly each voter’s last ballot was published; none was dropped or added.</Check>
            <Check ok={!errors.some((e) => e.message.startsWith('Invalid ballot'))}>Every ballot carries a valid anonymous proof that it comes from this vote’s frozen electorate, binds its contents, and is its voter’s only one per bill.</Check>
            <Check ok={result.disclosureViolations.length === 0}>No published group is small or uniform enough to single anyone out.</Check>
            <Check ok={result.tallyMatches}>The published result equals the recount: {Object.entries(result.totals).map(([c, n]) => `${choiceLabel(c)} ${n}`).join(', ')}.</Check>
          </ul>
          {errors.length > 0 && <div className="mt-4"><Notice tone="bad">{errors.length} problem{errors.length === 1 ? '' : 's'} found: {errors.slice(0, 5).map((e) => e.message).join(' · ')}</Notice></div>}
          {warnings.map((w) => <p key={w.message} className="mt-3 text-xs text-slate-500">Note: {w.message}</p>)}
        </>
      )}
    </section>
  )
}
