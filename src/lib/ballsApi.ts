// Thin wrapper around the /api/balls endpoints -- the frontend never talks
// to Blob or Redis directly, only to our own API (see backend-plan.ko.md).

export interface GalleryBall {
  id: string
  name: string
  creatorName: string
  imageUrl: string
  materialId: string
  createdAt: number
}

interface ApiErrorBody {
  error?: string
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

export async function uploadBall(params: {
  image: Blob
  name: string
  creatorName: string
  materialId: string
}): Promise<{ id: string; status: string }> {
  const formData = new FormData()
  formData.append('image', params.image, 'ball.png')
  formData.append('name', params.name)
  formData.append('creatorName', params.creatorName)
  formData.append('materialId', params.materialId)

  const res = await fetch('/api/balls', { method: 'POST', body: formData })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Upload failed.'))
  }
  return res.json()
}

export async function fetchApprovedBalls(): Promise<GalleryBall[]> {
  const res = await fetch('/api/balls?approved=true')
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Failed to load the list.'))
  }
  const data = (await res.json()) as { balls: GalleryBall[] }
  return data.balls
}
