/** Plain-English labels for the schemes a stage's manifest names (SPEC.md section 5). */
export const TRUST: Record<string, Record<string, string>> = {
  admission: {
    'devote-issued-v1': 'Who can vote: admitted by Devote after identity verification, checked against independent counts (see audits). An independent issuer will replace this.',
  },
  membership: { 'semaphore-v4': 'One vote per person: anonymous membership proofs with a one-time code per bill.' },
  encryption: { 'hpke-xwing-v1': 'During the vote: rows encrypted (post-quantum hybrid) so only the attested counting program can read them.' },
  tally: { 'reveal-and-count-v1': 'Results: every counted row is published at close and anyone can recount.' },
  disclosure: { 'sdc-kl-v1': 'Privacy: published groups are large and mixed enough that no one can be singled out.' },
  slice: { 'confidential-space-dp-v1': 'Live and detailed statistics: computed inside attested hardware, with small groups hidden and noise added.' },
}

export function trustLines(schemes: Record<string, string | string[]> | undefined): string[] {
  if (!schemes) return []
  const out: string[] = []
  for (const [port, id] of Object.entries(schemes)) {
    if (Array.isArray(id)) continue
    out.push(TRUST[port]?.[id] ?? `${port}: ${id}`)
  }
  return out
}

const FIELD_LABELS: Record<string, string> = { area: 'Area', ageBand: 'Age', ethnicity: 'Ethnicity', religion: 'Religion', sex: 'Sex', disability: 'Disability' }
const LEVEL_LABELS: Record<string, string> = { constituency: 'constituency', region: 'region', nation: 'nation', '5y': '5-year bands', '10y': '10-year bands', '20y': '20-year bands', detailed: 'detailed', broad: 'broad groups' }
export const tableTitle = (t: { rowType: string; dimension?: string; field: string; level: string }) => `${FIELD_LABELS[t.dimension ?? t.field] ?? t.dimension ?? t.field} (${LEVEL_LABELS[t.level] ?? t.level})`
