import type { BallRecord } from './ballStore'

const REVIEW_URL = 'https://hand-stress-ball.vercel.app/moderate'

// Posts a rich-embed message to a Discord webhook whenever someone uploads
// a new ball, so Harry doesn't have to keep checking /moderate manually.
// Configure by adding a DISCORD_WEBHOOK_URL env var (Server Settings ->
// Integrations -> Webhooks in Discord). If it's not set, this is a no-op --
// a missing/broken webhook should never break the actual upload.
export async function notifyNewBall(record: BallRecord): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: `New ball: ${record.name}`,
            description: `by ${record.creatorName} -- material: ${record.materialId}`,
            url: REVIEW_URL,
            image: { url: record.imageUrl },
          },
        ],
      }),
    })
  } catch (err) {
    console.error('[balls] discord notify failed:', err instanceof Error ? err.message : err)
  }
}
