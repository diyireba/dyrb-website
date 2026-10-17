// Run explicitly after deploying and setting private environment variables.
const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET
let origin
try {
  const url = new URL(process.env.APP_URL || '')
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error()
  origin = url.origin
} catch { console.error('Set APP_URL to your public HTTPS website origin, for example https://your-venue.example.'); process.exit(1) }
if (!token || !secret || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) {
  console.error('Set TELEGRAM_BOT_TOKEN and a random TELEGRAM_WEBHOOK_SECRET (32–256 letters, numbers, underscores or hyphens).')
  process.exit(1)
}
async function api(method, body) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
    })
    const data = await response.json()
    if (!response.ok || !data.ok) throw new Error()
    return data.result
  } catch { throw new Error(`Telegram ${method} failed. Check the private token and connection; no credentials were printed.`) }
}
try {
  const bot = await api('getMe', {})
  await api('setWebhook', { url: `${origin}/api/telegram`, secret_token: secret, allowed_updates: ['message', 'callback_query'], max_connections: 5, drop_pending_updates: false })
  await api('setMyCommands', { commands: [
    { command: 'start', description: 'Get your ID for staff linking' },
    { command: 'help', description: 'Show staff commands' },
    { command: 'whoami', description: 'Show your Telegram ID' },
    { command: 'topicinfo', description: 'Show group/topic IDs for owner setup' },
    { command: 'songs', description: 'Show open song requests' },
    { command: 'orders', description: 'Show active orders' },
    { command: 'balance', description: 'Check member balance by phone (authorized staff)' },
  ] })
  console.log(`Connected @${bot.username}. Open the bot in a PRIVATE chat and send /whoami. Then link approved staff using docs/TELEGRAM.md.`)
} catch (error) { console.error(error.message); process.exitCode = 1 }
