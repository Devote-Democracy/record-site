import { SPEC_URL, VERIFIER_URL } from '../config.ts'

export default function HowPage() {
  return (
    <article className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-4xl">How the record works</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Devote runs the app, so you shouldn’t have to take our word for the results. This record lets anyone check them, and its design stops us seeing whose vote is whose.</p>
      </div>
      <Section title="1. One public log that can only grow">
        Every voter admission, anonymous ballot and result is an entry in one append-only log. Its state is summed up in a signed checkpoint, and checkpoints are fixed in Bitcoin every hour and Ethereum every day. Changing or removing anything afterwards would break those fingerprints for everyone to see.
      </Section>
      <Section title="2. Anonymous ballots, one per person">
        Your phone proves you’re an admitted elector without revealing which one, and attaches a one-time code for the bill, so nobody can vote twice. Ballots travel through an independent relay, so we can’t tell where they came from.
      </Section>
      <Section title="3. Sealed until the vote closes">
        During the vote, ballot contents are encrypted so only an attested counting program can read them. It gives us live totals and breakdowns, never individual rows. At close it publishes each voter’s last ballot, at the level of detail that keeps everyone unidentifiable, and anyone can check the published values against what was committed during the vote.
      </Section>
      <Section title="4. Recount it yourself">
        Every result can be recounted from the published rows: on this site, in your browser, or with the open-source command-line verifier.
      </Section>
      <section className="card p-6">
        <h2 className="text-xl">What this doesn’t prove, yet</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>Who may vote is decided by Devote after identity verification. The record shows every admission and independent checks on them, and an independent issuer will take over this step.</li>
          <li>Devote’s votes are advisory, not official elections, and people who vote on Devote are not a representative sample of the public.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl">Check it without this site</h2>
        <pre className="card mt-3 overflow-x-auto p-4 font-mono text-xs">npx record-verify log --base &lt;record URL&gt; --key &lt;record key&gt;{'\n'}npx record-verify recount --base &lt;record URL&gt; --key &lt;record key&gt; --manifest &lt;entry number&gt;</pre>
        <p className="mt-3 text-sm">Read the <a href={SPEC_URL}>specification</a> and the <a href={VERIFIER_URL}>verifier’s source</a>, or write your own.</p>
      </section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-2 text-slate-700 dark:text-slate-300">{children}</p>
    </section>
  )
}
