import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireModerationSecret } from '../_lib/auth.js'
import { getAllBalls } from '../_lib/ballStore.js'

// GET /api/balls/pending -- balls waiting for review. Requires the
// moderation secret header; used only by the /moderate page.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  if (!requireModerationSecret(req, res)) return

  const balls = (await getAllBalls()).filter((ball) => !ball.approved)
  res.status(200).json({ balls })
}
