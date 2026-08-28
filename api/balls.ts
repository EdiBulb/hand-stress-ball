import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { IncomingForm, type File as FormidableFile } from 'formidable'
import { VALID_MATERIAL_IDS, addBallId, getAllBalls, saveBall, type BallRecord } from './_lib/ballStore'
import { notifyNewBall } from './_lib/discord'

// Keep uploads well under Vercel's default request body limit (4.5MB) so we
// get our own clear error instead of a generic platform-level failure.
const MAX_FILE_SIZE = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_NAME_LENGTH = 40

// Vercel auto-parses JSON/urlencoded bodies by default, which would consume
// the request stream before formidable (our multipart parser) can read it.
// This turns that off so we get the raw stream ourselves.
export const config = {
  api: {
    bodyParser: false,
  },
}

// This one file handles both public directions of the gallery feature:
//   POST /api/balls  -> upload a new ball (pending approval)
//   GET  /api/balls  -> list *approved* balls only (public, no auth)
// Reviewing/approving pending balls lives in api/balls/pending.ts and
// api/balls/[id].ts, both of which require the moderation secret.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') return handleUpload(req, res)
  if (req.method === 'GET') return handleList(req, res)
  res.status(405).json({ error: 'Method Not Allowed' })
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

async function handleUpload(req: VercelRequest, res: VercelResponse) {
  const form = new IncomingForm({ maxFileSize: MAX_FILE_SIZE })

  let fields: Record<string, string | string[] | undefined>
  let files: Record<string, FormidableFile | FormidableFile[] | undefined>
  try {
    ;[fields, files] = await form.parse(req)
  } catch {
    return res.status(400).json({ error: 'File is too large or the request format is invalid (4MB max).' })
  }

  const file = firstValue(files.image as unknown as string | string[]) as unknown as FormidableFile | undefined
  const name = firstValue(fields.name)
  const creatorName = firstValue(fields.creatorName)
  const materialId = firstValue(fields.materialId)

  // --- Validation. Never trust the browser -- anyone can call this API
  // directly (curl, another app, a bot), so every check the frontend does
  // must be re-checked here too. ---
  if (!file) {
    return res.status(400).json({ error: 'An image file is required.' })
  }
  const mimeType = file.mimetype ?? ''
  if (!ALLOWED_TYPES.has(mimeType)) {
    return res.status(400).json({ error: 'Only PNG, JPEG, and WEBP images are allowed.' })
  }
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Please enter a name.' })
  }
  if (!creatorName?.trim()) {
    return res.status(400).json({ error: 'Please enter your name.' })
  }
  if (!materialId || !VALID_MATERIAL_IDS.has(materialId)) {
    return res.status(400).json({ error: 'Please choose a valid material.' })
  }

  const id = randomUUID()

  // 1) Put the actual image bytes in the warehouse (Blob). formidable
  // already saved the upload to a temp file on disk; we read it back into
  // memory to hand to Blob.
  const buffer = await readFile(file.filepath)
  const blob = await put(`balls/${id}.png`, buffer, {
    access: 'public',
    contentType: mimeType,
  })

  // 2) Write the lightweight catalog card (Redis) that points at it.
  const record: BallRecord = {
    id,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    creatorName: creatorName.trim().slice(0, MAX_NAME_LENGTH),
    imageUrl: blob.url,
    materialId,
    createdAt: Date.now(),
    approved: false, // starts hidden until manually approved -- see backend-plan.ko.md
  }

  await saveBall(record)
  await addBallId(id)
  await notifyNewBall(record)

  res.status(201).json({ id, status: 'pending' })
}

async function handleList(_req: VercelRequest, res: VercelResponse) {
  // Public endpoint -- always approved-only, regardless of any query
  // string. Pending/unapproved balls are only ever exposed to the
  // authenticated /moderate page (api/balls/pending.ts).
  const balls = (await getAllBalls()).filter((ball) => ball.approved)
  res.status(200).json({ balls })
}
