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
async function telegramCall(token: string, method: string, body: any, fetcher = fetch) {
  let result: any
  try {
    const response = await fetcher(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    })
    result = await response.json()
    if (method === 'editMessageText' && result.error_code === 400 && typeof result.description === 'string' && result.description.startsWith('Bad Request: message is not modified')) return null
    if (!response.ok || !result.ok) throw new TelegramError(`telegram_${result.error_code || response.status}`, Math.min(86400, Math.max(5, Number(result.parameters?.retry_after) || 60)))
  } catch (error) {
    // Never propagate fetch URLs or Telegram descriptions: the URL contains the bot token.
    if (error instanceof TelegramError) throw error
    throw new TelegramError('telegram_network')
  }
  return result.result
}
export async function sendTelegram(token: string, chatId: string, text: string, fetcher = fetch, threadId?: number, replyMarkup?: any) {
  const result = await telegramCall(token, 'sendMessage', { chat_id: chatId, ...(threadId ? { message_thread_id: threadId } : {}), text: text.slice(0, 3800), link_preview_options: { is_disabled: true }, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }, fetcher)
  return result?.message_id
}
export function orderCompleted(order: any) { return order.status === 'served' }
export function orderButtons(deliveryId: string, order: any) {
  return { inline_keyboard: orderCompleted(order) || order.status === 'cancelled' ? [] : [[{ text: '✓ Mark as completed', callback_data: `done:${deliveryId}` }]] }
}
async function editOrderMessage(token: string, chatId: string, messageId: number, order: any, fetcher: any) {
  return telegramCall(token, 'editMessageText', { chat_id: chatId, message_id: messageId, text: orderText(order).slice(0, 3800), reply_markup: { inline_keyboard: [] }, link_preview_options: { is_disabled: true } }, fetcher)
}
export function malaysiaOrderTime(value: any, timeOnly = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(date)
  const part = (type: string) => parts.find(p => p.type === type)?.value || ''
  const time = `${Number(part('hour'))}:${part('minute')}${part('dayPeriod').toLowerCase()}`
  return timeOnly ? time : `${part('day')}/${part('month')}/${part('year')}, ${time}`
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
  return [`${orderCompleted(order) ? '✓ Completed' : 'New order'} · Table ${order.table_code}`, malaysiaOrderTime(order.created_at), '', ...items.map((i: any) => `${i.quantity} x ${i.item_name}`), ...(orderCompleted(order) ? ['', `by ${order.completed_by_name || 'Staff'}${order.completed_at ? ` · ${malaysiaOrderTime(order.completed_at, true)}` : ''}`] : [])].join('\n')
}
export function songText(song: any) {
  return [`New song · Table ${song.table_code}`, '', `${song.title}${song.artist ? ` - ${song.artist}` : ''}`, ...(song.dedication ? ['', `Remark: ${song.dedication}`] : [])].join('\n')
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
    const orders = checked(await db.from('orders').select('id,table_code,status,order_items(quantity,item_name)').in('status', ['new', 'preparing', 'ready']).order('created_at', { ascending: false }).limit(10)) || []
    return orders.length ? orders.map((o: any) => `Table ${o.table_code} · New\n${(o.order_items || []).map((i: any) => `${i.quantity} x ${i.item_name}`).join('\n')}`).join('\n\n') : 'No active orders.'
  }
  return 'Unknown command. Use /help.'
}

async function approvedTopic(db: any, filters: { id?: string; chatId?: string; threadId?: number }) {
  let query = db.from('telegram_topics').select('id,kind,chat_id,thread_id,approved_by,active').eq('active', true)
  query = filters.id ? query.eq('id', filters.id) : query.eq('chat_id', filters.chatId).eq('thread_id', filters.threadId)
  const topic = checked(await query.maybeSingle())
  if (!topic) return null
  const owner = checked(await db.from('staff_profiles').select('role,active').eq('user_id', topic.approved_by).maybeSingle())
  return owner?.active && owner.role === 'owner' ? topic : null
}

export function createWebhookHandler({ db, token, secret, fetcher = fetch, botUsername = 'dyrb_bot' }: any) {
  return async (req: Request, res: Response) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
    if (!db || !token || !secret) return res.status(503).json({ error: 'Telegram is not configured.' })
    if (!secretMatches(req.headers['x-telegram-bot-api-secret-token'], secret)) return res.status(401).json({ error: 'Unauthorized.' })
    let update: any
    try { update = parseBody(req.body) } catch { return res.status(400).json({ error: 'Invalid request.' }) }
    if (!Number.isSafeInteger(update.update_id) || update.update_id < 0) return res.status(400).json({ error: 'Invalid update.' })
    if (update.callback_query) {
      const callback = update.callback_query
      if (typeof callback.id !== 'string' || !Number.isSafeInteger(callback.from?.id) || callback.from.id <= 0 || callback.from.is_bot || !/^done:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callback.data || '')) return res.status(200).json({ ok: true })
      const message = callback.message
      if (!message || !Number.isSafeInteger(message.message_id) || !Number.isSafeInteger(message.chat?.id)) return res.status(200).json({ ok: true })
      const userId = String(callback.from.id)
      try {
        const staff = await staffAccess(db, userId)
        if (!staff?.can('orders.manage')) {
          await telegramCall(token, 'answerCallbackQuery', { callback_query_id: callback.id, text: 'Link your active staff account with order-management permission first.', show_alert: true }, fetcher)
          return res.status(200).json({ ok: true })
        }
        const original = checked(await db.from('telegram_outbox').select('id,kind,entity_id,topic_id,telegram_user_id,telegram_message_id,status').eq('id', callback.data.slice(5)).maybeSingle())
        let validDestination = false
        if (original?.topic_id && message.chat.type === 'supergroup') {
          const topic = await approvedTopic(db, { id: original.topic_id })
          validDestination = topic?.kind === 'order' && topic.chat_id === String(message.chat.id) && topic.thread_id === message.message_thread_id
        } else if (original && message.chat.type === 'private') {
          validDestination = original.telegram_user_id === userId && String(message.chat.id) === userId
        }
        if (!validDestination || original.kind !== 'order' || original.status !== 'sent' || Number(original.telegram_message_id) !== message.message_id) {
          await telegramCall(token, 'answerCallbackQuery', { callback_query_id: callback.id, text: 'This order button is no longer available.', show_alert: true }, fetcher)
          return res.status(200).json({ ok: true })
        }
        // The database repeats all identity/destination checks and locks the order for idempotent completion.
        const completed = checked(await db.rpc('complete_telegram_order', { p_delivery_id: original.id, p_telegram_user_id: userId, p_chat_id: String(message.chat.id), p_thread_id: message.chat.type === 'supergroup' ? message.message_thread_id : null, p_message_id: message.message_id }))
        const order = checked(await db.from('orders').select('*,order_items(item_name,quantity,unit_price)').eq('id', original.entity_id).maybeSingle())
        if (order && orderCompleted(order)) await editOrderMessage(token, String(message.chat.id), message.message_id, order, fetcher)
        await telegramCall(token, 'answerCallbackQuery', { callback_query_id: callback.id, text: completed.already_completed ? 'Already completed.' : 'Completed — entered into POS.' }, fetcher)
        return res.status(200).json({ ok: true })
      } catch {
        return res.status(503).json({ error: 'Order completion temporarily unavailable.' })
      }
    }
    const message = update.message
    if (!message || !Number.isSafeInteger(message.from?.id) || message.from.id <= 0 || message.from.is_bot || message.sender_chat || message.forward_origin || typeof message.text !== 'string') return res.status(200).json({ ok: true })
    const isPrivate = message.chat?.type === 'private' && message.chat.id === message.from.id
    const isTopic = message.chat?.type === 'supergroup' && Number.isSafeInteger(message.chat.id) && message.chat.id < 0 && message.is_topic_message === true && Number.isSafeInteger(message.message_thread_id) && message.message_thread_id > 0
    if (!isPrivate && !isTopic) return res.status(200).json({ ok: true })
    const rawCommand = message.text.trim().split(/\s+/)[0].toLowerCase()
    const [command, addressedBot] = rawCommand.split('@')
    if (isTopic && (!command.startsWith('/') || (addressedBot && addressedBot !== botUsername.toLowerCase()))) return res.status(200).json({ ok: true })
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
        if (isPrivate) {
          const reply = await commandReply(db, userId, message.text.slice(0, 512))
          await sendTelegram(token, userId, reply, fetcher)
        } else if (command === '/topicinfo' || command === '/whoami') {
          await sendTelegram(token, String(message.chat.id), `Your Telegram ID: ${userId}\nGroup ID: ${message.chat.id}\nTopic ID: ${message.message_thread_id}\nAsk the owner to register these IDs in Supabase. This command does not enable alerts.`, fetcher, message.message_thread_id)
        } else if (['/orders', '/songs', '/balance', '/help'].includes(command)) {
          const topic = await approvedTopic(db, { chatId: String(message.chat.id), threadId: message.message_thread_id })
          if (topic && (command === '/help' || command === ({ order: '/orders', song: '/songs', balance: '/balance' }[topic.kind]))) {
            const staff = await staffAccess(db, userId)
            if (staff) {
              if (topic.kind === 'balance') {
                // Balance data always goes to the requesting person, never to the shared group.
                try {
                  const reply = await commandReply(db, userId, command === '/help' ? '/help' : message.text.slice(0, 512))
                  await sendTelegram(token, userId, reply, fetcher)
                  await sendTelegram(token, String(message.chat.id), 'Reply sent to your private chat with the bot.', fetcher, topic.thread_id)
                } catch (error) {
                  if (!(error instanceof TelegramError) || error.code !== 'telegram_403') throw error
                  await sendTelegram(token, String(message.chat.id), 'Open the bot privately and press Start, then try again.', fetcher, topic.thread_id)
                }
              } else {
                const reply = await commandReply(db, userId, command === '/help' ? '/help' : message.text.slice(0, 512))
                await sendTelegram(token, String(message.chat.id), reply, fetcher, topic.thread_id)
              }
            }
          }
        }
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
          const isOrder = row.kind === 'order' || row.kind === 'order_completed'
          const permission = isOrder ? 'orders.view' : 'songs.view'
          let chatId = row.telegram_user_id, threadId: number | undefined
          if (row.topic_id) {
            const topic = await approvedTopic(db, { id: row.topic_id })
            if (!topic || topic.kind !== (isOrder ? 'order' : 'song')) { await finish({ status: 'skipped' }); continue }
            chatId = topic.chat_id; threadId = topic.thread_id
          } else {
            const staff = await staffAccess(db, row.telegram_user_id)
            if (!staff || !staff.can(permission) || (row.kind !== 'order_completed' && !(isOrder ? staff.notify_orders : staff.notify_songs))) { await finish({ status: 'skipped' }); continue }
          }
          const table = isOrder ? 'orders' : 'song_requests'
          const entity = checked(await db.from(table).select(isOrder ? '*,order_items(item_name,quantity,unit_price)' : '*').eq('id', row.entity_id).maybeSingle())
          if (!entity) { await finish({ status: 'skipped' }); continue }
          if (row.kind === 'order_completed') {
            let query = db.from('telegram_outbox').select('telegram_message_id').eq('kind', 'order').eq('entity_id', row.entity_id)
            query = row.topic_id ? query.eq('topic_id', row.topic_id) : query.eq('telegram_user_id', row.telegram_user_id)
            const original = checked(await query.maybeSingle())
            if (!original?.telegram_message_id || !orderCompleted(entity)) { await finish({ status: 'skipped' }); continue }
            await editOrderMessage(token, chatId, Number(original.telegram_message_id), entity, fetcher)
            await finish({ status: 'sent', sent_at: new Date().toISOString(), last_error_code: null })
          } else {
            const messageId = await sendTelegram(token, chatId, isOrder ? orderText(entity) : songText(entity), fetcher, threadId, isOrder ? orderButtons(row.id, entity) : undefined)
            await finish({ status: 'sent', sent_at: new Date().toISOString(), last_error_code: null, ...(isOrder ? { telegram_message_id: messageId } : {}) })
          }
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
