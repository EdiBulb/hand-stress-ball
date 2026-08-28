import { getRedis } from './redis.js'

const SIXTY_DAYS_IN_SECONDS = 60 * 24 * 60 * 60

function todayKey(): string {
  // UTC date, not Auckland local time -- simplest option, and "today" here
  // is just a fun little counter, not something that needs to be precise.
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `stats:visits:${y}-${m}-${day}`
}

export interface VisitCounts {
  total: number
  today: number
}

export async function recordVisit(): Promise<VisitCounts> {
  const redis = getRedis()
  const key = todayKey()
  const [total, today] = await Promise.all([redis.incr('stats:visits:total'), redis.incr(key)])
  // Daily keys are cheap but there's no reason to keep them forever -- let
  // each one expire after two months.
  await redis.expire(key, SIXTY_DAYS_IN_SECONDS)
  return { total, today }
}
