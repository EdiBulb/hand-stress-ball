// Client for the authenticated /moderate endpoints. The secret is sent as a
// header on every request; ModeratePage.tsx is the only caller.
import type { GalleryBall } from './ballsApi'

const SECRET_STORAGE_KEY = 'hand-stress-ball:moderation-secret'

export function getStoredSecret(): string | null {
  return sessionStorage.getItem(SECRET_STORAGE_KEY)
}

export function storeSecret(secret: string): void {
  sessionStorage.setItem(SECRET_STORAGE_KEY, secret)
}

export function clearStoredSecret(): void {
  sessionStorage.removeItem(SECRET_STORAGE_KEY)
}

class UnauthorizedError extends Error {}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

async function moderationFetch(path: string, secret: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    headers: { ...init?.headers, 'x-moderation-secret': secret },
  })
  if (res.status === 401) {
    throw new UnauthorizedError('Invalid moderation secret.')
  }
  return res
}

export { UnauthorizedError }

export async function fetchPendingBalls(secret: string): Promise<GalleryBall[]> {
  const res = await moderationFetch('/api/balls/pending', secret)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Failed to load pending balls.'))
  }
  const data = (await res.json()) as { balls: GalleryBall[] }
  return data.balls
}

export async function approveBall(id: string, secret: string): Promise<void> {
  const res = await moderationFetch(`/api/balls/${id}`, secret, { method: 'PATCH' })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Failed to approve.'))
  }
}

export async function rejectBall(id: string, secret: string): Promise<void> {
  const res = await moderationFetch(`/api/balls/${id}`, secret, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Failed to reject.'))
  }
}
