import { httpFetcher, LOG_ORIGIN, parseVerifierKey, readLog, type LogSnapshot } from '@devotedemocracy/record-verifier'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { LOG_BASE_URL, logKey } from './config.ts'

/**
 * Loads the whole log once, in the browser: fetches the signed checkpoint and every entry,
 * checks the signature, that each entry is canonical and valid, and that they hash to the
 * signed root. Nothing on the page comes from anywhere else.
 */
export type RecordState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'empty' }
  | { status: 'error'; error: string }
  | { status: 'ok'; log: LogSnapshot; verifiedAt: Date; keyString: string }

const Ctx = createContext<RecordState>({ status: 'loading' })
export const useRecord = () => use(Ctx)

export function RecordProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RecordState>({ status: 'loading' })
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const keyString = await logKey()
      if (!LOG_BASE_URL || !keyString) return setState({ status: 'unconfigured' })
      try {
        const fetcher = httpFetcher(LOG_BASE_URL)
        try { await fetcher('checkpoint') } catch { return setState({ status: 'empty' }) }
        const log = await readLog(fetcher, await parseVerifierKey(keyString), LOG_ORIGIN)
        if (!cancelled) setState({ status: 'ok', log, verifiedAt: new Date(), keyString })
      } catch (e) {
        if (!cancelled) setState({ status: 'error', error: e instanceof Error ? e.message : String(e) })
      }
    })()
    return () => { cancelled = true }
  }, [])
  return <Ctx value={state}>{children}</Ctx>
}

export const isOpen = (body: Record<string, any>, now = Date.now()) => Date.parse(body.opensAt) <= now && now < Date.parse(body.closesAt)
export const formatDate = (iso: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' }).format(new Date(iso))
