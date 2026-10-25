const COLOURS: Record<string, string> = { aye: 'bg-brand-500', no: 'bg-coral-brand', abstain: 'bg-slate-400' }
const colour = (choice: string, i: number) => COLOURS[choice] ?? ['bg-violet-brand', 'bg-amber-400', 'bg-teal-500'][i % 3]

export const choiceLabel = (c: string) => c.charAt(0).toUpperCase() + c.slice(1)

/** One stacked bar of counts by choice, with a legend. Small and readable at phone width. */
export function ChoiceBar({ counts, choices, legend = true }: { counts: Record<string, number>; choices: string[]; legend?: boolean }) {
  const total = choices.reduce((n, c) => n + (counts[c] ?? 0), 0)
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" aria-label={choices.map((c) => `${choiceLabel(c)} ${counts[c] ?? 0}`).join(', ')}>
        {total > 0 && choices.map((c, i) => <div key={c} className={colour(c, i)} style={{ width: `${((counts[c] ?? 0) / total) * 100}%` }} />)}
      </div>
      {legend && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {choices.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${colour(c, i)}`} />
              {choiceLabel(c)} <span className="font-semibold tabular-nums">{counts[c] ?? 0}</span>
              {total > 0 && <span className="text-slate-500 tabular-nums">({Math.round(((counts[c] ?? 0) / total) * 100)}%)</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
