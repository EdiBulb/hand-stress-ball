#!/usr/bin/env node
// A tiny command-line admin tool for the ball gallery's manual approval
// queue (see backend-plan.ko.md, section 5). Run with:
//
//   node --env-file=.env.local scripts/moderate.mjs list
//   node --env-file=.env.local scripts/moderate.mjs approve <id>
//   node --env-file=.env.local scripts/moderate.mjs reject <id>
//
// --env-file loads REDIS_URL from .env.local for you (Node 20.6+, no extra
// package needed).

import Redis from 'ioredis'

const [, , command, arg] = process.argv

if (!process.env.REDIS_URL) {
  console.error('REDIS_URL is not set. Run it like this:')
  console.error('  node --env-file=.env.local scripts/moderate.mjs list')
  process.exit(1)
}

const redis = new Redis(process.env.REDIS_URL)

async function listBalls() {
  const ids = await redis.lrange('ball:ids', 0, -1)
  if (ids.length === 0) {
    console.log('No balls registered.')
    return
  }
  const raw = await redis.mget(...ids.map((id) => `ball:${id}`))
  for (const item of raw) {
    if (!item) continue
    const ball = JSON.parse(item)
    const mark = ball.approved ? '[APPROVED]' : '[PENDING]'
    console.log(`${mark} ${ball.id}  "${ball.name}" by ${ball.creatorName}  (material: ${ball.materialId})`)
  }
}

async function approveBall(id) {
  const key = `ball:${id}`
  const raw = await redis.get(key)
  if (!raw) {
    console.error("Couldn't find a ball with that id:", id)
    process.exitCode = 1
    return
  }
  const ball = JSON.parse(raw)
  ball.approved = true
  await redis.set(key, JSON.stringify(ball))
  console.log('Approved:', ball.name)
}

async function rejectBall(id) {
  await redis.del(`ball:${id}`)
  await redis.lrem('ball:ids', 0, id)
  console.log('Deleted (rejected):', id)
}

try {
  if (command === 'list') {
    await listBalls()
  } else if (command === 'approve' && arg) {
    await approveBall(arg)
  } else if (command === 'reject' && arg) {
    await rejectBall(arg)
  } else {
    console.log('Usage:')
    console.log('  node --env-file=.env.local scripts/moderate.mjs list')
    console.log('  node --env-file=.env.local scripts/moderate.mjs approve <id>')
    console.log('  node --env-file=.env.local scripts/moderate.mjs reject <id>')
  }
} finally {
  redis.disconnect()
}
