import Redis from 'ioredis'

// Vercel keeps a function "warm" between requests, so we cache the Redis
// connection at module scope instead of reconnecting on every request.
// Shared by ballStore.ts and visitStore.ts so every function reuses the
// same connection instead of opening one each.
let redisClient: Redis | null = null

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL!, {
      // Fail fast instead of hanging forever if the network/TLS handshake
      // doesn't work -- much easier to debug than an infinite hang.
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    })
    redisClient.on('error', (err) => {
      // Without a listener here, connection errors crash the function
      // instead of surfacing a readable message.
      console.error('[redis] client error:', err.message)
    })
  }
  return redisClient
}
