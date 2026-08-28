import type { VercelRequest, VercelResponse } from '@vercel/node'
import { recordVisit } from './_lib/visitStore.js'

// GET /api/visits -- records a page view and returns the running totals.
// Deliberately a plain GET (like a classic "hit counter" badge) since this
// is a lightweight, side-effect-ok read used by the small visitor counter
// on the main screen.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  try {
    const counts = await recordVisit()
    res.status(200).json(counts)
  } catch {
    res.status(500).json({ error: 'Failed to record visit.' })
  }
}
