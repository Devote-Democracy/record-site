/**
 * Writes a DEMO log to public/demo/ (checkpoint, entry tiles, verifier key) so the site can
 * be developed and tested before the real log exists. Everything is synthetic and every
 * entry says so. Built with the verifier's own functions, so the site exercises the real
 * verification path end to end.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  ballotMessage,
  buildEntryBundle,
  canonicalBytes,
  commitment,
  concat,
  entryBundlePath,
  leafHash,
  LOG_ORIGIN,
  noteKeyId,
  recountStage,
  rootHash,
  signedPayload,
  TILE_WIDTH,
  toBase64,
  toBase64Url,
  verifierKeyString,
  type Envelope,
  type LoggedEntry,
} from '@devotedemocracy/record-verifier'
import { releaseSemaphore, semaphoreMessage, semaphoreScope } from '@devotedemocracy/record-verifier/semaphore'
import { Group } from '@semaphore-protocol/group'
import { Identity } from '@semaphore-protocol/identity'
import { generateProof } from '@semaphore-protocol/proof'

const OUT = join(import.meta.dirname, '..', 'public', 'demo')
const enc = new TextEncoder()
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n))

const logKey = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair
const logPub = new Uint8Array(await crypto.subtle.exportKey('raw', logKey.publicKey))
const admissionKey = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair
const admissionPub = new Uint8Array(await crypto.subtle.exportKey('raw', admissionKey.publicKey))

const log: LoggedEntry[] = []
const add = (envelope: Envelope) => { log.push({ index: log.length, envelope }); return log.length - 1 }

// Seeded pseudo-randomness, so the demo is stable in shape between runs.
let seed = 42
const next = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
const pick = <T,>(xs: T[]) => xs[Math.floor(next() * xs.length)]!

add({ v: 1, type: 'appBuild', body: { platform: 'ios', version: '0.0.0-demo', build: '1', sha256: '0'.repeat(64), repository: 'DEMO' } })
add({ v: 1, type: 'appBuild', body: { platform: 'android', version: '0.0.0-demo', build: '1', sha256: '1'.repeat(64), repository: 'DEMO' } })

// Admissions: 60 demo voters, each with a real Semaphore identity.
const VOTERS = 60
const identities = Array.from({ length: VOTERS }, () => new Identity())
const group = new Group(identities.map((id) => id.commitment))
for (let i = 0; i < VOTERS; i++) {
  const body: Record<string, any> = { franchise: 'gb-ukparl', commitment: identities[i]!.commitment.toString() }
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, admissionKey.privateKey, signedPayload('admission', { ...body, signatures: [] }) as BufferSource))
  body.signatures = [{ alg: 'ed25519', keyId: 'demo-admission-1', sig: toBase64Url(sig) }]
  add({ v: 1, type: 'admission', body })
}

const BILL = 'demo-bill-1'
const ROOT = group.root.toString()
const KEY = 'demo-stage-key-1'
const manifestIndex = add({
  v: 1,
  type: 'manifest',
  schemes: { admission: 'devote-issued-v1', membership: 'semaphore-v4', encryption: 'hpke-xwing-v1', transport: 'ohttp-v1', tally: 'reveal-and-count-v1', disclosure: 'sdc-kl-v1', slice: 'confidential-space-dp-v1', anchor: ['ots-bitcoin-v1', 'ethereum-l1-v1'], dataStore: ['arweave-v1', 'gcs-mirror-v1'] },
  body: {
    stageId: 'demo-bill-1-second-reading',
    billKey: BILL,
    legislation: { id: 'demo-bill-1', jurisdiction: 'gb', title: 'DEMO: Example Bill (synthetic data)' },
    stage: { id: 'second-reading', label: 'Second reading' },
    opensAt: '2026-11-02T09:00Z',
    closesAt: '2026-11-09T09:00Z',
    graceSeconds: 600,
    choices: ['aye', 'no', 'abstain'],
    franchises: ['gb-ukparl'],
    groupRoots: { 'gb-ukparl': { root: ROOT, size: VOTERS, depth: group.depth } },
    encryption: { keyId: KEY, publicKey: toBase64Url(rand(32)) },
    disclosure: { k: 5, l: 2, ladders: { area: ['constituency', 'region', 'nation'], age: ['5y', '10y', '20y'] }, minChoiceSupport: 1 },
    dimensions: ['age'],
    admissionKeys: [{ keyId: 'demo-admission-1', publicKey: toBase64Url(admissionPub) }],
    carryFrom: [],
    retentionUntil: '2028-11-09T09:00Z',
  },
})

type Secret = { values: Record<string, Record<string, string | boolean>>; salts: Record<string, Record<string, Uint8Array>> }
const secrets = new Map<number, Secret>()

async function cast(rowType: 'main' | 'demographic', voter: number, values: Secret['values'], dimension?: string) {
  const commitments: Record<string, Record<string, string>> = {}
  const salts: Secret['salts'] = {}
  for (const [field, levels] of Object.entries(values)) {
    commitments[field] = {}
    salts[field] = {}
    for (const [level, value] of Object.entries(levels)) {
      const salt = rand(32)
      salts[field]![level] = salt
      commitments[field]![level] = await commitment(field, level, value, salt)
    }
  }
  const ct = toBase64Url(rand(96))
  const scope = rowType === 'main' ? `bill:${BILL}` : `bill:${BILL}/dim:${dimension}`
  const message = await ballotMessage(commitments, ct)
  const proof = await generateProof(identities[voter]!, group, semaphoreMessage(message), await semaphoreScope(scope))
  const body: Record<string, any> = {
    manifest: manifestIndex,
    rowType,
    scope,
    franchise: 'gb-ukparl',
    groupRoot: ROOT,
    nullifier: proof.nullifier,
    message,
    proof: { merkleTreeDepth: proof.merkleTreeDepth, points: proof.points },
    commitments,
    ciphertext: { keyId: KEY, enc: toBase64Url(rand(32)), ct },
  }
  if (dimension) body.dimension = dimension
  const i = add({ v: 1, type: 'ballot', body })
  secrets.set(i, { values, salts })
  return i
}

const regions = [
  { region: 'E12000003', constituencies: ['E14001063', 'E14001064', 'E14001065'] },
  { region: 'E12000007', constituencies: ['E14001100', 'E14001101', 'E14001102'] },
]
// SPEC.md Appendix A ladders.
const ages = [['20-24', '20-29', '16-39'], ['35-39', '30-39', '16-39'], ['45-49', '40-49', '40-59'], ['60-64', '60-69', '60-79']]
const finals = new Map<string, number>()
for (let v = 0; v < 48; v++) {
  const r = pick(regions)
  const choice = next() < 0.55 ? 'aye' : next() < 0.85 ? 'no' : 'abstain'
  const area = { constituency: pick(r.constituencies), region: r.region, nation: 'E92000001' }
  finals.set(`m${v}`, await cast('main', v, { choice: { value: choice }, carry: { value: true }, area }))
  // A few voters change their mind; only the last ballot counts.
  if (v % 9 === 0) finals.set(`m${v}`, await cast('main', v, { choice: { value: choice === 'aye' ? 'no' : 'aye' }, carry: { value: true }, area }))
  const a = pick(ages)
  finals.set(`d${v}`, await cast('demographic', v, { choice: { value: choice }, carry: { value: true }, value: { '5y': a[0]!, '10y': a[1]!, '20y': a[2]! } }, 'age'))
}

// Reveal: area at region, age at 20-year bands (what disclosure control would choose at this size).
const rows = [...finals.entries()].map(([key, i]) => {
  const s = secrets.get(i)!
  const levels: Record<string, string> = key.startsWith('m') ? { choice: 'value', carry: 'value', area: 'region' } : { choice: 'value', carry: 'value', value: '20y' }
  return { ballot: i, fields: Object.fromEntries(Object.entries(levels).map(([f, l]) => [f, { level: l, value: s.values[f]![l]!, salt: toBase64Url(s.salts[f]![l]!) }])) }
})
const revealIndex = add({ v: 1, type: 'reveal', body: { manifest: manifestIndex, rows } })

const { verifyBallotProof } = await import('@devotedemocracy/record-verifier/semaphore')
const recount = await recountStage(log, manifestIndex, { verifyProof: verifyBallotProof })
add({
  v: 1,
  type: 'tally',
  body: {
    manifest: manifestIndex,
    reveals: [revealIndex],
    totals: recount.totals,
    tables: recount.tables,
    disclosureReport: { k: 5, l: 2, rowsCounted: recount.countedRows, fieldsGeneralised: recount.countedRows, fieldsWithheld: 0, heldBackForDifferencing: 0 },
  },
})

// Tiles and a signed checkpoint.
const raw = log.map((e) => canonicalBytes(e.envelope))
const root = await rootHash(await Promise.all(raw.map((e) => leafHash(e))))
const text = `${LOG_ORIGIN}\n${raw.length}\n${toBase64(root)}\nDEMO: synthetic data, not the real record\n`
const sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, logKey.privateKey, enc.encode(text)))
const note = `${text}\n— ${LOG_ORIGIN} ${toBase64(concat(await noteKeyId(LOG_ORIGIN, logPub), sig))}\n`

const write = (path: string, data: Uint8Array | string) => { const p = join(OUT, path); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, data) }
write('checkpoint', note)
for (let t = 0; t * TILE_WIDTH < raw.length; t++) {
  const slice = raw.slice(t * TILE_WIDTH, (t + 1) * TILE_WIDTH)
  write(entryBundlePath(t, slice.length), buildEntryBundle(slice))
}
write('key.txt', await verifierKeyString(LOG_ORIGIN, logPub))
await releaseSemaphore()
console.log(`demo log: ${raw.length} entries; totals ${JSON.stringify(recount.totals)}; issues ${recount.issues.filter((i) => i.severity === 'error').length} errors`)
