import { useEffect, useState } from 'react'
import { recordVisit, type VisitCounts } from '../lib/visits'

const SESSION_KEY = 'hand-stress-ball:visit-counts'

function readCached(): VisitCounts | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw || raw === 'pending') return null
    return JSON.parse(raw) as VisitCounts
  } catch {
    return null
  }
}

// Small "today / total" text at the bottom of the main screen. Records one
// hit per browser tab session (cached in sessionStorage) rather than on
// every re-render -- this is a fun little detail, not real analytics.
export function VisitCounter() {
  const [counts, setCounts] = useState<VisitCounts | null>(() => readCached())

  useEffect(() => {
    if (counts) return
    if (sessionStorage.getItem(SESSION_KEY)) return
    // Mark "pending" synchronously so React StrictMode's double effect call
    // (dev-only) doesn't fire a second request before the first resolves.
    sessionStorage.setItem(SESSION_KEY, 'pending')
    recordVisit()
      .then((result) => {
        setCounts(result)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(result))
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!counts) return null

  return (
    <p className="visit-counter">
      Today: {counts.today} · Total: {counts.total}
    </p>
  )
}
