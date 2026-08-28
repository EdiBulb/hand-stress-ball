import type { VercelRequest, VercelResponse } from '@vercel/node'

// Very small shared-secret check for the /moderate review page. Not
// enterprise-grade auth -- just enough to keep this off of search engines
// and casual visitors. The secret lives in the MODERATION_SECRET env var
// (set it in Vercel: Settings -> Environments, same way as REDIS_URL).
export function requireModerationSecret(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.MODERATION_SECRET
  if (!expected) {
    res.status(500).json({ error: 'MODERATION_SECRET is not configured on the server.' })
    return false
  }
  const provided = req.headers['x-moderation-secret']
  if (provided !== expected) {
    res.status(401).json({ error: 'Invalid moderation secret.' })
    return false
  }
  return true
}
