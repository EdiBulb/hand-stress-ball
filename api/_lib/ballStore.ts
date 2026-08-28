// Shared Redis-backed storage for the ball gallery. Anything under api/_lib
// is a normal module, not a route -- Vercel skips underscore-prefixed
// folders when building the api/ file-based routes.
import { getRedis } from './redis'

export interface BallRecord {
  id: string
  name: string
  creatorName: string
  imageUrl: string
  materialId: string
  createdAt: number
  approved: boolean
}

// Kept as a plain list (not imported from src/materials/materials.ts) on
// purpose -- that file imports browser-only image assets via Vite's asset
// pipeline, which a plain Node function can't resolve. Keep this in sync by
// hand if a material is added or removed.
export const VALID_MATERIAL_IDS = new Set([
  'wax-bubble',
  'globe',
  'orange',
  'water',
  'sand',
  'wood',
  'toxic-gas',
  'static',
  'slime',
  'snowball',
  'brick',
])

export async function getAllBalls(): Promise<BallRecord[]> {
  const redis = getRedis()
  const ids = await redis.lrange('ball:ids', 0, -1)
  if (ids.length === 0) return []

  const rawRecords = await redis.mget(...ids.map((id) => `ball:${id}`))
  return rawRecords
    .filter((raw): raw is string => raw !== null)
    .map((raw) => JSON.parse(raw) as BallRecord)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function getBall(id: string): Promise<BallRecord | null> {
  const redis = getRedis()
  const raw = await redis.get(`ball:${id}`)
  return raw ? (JSON.parse(raw) as BallRecord) : null
}

export async function saveBall(record: BallRecord): Promise<void> {
  const redis = getRedis()
  await redis.set(`ball:${record.id}`, JSON.stringify(record))
}

export async function addBallId(id: string): Promise<void> {
  const redis = getRedis()
  await redis.lpush('ball:ids', id)
}

export async function deleteBall(id: string): Promise<void> {
  const redis = getRedis()
  await redis.del(`ball:${id}`)
  await redis.lrem('ball:ids', 0, id)
}
