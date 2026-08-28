import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireModerationSecret } from '../_lib/auth.js'
import { deleteBall, getBall, saveBall } from '../_lib/ballStore.js'

// PATCH  /api/balls/:id -- approve a pending ball
// DELETE /api/balls/:id -- reject (permanently remove) a ball
// Both require the moderation secret header; used only by /moderate.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireModerationSecret(req, res)) return

  const id = typeof req.query.id === 'string' ? req.query.id : undefined
  if (!id) {
    return res.status(400).json({ error: 'Missing ball id.' })
  }

  if (req.method === 'PATCH') {
    const ball = await getBall(id)
    if (!ball) return res.status(404).json({ error: 'Ball not found.' })
    ball.approved = true
    await saveBall(ball)
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    await deleteBall(id)
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method Not Allowed' })
}
