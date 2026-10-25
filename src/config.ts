/** Where the log lives and which key signs it. Demo mode serves a synthetic log from /demo/. */
export const DEMO = import.meta.env.VITE_DEMO === '1'
export const LOG_BASE_URL: string = DEMO ? `${location.origin}/demo/` : (import.meta.env.VITE_LOG_BASE_URL ?? '')
export const ARWEAVE_GATEWAY: string = import.meta.env.VITE_ARWEAVE_GATEWAY ?? 'https://arweave.net'
export const SPEC_URL = 'https://github.com/Devote-Democracy/record-verifier/blob/main/SPEC.md'
export const VERIFIER_URL = 'https://github.com/Devote-Democracy/record-verifier'
export const SITE_SOURCE_URL = 'https://github.com/Devote-Democracy/record-site'

export async function logKey(): Promise<string> {
  if (DEMO) return (await (await fetch('/demo/key.txt')).text()).trim()
  return import.meta.env.VITE_LOG_KEY ?? ''
}
