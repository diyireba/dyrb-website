import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import ts from 'typescript'

const storage = new Map()
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
globalThis.window = new EventTarget()
const source = readFileSync(new URL('../src/data.js', import.meta.url), 'utf8')
  .replace("import { createClient } from '@supabase/supabase-js'", '')
  .replaceAll('import.meta.env', '({})')
const data = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('MYR prices preserve cents', () => {
  assert.match(data.formatMoney(15.8), /15\.80/)
  assert.match(data.formatMoney(33.6), /33\.60/)
})
test('every menu variant has a unique identifier', async () => {
  const menu = await data.getMenu()
  assert.equal(new Set(menu.map(item => item.id)).size, menu.length)
  const variants = menu.filter(item => item.name === 'Carlsberg Extra Cold · 1 mug')
  assert.equal(variants.length, 2)
  assert.notEqual(variants[0].id, variants[1].id)
  assert.deepEqual(variants.map(item => item.price).sort((a, b) => a - b), [15.8, 18.8])
})
test('demo staff user ID matching ignores case and whitespace', async () => {
  assert.equal((await data.login(' OWNER ', '111111', 'staff')).role, 'owner')
})
test('member accounts cannot enter staff sign-in', async () => {
  await assert.rejects(data.login('0128881001', '246810', 'staff'))
})

test('table management preserves exact QR codes, creates active tables and rejects duplicates', async () => {
  storage.clear()
  const table = await data.createTable({ code: ' 01 ', label: 'Front table', sort_order: '1' })
  assert.equal(table.code, '01')
  assert.equal(table.active, true)
  assert.equal(table.sort_order, 1)
  assert.equal((await data.getOperations('owner')).tables.find(row => row.id === table.id).label, 'Front table')
  await assert.rejects(data.createTable({ code: '01' }), /already exists/)
  // A leading zero is meaningful: never silently change an existing printed QR's code.
  const eight = await data.createTable({ code: '8' })
  assert.equal(eight.code, '8')
  assert.ok((await data.getOperations('owner')).tables.some(row => row.code === '08'))
})

test('table activation and label edits persist without changing QR identity or existing orders', async () => {
  storage.clear()
  const before = await data.getOperations('owner')
  const original = before.tables.find(row => row.code === '08')
  await data.updateTable(original.id, { active: false })
  await data.updateTable(original.id, { label: 'Garden table', sort_order: 25 })
  let row = (await data.getOperations('owner')).tables.find(row => row.id === original.id)
  assert.equal(row.active, false)
  assert.equal(row.code, '08')
  assert.equal(row.label, 'Garden table')
  await data.updateTable(original.id, { active: true })
  const after = await data.getOperations('owner')
  row = after.tables.find(row => row.id === original.id)
  assert.equal(row.active, true)
  assert.deepEqual(after.orders, before.orders)
})

test('invalid table edits fail without mutating stored rows', async () => {
  storage.clear()
  const original = (await data.getOperations('owner')).tables
  for (const update of [{ code: '99' }, { active: 'false' }, { sort_order: -1 }, { sort_order: 1.5 }, { label: 'x'.repeat(81) }]) await assert.rejects(data.updateTable('08', update))
  for (const code of ['', '../08', 'table 08', 'x'.repeat(17)]) await assert.rejects(data.createTable({ code }))
  await assert.rejects(data.updateTable('missing', { active: true }), /not found/)
  assert.deepEqual((await data.getOperations('owner')).tables, original)
})
test('negative points adjustment is rejected without changing balance', async () => {
  storage.clear()
  const member = (await data.getOperations('owner')).members[0]
  await assert.rejects(data.adjustMember(member, 'points', -1000, 'Test redemption'), /negative/)
  assert.equal((await data.getOperations('owner')).members[0].points, member.points)
})
test('stored drink collection cannot exceed available quantity', async () => {
  const member = (await data.getOperations('owner')).members[0]
  await assert.rejects(data.adjustMember(member, 'stored', -100, 'Test collection', { itemType: 'draught', itemName: 'Carlsberg Extra Cold' }), /available/)
})
test('formatted duplicate member phone is rejected', async () => {
  await assert.rejects(data.adminAction('enroll-member', { name: 'Test', phone: '+60 128881001', pin: '123456' }), /already enrolled/)
})
test('all service requests are disabled', async () => {
  for (const type of ['Request water', 'Request the bill', 'Call staff']) {
    await assert.rejects(data.submitService('08', type), /no longer available/)
  }
})

process.env.SUPABASE_URL = 'https://test.example.com'
process.env.SUPABASE_ANON_KEY = 'test-anon'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service'
globalThis.__testClient = () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'actor' } } }) },
  from(table) {
    const query = {
      select() { return query }, eq() { return query },
      async maybeSingle() { return { data: { role: 'manager', active: true } } },
      then(resolve) { return Promise.resolve({ data: table === 'role_permissions' ? [{ permission_key: 'staff.manage' }] : [] }).then(resolve) },
    }
    return query
  },
})
async function loadHandler(file) {
  const source = readFileSync(new URL(`../api/${file}.ts`, import.meta.url), 'utf8')
    .replace("import { createClient } from '@supabase/supabase-js'", 'const createClient = globalThis.__testClient')
    .replace("'../server/login-identity.js'", JSON.stringify(new URL('../server/login-identity.js', import.meta.url).href))
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return (await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)).default
}
const admin = await loadHandler('admin')
const memberAuth = await loadHandler('member-auth')
async function request(handler, body) {
  const result = {}
  const response = { status(code) { result.status = code; return response }, json(value) { result.body = value } }
  await handler({ method: 'POST', headers: { authorization: 'Bearer test' }, body }, response)
  return result
}
test('API endpoints reject malformed JSON and null bodies', async () => {
  for (const handler of [admin, memberAuth]) {
    assert.equal((await request(handler, '{broken')).status, 400)
    assert.equal((await request(handler, 'null')).status, 400)
  }
})
test('staff account status requires a boolean', async () => {
  assert.equal((await request(admin, { action: 'toggle-staff', id: 'target', active: 'false' })).status, 400)
})

test('event menu replaces food, preserves confirmed drinks, and restores regular menu', async () => {
  storage.clear()
  const regular = await data.getMenu()
  const settings = (await data.getOperations('owner')).menuEvent
  await data.saveMenuEvent({ ...settings, enabled: true })
  const event = await data.getMenu()
  assert.equal(event.filter(x => x.category === 'mains').length, 5)
  assert.equal(event.filter(x => x.category === 'bites').length, 8)
  assert.equal(event.filter(x => ['mains','bites'].includes(x.category)).every(x => x.eventId === 'halloween'), true)
  assert.equal(event.some(x => ['soft','cocktails'].includes(x.category)), false)
  for (const category of ['draught','bottle','spirits','mocktails']) assert.deepEqual(event.filter(x => x.category === category), regular.filter(x => x.category === category))
  await assert.rejects(data.submitOrder('08', [{ item: regular.find(x => x.category === 'mains'), qty: 1 }]), /menu has changed/)
  await data.saveMenuEvent({ ...settings, enabled: false })
  assert.deepEqual(await data.getMenu(), regular)
  await assert.rejects(data.submitOrder('08', [{ item: event.find(x => x.eventId), qty: 1 }]), /menu has changed/)
})

test('event boundaries use exact timestamps and reject reversed dates', async () => {
  const event = { enabled: true, starts_at: '2026-10-30T18:00:00+08:00', ends_at: '2026-11-01T02:00:00+08:00' }
  assert.equal(data.eventIsActive(event, Date.parse(event.starts_at) - 1), false)
  assert.equal(data.eventIsActive(event, Date.parse(event.starts_at)), true)
  assert.equal(data.eventIsActive(event, Date.parse(event.ends_at)), false)
  await assert.rejects(data.saveMenuEvent({ ...event, ends_at: event.starts_at }), /End time/)
})


test('event name can be reused, reaches guests, and rejects blank or oversized names', async () => {
  storage.clear()
  const settings = (await data.getOperations('owner')).menuEvent
  await data.saveMenuEvent({ ...settings, name: '  Christmas Eve  ', enabled: true })
  assert.equal((await data.getOperations('owner')).menuEvent.name, 'Christmas Eve')
  const eventItems = (await data.getMenu()).filter(item => item.eventId)
  assert.equal(eventItems.length, 13)
  assert.ok(eventItems.every(item => item.eventName === 'Christmas Eve'))
  assert.ok(eventItems.filter(item => item.category === 'mains').every(item => item.image))
  await assert.rejects(data.saveMenuEvent({ ...settings, name: '   ' }), /event name/)
  await assert.rejects(data.saveMenuEvent({ ...settings, name: 'X'.repeat(81) }), /event name/)
  await data.saveMenuEvent(settings)
})


test('every event dish has a real local photo and database catalogs receive updated defaults', () => {
  assert.equal(data.eventFood.length, 13)
  for (const item of data.eventFood) {
    assert.ok(item.image, item.name)
    assert.ok(existsSync(new URL('../public' + item.image, import.meta.url)), item.image)
    assert.equal(data.menuPhoto({ category: item.category, name_en: item.name, event_id: 'halloween', image_url: '' }), item.image)
    assert.equal(data.menuPhoto({ category: item.category, name_en: item.name, event_id: 'halloween', image_url: 'https://example.com/custom.jpg' }), 'https://example.com/custom.jpg')
  }
  assert.equal(data.menuPhoto({ name_en: 'Signature Black Pepper Chicken Chop', image_url: '/images/food-f05.jpg' }), '/images/event-black-pepper.webp')
})


test('every beverage variant has a local photo, shared variants match, and custom uploads survive', async () => {
  storage.clear()
  const menu = (await data.getOperations('owner')).menu.filter(item => !['mains', 'bites'].includes(item.category))
  assert.equal(Object.keys(data.beveragePhotos).length, 40)
  for (const item of menu) {
    assert.ok(item.image, item.name)
    assert.ok(existsSync(new URL('../public' + item.image, import.meta.url)), item.image)
    assert.equal(data.menuPhoto({category:item.category, name_en:item.name, image_url:null}), item.image)
    assert.equal(data.menuPhoto({category:item.category, name_en:item.name, image_url:'https://example.com/upload.webp'}), 'https://example.com/upload.webp')
  }
  const beer = menu.filter(item => item.name.startsWith('Carlsberg Extra Cold'))
  assert.equal(new Set(beer.map(item => item.image)).size, 1)
  assert.notEqual(data.beveragePhoto('draught', 'Carlsberg Extra Cold'), data.beveragePhoto('draught', 'Connor’s'))
})


test('older saved draught entries receive photos without changing prices', async () => {
  storage.clear()
  storage.set('malam-demo-v2', JSON.stringify({menu:[{id:'legacy-beer',category:'draught',name:'Carlsberg Extra Cold · Happy Hour · 1 mug',description:'Before 8pm',price:15.8,available:true,image:''}]}))
  const beer=(await data.getMenu()).find(item=>item.id==='legacy-beer')
  assert.equal(beer.image, '/images/drink-draught-carlsberg-extra-cold.webp')
  assert.equal(beer.price,15.8)
  storage.clear()
})


test('removed Call staff requests are rejected without creating a service record', async () => {
  storage.clear()
  const before = (await data.getOperations('owner')).services
  await assert.rejects(data.submitService('08', 'Call staff'), /no longer available/)
  assert.deepEqual((await data.getOperations('owner')).services, before)
})
