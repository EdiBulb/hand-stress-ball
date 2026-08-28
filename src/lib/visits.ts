export interface VisitCounts {
  total: number
  today: number
}

export async function recordVisit(): Promise<VisitCounts> {
  const res = await fetch('/api/visits')
  if (!res.ok) {
    throw new Error('Failed to record visit.')
  }
  return res.json()
}
