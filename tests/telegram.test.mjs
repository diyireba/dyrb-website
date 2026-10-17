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
    orders: [{ id: 'order-1', table_code: '08', status: 'new', order_items: [{ item_name: 'Chicken', quantity: 2, unit_price: '19.00' }] }],
    audit_log: [], telegram_updates: [], telegram_outbox: [],
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
      throw new Error('Unexpected RPC')
    },
  }
  return db
}
function telegram(status = 200, retryAfter = 60) {
  const messages = []
  return { messages, fetcher: async (_url, options) => { messages.push(JSON.parse(options.body)); return { ok: status === 200, status, json: async () => status === 200 ? { ok: true, result: { message_id: 1 } } : { ok: false, error_code: status, parameters: { retry_after: retryAfter } } } } }
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
  assert.match(await bot.commandReply(manager, '42', '/orders'), /RM 38.00/)
})
test('submission notifications fetch committed records and do not trust webhook payloads', async () => {
  const db = database(), tg = telegram(); enqueue(db)
  const result = await request(delivery(db, tg), { record: { table_code: 'FAKE', items: [] } }, { 'x-telegram-dispatch-secret': 'dispatch-secret' })
  assert.equal(result.status, 200)
  assert.equal(result.body.sent, 1)
  assert.match(tg.messages[0].text, /Table 08/)
  assert.match(tg.messages[0].text, /Total RM 38.00/)
  assert.match(tg.messages[0].text, /2 × Chicken/)
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
