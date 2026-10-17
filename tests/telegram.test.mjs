import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../server/telegram.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const bot = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

function database({ role = 'manager', permissions = ['songs.view', 'orders.view', 'members.lookup', 'members.adjust'], active = true, linked = true } = {}) {
  const tables = {
    telegram_staff: linked ? [{ telegram_user_id: '42', staff_id: 'staff-1', notify_songs: true, notify_orders: true }] : [],
    staff_profiles: [{ user_id: 'staff-1', role, active }],
    role_permissions: permissions.map(permission_key => ({ role, permission_key, enabled: true })),
    members: [{ id: 'member-1', display_name: 'Test Member', phone: '+60123456789', active: true }],
    member_balance_summary: [{ member_id: 'member-1', points: 125, beer_servings: 2 }],
    member_stored_batches: [
      { member_id: 'member-1', item_name: 'Stored Whisky', quantity_remaining: 1, expires_at: null },
      { member_id: 'member-1', item_name: 'Expired Beer', quantity_remaining: 4, expires_at: '2001-01-01T00:00:00Z' },
      { member_id: 'member-1', item_name: 'Fresh Beer', quantity_remaining: 3, expires_at: '2099-01-01T00:00:00Z' },
    ],
    song_requests: [{ id: 'song-1', title: 'My Song', artist: 'Artist', dedication: '<b>hello</b> https://example.com', table_code: '08', status: 'pending' }],
    orders: [{ id: 'order-1', table_code: '08', status: 'new', created_at: '2026-10-17T06:12:00Z', order_items: [{ item_name: 'Chicken', quantity: 2, unit_price: '19.00' }] }],
    audit_log: [], telegram_updates: [], telegram_outbox: [], telegram_topics: [],
  }
  const calls = []
  const db = {
    tables, calls,
    from(table) {
      calls.push(table)
      let filters = [], action, payload, single = false, countOnly = false, max = Infinity
      const q = {
        select(_fields, options) { countOnly = Boolean(options?.head); return q },
        eq(k, v) { filters.push(r => r[k] === v); return q },
        in(k, values) { filters.push(r => values.includes(r[k])); return q },
        gt(k, v) { filters.push(r => r[k] > v); return q },
        gte(k, v) { filters.push(r => r[k] >= v); return q },
        order() { return q }, limit(n) { max = n; return q },
        maybeSingle() { single = true; return q },
        insert(value) { action = 'insert'; payload = value; return q },
        update(value) { action = 'update'; payload = value; return q },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            if (db.failTable === table) return { data: null, error: { message: 'DB failure' } }
            const list = tables[table] || []
            if (action === 'insert') list.push(structuredClone(payload))
            const rows = list.filter(r => filters.every(f => f(r))).slice(0, max)
            if (action === 'update') rows.forEach(r => Object.assign(r, payload))
            return { data: countOnly ? null : structuredClone(single ? rows[0] || null : rows), count: rows.length, error: null }
          }).then(resolve, reject)
        },
      }
      return q
    },
    async rpc(name, args) {
      calls.push(name)
      if (name === 'claim_telegram_update') {
        const old = tables.telegram_updates.find(r => r.update_id === args.p_update_id)
        if (old) return { data: { state: old.status === 'done' ? 'done' : 'busy' } }
        const row = { update_id: args.p_update_id, telegram_user_id: args.p_user_id, lease_id: 'lease-1', status: 'processing', created_at: new Date().toISOString() }
        tables.telegram_updates.push(row)
        return { data: { state: 'claimed', lease_id: row.lease_id } }
      }
      if (name === 'claim_telegram_deliveries') {
        const rows = tables.telegram_outbox.filter(r => r.status === 'pending').slice(0, args.p_limit)
        rows.forEach(r => Object.assign(r, { status: 'processing', attempts: r.attempts + 1, lease_id: 'delivery-lease' }))
        return { data: structuredClone(rows) }
      }
      if (name === 'complete_telegram_order') {
        if (db.failCompletion) return { error: { message: 'database failure' } }
        const order = tables.orders[0]
        const already = order.status === 'served'
        if (!already) Object.assign(order, { status: 'served', completed_at: '2026-10-17T06:15:00Z', completed_by_name: 'Aden' })
        db.completionArgs = args
        return { data: { already_completed: already } }
      }
      throw new Error('Unexpected RPC')
    },
  }
  return db
}
function telegram(status = 200, retryAfter = 60) {
  const messages = [], methods = []
  return { messages, methods, fetcher: async (url, options) => {
    methods.push(url.split('/').at(-1)); messages.push(JSON.parse(options.body))
    return { ok: status === 200, status, json: async () => status === 200 ? { ok: true, result: { message_id: 1 } } : { ok: false, error_code: status, parameters: { retry_after: retryAfter } } }
  } }
}
function update(text = '/balance 0123456789', extra = {}) {
  return { update_id: 1, message: { from: { id: 42 }, chat: { id: 42, type: 'private' }, text, ...extra } }
}
async function request(handler, body, headers = { 'x-telegram-bot-api-secret-token': 'test-secret' }, method = 'POST') {
  const result = {}
  const res = { status(code) { result.status = code; return res }, json(body) { result.body = body } }
  await handler({ method, body, headers }, res)
  return result
}
function webhook(db, tg) { return bot.createWebhookHandler({ db, token: 'fake-private-token', secret: 'test-secret', fetcher: tg.fetcher }) }
function delivery(db, tg) { return bot.createDispatchHandler({ db, token: 'fake-private-token', secret: 'dispatch-secret', fetcher: tg.fetcher }) }
function enqueue(db, kind = 'order', attempts = 0) { db.tables.telegram_outbox.push({ id: 'delivery-1', kind, entity_id: `${kind}-1`, telegram_user_id: '42', attempts, status: 'pending' }) }

test('Telegram endpoints reject forged secrets and malformed requests without reading data', async () => {
  const db = database(), tg = telegram(), handler = webhook(db, tg)
  assert.equal((await request(handler, update(), {})).status, 401)
  assert.equal((await request(handler, update(), { 'x-telegram-bot-api-secret-token': ['test-secret'] })).status, 401)
  assert.equal((await request(handler, '{bad')).status, 400)
  assert.equal((await request(handler, null)).status, 400)
  assert.equal((await request(handler, update(), {}, 'GET')).status, 405)
  assert.equal((await request(delivery(db, tg), {}, {})).status, 401)
  assert.equal(db.calls.length, 0)
  assert.equal(tg.messages.length, 0)
})
test('private balance lookup checks permissions, excludes expired drinks, and records an audit', async () => {
  const db = database(), tg = telegram()
  assert.equal((await request(webhook(db, tg), update())).status, 200)
  const text = tg.messages[0].text
  assert.match(text, /Points: 125/)
  assert.match(text, /Stored Whisky: 1/)
  assert.match(text, /Fresh Beer: 3/)
  assert.match(text, /Legacy beer balance: 2/)
  assert.doesNotMatch(text, /Expired Beer/)
  assert.doesNotMatch(text, /0123456789/)
  assert.equal(db.tables.audit_log[0].actor_id, 'staff-1')
  assert.equal(db.tables.audit_log[0].entity_id, 'member-1')
})
test('groups, channels, bot senders, and mismatched identities never query member data', async () => {
  for (const extra of [{ chat: { id: -100, type: 'supergroup' } }, { chat: { id: 99, type: 'private' } }, { from: { id: 42, is_bot: true } }]) {
    const db = database(), tg = telegram()
    assert.equal((await request(webhook(db, tg), update('/balance 0123456789', extra))).status, 200)
    assert.equal(db.calls.length, 0)
    assert.equal(tg.messages.length, 0)
  }
})
test('unlinked, inactive, singer and ordinary staff accounts cannot read member balances', async () => {
  for (const options of [{ linked: false }, { active: false }, { role: 'singer', permissions: ['songs.view'] }, { role: 'staff', permissions: ['members.lookup'] }]) {
    const db = database(options), tg = telegram()
    await request(webhook(db, tg), update())
    assert.equal(db.calls.includes('members'), false)
    assert.doesNotMatch(tg.messages[0].text, /Test Member|125/)
  }
})
test('database authorization failure fails closed and never discloses balances', async () => {
  const db = database(), tg = telegram(); db.failTable = 'role_permissions'
  assert.equal((await request(webhook(db, tg), update())).status, 503)
  assert.equal(db.calls.includes('members'), false)
  assert.equal(tg.messages.length, 0)
})
test('duplicate Telegram updates send one response and active leases return retryable status', async () => {
  const db = database(), tg = telegram(), handler = webhook(db, tg)
  await request(handler, update('/whoami'))
  await request(handler, update('/whoami'))
  assert.equal(tg.messages.length, 1)
  db.tables.telegram_updates[0].status = 'processing'
  assert.equal((await request(handler, update('/whoami'))).status, 503)
  assert.equal(tg.messages.length, 1)
})
test('phone normalization rejects injected lookups and supports Malaysia forms', () => {
  assert.equal(bot.normalizeMemberPhone('012 345-6789'), '+60123456789')
  assert.equal(bot.normalizeMemberPhone('+60123456789'), '+60123456789')
  assert.equal(bot.normalizeMemberPhone("' or 1=1"), null)
})
test('song and order summaries follow role permissions', async () => {
  const db = database({ role: 'singer', permissions: ['songs.view'] })
  assert.match(await bot.commandReply(db, '42', '/songs'), /My Song/)
  assert.match(await bot.commandReply(db, '42', '/orders'), /cannot view orders/)
  const manager = database()
  assert.match(await bot.commandReply(manager, '42', '/orders'), /2 x Chicken/)
  assert.doesNotMatch(await bot.commandReply(manager, '42', '/orders'), /RM|Total/)
})
test('submission notifications fetch committed records and do not trust webhook payloads', async () => {
  const db = database(), tg = telegram(); enqueue(db)
  const result = await request(delivery(db, tg), { record: { table_code: 'FAKE', items: [] } }, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.equal(result.status, 200)
  assert.equal(result.body.sent, 1)
  assert.match(tg.messages[0].text, /Table 08/)
  assert.doesNotMatch(tg.messages[0].text, /RM|Total/)
  assert.match(tg.messages[0].text, /2 x Chicken/)
  assert.doesNotMatch(tg.messages[0].text, /FAKE/)
  assert.equal(db.tables.telegram_outbox[0].status, 'sent')
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.equal(tg.messages.length, 1)
})
test('permissions and notification preferences are rechecked before sending queued alerts', async () => {
  for (const options of [{ active: false }, { permissions: [] }, { linked: false }]) {
    const db = database(options), tg = telegram(); enqueue(db)
    await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
    assert.equal(tg.messages.length, 0)
    assert.equal(db.tables.telegram_outbox[0].status, 'skipped')
  }
  const db = database(), tg = telegram(); db.tables.telegram_staff[0].notify_songs = false; enqueue(db, 'song')
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.equal(tg.messages.length, 0)
})
test('Telegram 429 keeps delivery queued and respects retry-after without leaking secrets', async () => {
  const db = database(), tg = telegram(429, 120); enqueue(db)
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  const row = db.tables.telegram_outbox[0]
  assert.equal(row.status, 'pending')
  assert.equal(row.last_error_code, 'telegram_429')
  assert.ok(Date.parse(row.next_attempt_at) - Date.now() >= 119000)
  assert.equal(row.locked_until, null)
  assert.doesNotMatch(JSON.stringify(row), /fake-private-token/)
})
test('blocked bot and exhausted retries stop automatic delivery', async () => {
  for (const [status, attempts] of [[403, 0], [500, 19]]) {
    const db = database(), tg = telegram(status); enqueue(db, 'order', attempts)
    await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
    assert.equal(db.tables.telegram_outbox[0].status, 'failed')
  }
})
test('untrusted song text is sent as plain text with previews disabled', async () => {
  const db = database(), tg = telegram(); enqueue(db, 'song')
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.match(tg.messages[0].text, /<b>hello<\/b>/)
  assert.equal(tg.messages[0].parse_mode, undefined)
  assert.deepEqual(tg.messages[0].link_preview_options, { is_disabled: true })
})
test('network error messages never expose the Telegram token URL', async () => {
  await assert.rejects(bot.sendTelegram('super-secret', '42', 'hello', async () => { throw new Error('https://api.telegram.org/botsuper-secret/sendMessage') }), error => error.message === 'telegram_network')
})

function topic(db, kind = 'order', overrides = {}) {
  db.tables.staff_profiles.push({ user_id: 'owner-1', role: 'owner', active: true })
  const route = { id: 'topic-1', kind, chat_id: '-1001234567890', thread_id: 123, approved_by: 'owner-1', active: true, ...overrides }
  db.tables.telegram_topics.push(route)
  return route
}
function topicUpdate(text, extra = {}) {
  return update(text, { chat: { id: -1001234567890, type: 'supergroup' }, is_topic_message: true, message_thread_id: 123, ...extra })
}

test('topic discovery returns actual group/thread IDs without granting access or querying venue data', async () => {
  const db = database({ linked: false }), tg = telegram()
  assert.equal((await request(webhook(db, tg), topicUpdate('/topicinfo@dyrb_bot'))).status, 200)
  assert.equal(tg.messages[0].chat_id, '-1001234567890')
  assert.equal(tg.messages[0].message_thread_id, 123)
  assert.match(tg.messages[0].text, /Group ID: -1001234567890\nTopic ID: 123/)
  assert.equal(db.tables.telegram_topics.length, 0)
  assert.equal(db.calls.includes('staff_profiles'), false)
  assert.equal(db.calls.includes('members'), false)
})

test('order/song topic notifications preserve their thread and fetch genuine committed submissions', async () => {
  for (const kind of ['order', 'song']) {
    const db = database(), tg = telegram(); topic(db, kind)
    db.tables.telegram_outbox.push({ id: 'group-delivery', topic_id: 'topic-1', kind, entity_id: `${kind}-1`, attempts: 0, status: 'pending' })
    assert.equal((await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })).body.sent, 1)
    assert.equal(tg.messages[0].chat_id, '-1001234567890')
    assert.equal(tg.messages[0].message_thread_id, 123)
    assert.match(tg.messages[0].text, kind === 'order' ? /2 x Chicken/ : /My Song/)
    assert.equal(db.tables.telegram_outbox[0].status, 'sent')
  }
})

test('disabled, missing, mismatched or no-longer-owner-approved topics cannot receive queued data', async () => {
  for (const scenario of ['disabled', 'missing', 'mismatch', 'inactive-owner', 'demoted-owner', 'db-error']) {
    const db = database(), tg = telegram(); const route = topic(db)
    if (scenario === 'disabled') route.active = false
    if (scenario === 'missing') db.tables.telegram_topics.length = 0
    if (scenario === 'mismatch') route.kind = 'song'
    if (scenario === 'inactive-owner') db.tables.staff_profiles[1].active = false
    if (scenario === 'demoted-owner') db.tables.staff_profiles[1].role = 'staff'
    if (scenario === 'db-error') db.failTable = 'telegram_topics'
    db.tables.telegram_outbox.push({ id: 'group-delivery', topic_id: 'topic-1', kind: 'order', entity_id: 'order-1', attempts: 0, status: 'pending' })
    await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
    assert.equal(tg.messages.length, 0, scenario)
    assert.equal(db.calls.includes('orders'), false, scenario)
  }
})

test('balance topic sends authorized results only to the requester privately and audits lookup', async () => {
  const db = database(), tg = telegram(); topic(db, 'balance')
  assert.equal((await request(webhook(db, tg), topicUpdate('/balance@dyrb_bot 0123456789'))).status, 200)
  const privateMessage = tg.messages.find(message => message.chat_id === '42')
  const groupMessage = tg.messages.find(message => message.chat_id === '-1001234567890')
  assert.match(privateMessage.text, /Test Member\nPoints: 125/)
  assert.equal(privateMessage.message_thread_id, undefined)
  assert.doesNotMatch(groupMessage.text, /Test Member|125|0123456789|Whisky/)
  assert.equal(groupMessage.message_thread_id, 123)
  assert.equal(db.tables.audit_log.length, 1)
})

test('unapproved/wrong topics and unlinked or unauthorized staff never query balances', async () => {
  for (const scenario of ['unapproved', 'wrong-topic', 'wrong-group', 'unlinked', 'staff', 'inactive']) {
    const db = database(scenario === 'unlinked' ? { linked: false } : scenario === 'staff' ? { role: 'staff', permissions: ['members.lookup'] } : scenario === 'inactive' ? { active: false } : {}), tg = telegram()
    if (scenario !== 'unapproved') topic(db, scenario === 'wrong-topic' ? 'order' : 'balance')
    await request(webhook(db, tg), topicUpdate('/balance@dyrb_bot 0123456789', scenario === 'wrong-group' ? { chat: { id: -100999, type: 'supergroup' } } : {}))
    assert.equal(db.calls.includes('members'), false, scenario)
    for (const message of tg.messages) assert.doesNotMatch(message.text, /Test Member|Points: 125/)
  }
})

test('anonymous, forwarded and other-bot topic commands are ignored before reading data', async () => {
  for (const extra of [{ sender_chat: { id: -1001234567890 } }, { forward_origin: { type: 'user' } }, { from: { id: 42, is_bot: true } }]) {
    const db = database(), tg = telegram()
    await request(webhook(db, tg), topicUpdate('/topicinfo@dyrb_bot', extra))
    assert.equal(db.calls.length, 0)
    assert.equal(tg.messages.length, 0)
  }
  const db = database(), tg = telegram()
  await request(webhook(db, tg), topicUpdate('/topicinfo@another_bot'))
  assert.equal(db.calls.length, 0)
})

test('group topic delivery retries Telegram rate limits through the existing outbox', async () => {
  const db = database(), tg = telegram(429, 120); topic(db)
  db.tables.telegram_outbox.push({ id: 'group-delivery', topic_id: 'topic-1', kind: 'order', entity_id: 'order-1', attempts: 0, status: 'pending' })
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.equal(db.tables.telegram_outbox[0].status, 'pending')
  assert.equal(db.tables.telegram_outbox[0].last_error_code, 'telegram_429')
  assert.equal(tg.messages[0].message_thread_id, 123)
})

const deliveryId = '12345678-1234-1234-1234-123456789abc'
function orderCallback(extra = {}) {
  return { update_id: 50, callback_query: { id: 'callback-1', from: { id: 42 }, data: `done:${deliveryId}`, message: { message_id: 77, chat: { id: -1001234567890, type: 'supergroup' }, message_thread_id: 123 }, ...extra } }
}
function sentOrder(db) {
  topic(db)
  db.tables.telegram_outbox.push({ id: deliveryId, kind: 'order', entity_id: 'order-1', topic_id: 'topic-1', telegram_message_id: 77, status: 'sent' })
}

test('order alerts have numeric Malaysia date/time, quantities and one button without prices', async () => {
  const db = database(), tg = telegram(); enqueue(db)
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  const alert = tg.messages[0]
  assert.match(alert.text, /^New order · Table 08\n17\/10\/2026, 2:12pm/)
  assert.match(alert.text, /\n\n2 x Chicken$/)
  assert.doesNotMatch(alert.text, /RM|Total|38\.00/)
  assert.doesNotMatch(alert.text, /Pay at counter|order-1|payment/i)
  assert.deepEqual(alert.reply_markup.inline_keyboard, [[{ text: '✓ Mark as completed', callback_data: 'done:delivery-1' }]])
  assert.equal(db.tables.telegram_outbox[0].telegram_message_id, 1)
})

test('an authorized completion edits the shared message, removes its button and preserves first completion', async () => {
  const db = database({ permissions: ['orders.view', 'orders.manage'] }), tg = telegram(); sentOrder(db)
  assert.equal((await request(webhook(db, tg), orderCallback())).status, 200)
  assert.equal(db.tables.orders[0].status, 'served')
  assert.equal(db.completionArgs.p_telegram_user_id, '42')
  assert.equal(db.completionArgs.p_thread_id, 123)
  assert.equal(db.completionArgs.p_message_id, 77)
  assert.deepEqual(tg.methods, ['editMessageText', 'answerCallbackQuery'])
  assert.equal(tg.messages[0].message_id, 77)
  assert.match(tg.messages[0].text, /^✓ Completed · Table 08/)
  assert.match(tg.messages[0].text, /Completed by Aden/)
  assert.deepEqual(tg.messages[0].reply_markup.inline_keyboard, [])
  const first = db.tables.orders[0].completed_at
  await request(webhook(db, tg), orderCallback())
  assert.equal(db.tables.orders[0].completed_at, first)
  assert.equal(tg.messages.at(-1).text, 'Already completed.')
})

test('unlinked/inactive/unauthorized users and moved or forged buttons never complete orders', async () => {
  for (const scenario of ['unlinked', 'inactive', 'unauthorized', 'wrong-chat', 'wrong-thread', 'wrong-message', 'disabled-topic', 'invalid-data', 'wrong-secret']) {
    const db = database(scenario === 'unlinked' ? { linked: false } : scenario === 'inactive' ? { active: false } : { permissions: scenario === 'unauthorized' ? ['orders.view'] : ['orders.view', 'orders.manage'] }), tg = telegram(); sentOrder(db)
    const callback = orderCallback()
    if (scenario === 'wrong-chat') callback.callback_query.message.chat.id = -100999
    if (scenario === 'wrong-thread') callback.callback_query.message.message_thread_id = 999
    if (scenario === 'wrong-message') callback.callback_query.message.message_id = 999
    if (scenario === 'disabled-topic') db.tables.telegram_topics[0].active = false
    if (scenario === 'invalid-data') callback.callback_query.data = 'done:not-a-uuid'
    await request(webhook(db, tg), callback, scenario === 'wrong-secret' ? {} : undefined)
    assert.equal(db.calls.includes('complete_telegram_order'), false, scenario)
    assert.equal(db.tables.orders[0].status, 'new', scenario)
    assert.equal(tg.methods.includes('editMessageText'), false, scenario)
  }
})

test('completion database failure leaves the order and shared message unchanged', async () => {
  const db = database({ permissions: ['orders.manage'] }), tg = telegram(); sentOrder(db); db.failCompletion = true
  assert.equal((await request(webhook(db, tg), orderCallback())).status, 503)
  assert.equal(db.tables.orders[0].status, 'new')
  assert.equal(tg.methods.includes('editMessageText'), false)
})

test('queued completion from website edits the original alert instead of sending another notification', async () => {
  const db = database(), tg = telegram(); sentOrder(db)
  Object.assign(db.tables.orders[0], { status: 'served', completed_at: '2026-10-17T06:15:00Z', completed_by_name: 'Aden' })
  db.tables.telegram_outbox.push({ id: 'edit-1', kind: 'order_completed', entity_id: 'order-1', topic_id: 'topic-1', attempts: 0, status: 'pending' })
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.deepEqual(tg.methods, ['editMessageText'])
  assert.equal(tg.messages[0].message_id, 77)
  assert.match(tg.messages[0].text, /Completed by Aden/)
  assert.equal(db.tables.telegram_outbox[1].status, 'sent')
})

test('orders completed before notification delivery never show a completion button', async () => {
  const db = database(), tg = telegram(); enqueue(db); db.tables.orders[0].status = 'served'
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.match(tg.messages[0].text, /^✓ Completed/)
  assert.deepEqual(tg.messages[0].reply_markup.inline_keyboard, [])
})

test('a retry of an already applied shared-message edit succeeds without duplicate sends', async () => {
  const db = database(); sentOrder(db); db.tables.orders[0].status = 'served'
  db.tables.telegram_outbox.push({ id: 'edit-1', kind: 'order_completed', entity_id: 'order-1', topic_id: 'topic-1', attempts: 1, status: 'pending' })
  const tg = { fetcher: async (url) => {
    assert.ok(url.endsWith('/editMessageText'))
    return { ok: false, status: 400, json: async () => ({ ok: false, error_code: 400, description: 'Bad Request: message is not modified: specified content and reply markup are exactly the same' }) }
  } }
  await request(delivery(db, tg), {}, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.equal(db.tables.telegram_outbox[1].status, 'sent')
})
