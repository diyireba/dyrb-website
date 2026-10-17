import { timingSafeEqual } from 'node:crypto'

export type Request = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown }
export type Response = { status(code: number): Response; json(body: Record<string, unknown>): void }
export class TelegramError extends Error {
  constructor(public code: string, public retryAfter = 60) { super(code) }
}
export function secretMatches(actual: unknown, expected: string) {
  if (typeof actual !== 'string' || !expected) return false
  const a = new TextEncoder().encode(actual), b = new TextEncoder().encode(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
export function parseBody(body: unknown): any {
  const value = typeof body === 'string' ? JSON.parse(body) : body
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_body')
  return value
}
export function normalizeMemberPhone(value: string) {
  const compact = value.replace(/[\s()-]/g, '')
  const phone = compact.startsWith('+') ? compact : compact.startsWith('60') ? `+${compact}` : compact.startsWith('0') ? `+60${compact.slice(1)}` : ''
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null
}
export async function sendTelegram(token: string, chatId: string, text: string, fetcher = fetch) {
  let result: any
  try {
    const response = await fetcher(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3800), link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(6000),
    })
    result = await response.json()
    if (!response.ok || !result.ok) throw new TelegramError(`telegram_${result.error_code || response.status}`, Math.min(86400, Math.max(5, Number(result.parameters?.retry_after) || 60)))
  } catch (error) {
    // Never propagate fetch URLs or Telegram descriptions: the URL contains the bot token.
    if (error instanceof TelegramError) throw error
    throw new TelegramError('telegram_network')
  }
  return result.result?.message_id
}
function checked(result: any) { if (result.error) throw new Error('database_unavailable'); return result.data }
export async function staffAccess(db: any, telegramUserId: string) {
  const link = checked(await db.from('telegram_staff').select('staff_id,notify_songs,notify_orders').eq('telegram_user_id', telegramUserId).maybeSingle())
  if (!link) return null
  const staff = checked(await db.from('staff_profiles').select('user_id,role,active').eq('user_id', link.staff_id).maybeSingle())
  if (!staff?.active) return null
  const permissions = staff.role === 'owner' ? [] : checked(await db.from('role_permissions').select('permission_key').eq('role', staff.role).eq('enabled', true))
  return { ...link, ...staff, can: (key: string) => staff.role === 'owner' || permissions.some((p: any) => p.permission_key === key) }
}
export function orderText(order: any) {
  const items = order.order_items || []
  const total = items.reduce((sum: number, item: any) => sum + Number(item.unit_price) * item.quantity, 0)
  return [`New order · Table ${order.table_code}`, `Order ${order.id}`, `Total RM ${total.toFixed(2)} · Pay at counter`, ...items.map((i: any) => `${i.quantity} × ${i.item_name} · RM ${(Number(i.unit_price) * i.quantity).toFixed(2)}`)].join('\n')
}
export function songText(song: any) {
  return [`New song · Table ${song.table_code}`, song.title, song.artist ? `Artist: ${song.artist}` : '', song.dedication ? `Dedication: ${song.dedication}` : '', `Request ${song.id}`].filter(Boolean).join('\n')
}
export async function commandReply(db: any, userId: string, text: string) {
  const [rawCommand, ...args] = text.trim().split(/\s+/)
  const command = rawCommand.toLowerCase().split('@')[0]
  if (command === '/whoami' || command === '/start') return `Your Telegram ID: ${userId}\nAsk the venue owner to link this ID to your staff account. Then use /help.`
  const staff = await staffAccess(db, userId)
  if (!staff) return 'This Telegram account is not linked to an active staff account. Use /whoami and contact the venue owner.'
  if (command === '/help') return 'Staff commands:\n/songs — latest 10 open song requests\n/orders — latest 10 active orders\n/balance 0123456789 — member points and stored drinks (balance permission required)\n/whoami — your Telegram ID\nManage requests and orders in the staff website.'
  if (command === '/balance') {
    if (!staff.can('members.lookup') || !staff.can('members.adjust')) return 'Your staff role cannot view member balances.'
    const phone = normalizeMemberPhone(args.join(' '))
    if (!phone) return 'Use /balance followed by a valid member phone number, for example /balance 0123456789.'
    const member = checked(await db.from('members').select('id,display_name').eq('phone', phone).eq('active', true).maybeSingle())
    if (!member) return 'No active member found for that phone number.'
    const summary = checked(await db.from('member_balance_summary').select('points,beer_servings').eq('member_id', member.id).maybeSingle())
    const batches = checked(await db.from('member_stored_batches').select('item_name,item_type,quantity_remaining,expires_at').eq('member_id', member.id).gt('quantity_remaining', 0)) || []
    const usable = batches.filter((b: any) => !b.expires_at || Date.parse(b.expires_at) > Date.now())
    checked(await db.from('audit_log').insert({ actor_id: staff.user_id, action: 'telegram.member.balance', entity: 'members', entity_id: member.id }))
    return [member.display_name, `Points: ${summary?.points || 0}`, ...usable.slice(0, 20).map((b: any) => `${b.item_name}: ${b.quantity_remaining}${b.expires_at ? ` (expires ${new Date(b.expires_at).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })})` : ''}`), usable.length > 20 ? 'More stored items are available in the staff website.' : '', !usable.length ? 'No unexpired stored drinks.' : '', Number(summary?.beer_servings) ? `Legacy beer balance: ${summary.beer_servings} (confirm in website before collection)` : ''].filter(Boolean).join('\n')
  }
  if (command === '/songs') {
    if (!staff.can('songs.view')) return 'Your staff role cannot view song requests.'
    const songs = checked(await db.from('song_requests').select('table_code,title,artist,status').in('status', ['pending', 'approved', 'singing']).order('created_at', { ascending: false }).limit(10)) || []
    return songs.length ? songs.map((s: any) => `Table ${s.table_code} · ${s.title}${s.artist ? ` — ${s.artist}` : ''} · ${s.status}`).join('\n') : 'No open song requests.'
  }
  if (command === '/orders') {
    if (!staff.can('orders.view')) return 'Your staff role cannot view orders.'
    const orders = checked(await db.from('orders').select('id,table_code,status,order_items(quantity,unit_price)').in('status', ['new', 'preparing', 'ready']).order('created_at', { ascending: false }).limit(10)) || []
    return orders.length ? orders.map((o: any) => `Table ${o.table_code} · ${o.status} · RM ${(o.order_items || []).reduce((sum: number, i: any) => sum + i.quantity * Number(i.unit_price), 0).toFixed(2)} · ${o.id.slice(0, 8)}`).join('\n') : 'No active orders.'
  }
  return 'Unknown command. Use /help.'
}

export function createWebhookHandler({ db, token, secret, fetcher = fetch }: any) {
  return async (req: Request, res: Response) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
    if (!db || !token || !secret) return res.status(503).json({ error: 'Telegram is not configured.' })
    if (!secretMatches(req.headers['x-telegram-bot-api-secret-token'], secret)) return res.status(401).json({ error: 'Unauthorized.' })
    let update: any
    try { update = parseBody(req.body) } catch { return res.status(400).json({ error: 'Invalid request.' }) }
    if (!Number.isSafeInteger(update.update_id) || update.update_id < 0) return res.status(400).json({ error: 'Invalid update.' })
    const message = update.message
    // Member data and staff commands never go into groups, channels, or forwarded identities.
    if (!message || message.chat?.type !== 'private' || !Number.isSafeInteger(message.from?.id) || message.from.id <= 0 || message.chat.id !== message.from.id || message.from.is_bot || typeof message.text !== 'string') return res.status(200).json({ ok: true })
    const userId = String(message.from.id)
    let lease: string
    try {
      const claim = checked(await db.rpc('claim_telegram_update', { p_update_id: update.update_id, p_user_id: userId }))
      if (claim.state === 'done') return res.status(200).json({ ok: true })
      if (claim.state !== 'claimed') return res.status(503).json({ error: 'Update is being processed.' })
      lease = claim.lease_id
      const recent = await db.from('telegram_updates').select('update_id', { count: 'exact', head: true }).eq('telegram_user_id', userId).gte('created_at', new Date(Date.now() - 60000).toISOString())
      if (recent.error) throw new Error('database_unavailable')
      // Quietly consume floods instead of generating additional Telegram replies.
      if (recent.count <= 15) {
        const reply = await commandReply(db, userId, message.text.slice(0, 512))
        await sendTelegram(token, userId, reply, fetcher)
      }
      checked(await db.from('telegram_updates').update({ status: 'done' }).eq('update_id', update.update_id).eq('lease_id', lease))
      return res.status(200).json({ ok: true })
    } catch {
      if (lease) await db.from('telegram_updates').update({ locked_until: new Date().toISOString() }).eq('update_id', update.update_id).eq('lease_id', lease)
      return res.status(503).json({ error: 'Telegram command temporarily unavailable.' })
    }
  }
}

export function createDispatchHandler({ db, token, secret, fetcher = fetch }: any) {
  return async (req: Request, res: Response) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
    if (!db || !token || !secret) return res.status(503).json({ error: 'Telegram is not configured.' })
    if (!secretMatches(req.headers['x-telegram-dispatch-secret'], secret)) return res.status(401).json({ error: 'Unauthorized.' })
    try {
      const deliveries = checked(await db.rpc('claim_telegram_deliveries', { p_limit: 3 })) || []
      let sent = 0
      for (const row of deliveries) {
        const finish = async (patch: any) => checked(await db.from('telegram_outbox').update({ ...patch, locked_until: null }).eq('id', row.id).eq('lease_id', row.lease_id))
        try {
          const staff = await staffAccess(db, row.telegram_user_id)
          const permission = row.kind === 'order' ? 'orders.view' : 'songs.view'
          if (!staff || !staff.can(permission) || !(row.kind === 'order' ? staff.notify_orders : staff.notify_songs)) { await finish({ status: 'skipped' }); continue }
          const table = row.kind === 'order' ? 'orders' : 'song_requests'
          const entity = checked(await db.from(table).select(row.kind === 'order' ? '*,order_items(item_name,quantity,unit_price)' : '*').eq('id', row.entity_id).maybeSingle())
          if (!entity) { await finish({ status: 'skipped' }); continue }
          await sendTelegram(token, row.telegram_user_id, row.kind === 'order' ? orderText(entity) : songText(entity), fetcher)
          await finish({ status: 'sent', sent_at: new Date().toISOString(), last_error_code: null })
          sent++
        } catch (error) {
          const code = error instanceof TelegramError ? error.code : 'delivery_failed'
          const delay = error instanceof TelegramError ? error.retryAfter : Math.min(3600, 30 * 2 ** Math.min(row.attempts, 7))
          await finish({ status: row.attempts >= 20 || code === 'telegram_403' ? 'failed' : 'pending', last_error_code: code, next_attempt_at: new Date(Date.now() + delay * 1000).toISOString() })
        }
      }
      return res.status(200).json({ ok: true, sent })
    } catch { return res.status(503).json({ error: 'Telegram delivery temporarily unavailable.' }) }
  }
}
