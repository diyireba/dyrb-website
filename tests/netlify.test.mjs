import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../server/netlify-adapter.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { adaptApiHandler } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

test('Netlify adapter preserves JSON, authorization and webhook secret headers', async () => {
  const body = JSON.stringify({ action: 'enroll-member', phone: '0123456789' })
  const handler = adaptApiHandler(async (req, res) => {
    assert.equal(req.method, 'POST')
    assert.equal(req.headers.authorization, 'Bearer staff-token')
    assert.equal(req.headers['x-telegram-bot-api-secret-token'], 'telegram-secret')
    assert.equal(req.body, body)
    res.status(201).json({ ok: true })
  })
  const response = await handler(new Request('https://example.netlify.app/api/admin', { method: 'POST', headers: { Authorization: 'Bearer staff-token', 'X-Telegram-Bot-Api-Secret-Token': 'telegram-secret' }, body }))
  assert.equal(response.status, 201)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match(response.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await response.json(), { ok: true })
})
test('Netlify adapter leaves malformed JSON for existing endpoint validation', async () => {
  const handler = adaptApiHandler(async (req, res) => {
    assert.equal(req.body, '{bad')
    res.status(400).json({ error: 'Invalid request.' })
  })
  assert.equal((await handler(new Request('https://example.test/api/member-auth', { method: 'POST', body: '{bad' }))).status, 400)
})
test('Netlify adapter rejects oversized requests before invoking sensitive endpoints', async () => {
  let called = false
  const response = await adaptApiHandler(() => { called = true })(new Request('https://example.test/api/admin', { method: 'POST', body: 'x'.repeat(128 * 1024 + 1) }))
  assert.equal(response.status, 413)
  assert.equal(called, false)
})
test('Netlify adapter supports method rejection and hides internal exception details', async () => {
  const methodHandler = adaptApiHandler(async (req, res) => { assert.equal(req.body, undefined); res.status(405).json({ error: 'Method not allowed.' }) })
  assert.equal((await methodHandler(new Request('https://example.test/api/admin'))).status, 405)
  const response = await adaptApiHandler(() => { throw new Error('PRIVATE_SECRET') })(new Request('https://example.test/api/telegram'))
  assert.equal(response.status, 500)
  assert.doesNotMatch(await response.text(), /PRIVATE_SECRET/)
})
test('Netlify routes API calls before SPA pages and provides every backend entry point', () => {
  const config = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8')
  assert.ok(config.indexOf('from = "/api/*"') < config.indexOf('from = "/*"'))
  for (const name of ['admin', 'member-auth', 'telegram', 'telegram-events']) {
    const wrapper = readFileSync(new URL(`../netlify/functions/${name}.mts`, import.meta.url), 'utf8')
    assert.ok(wrapper.includes(`../../api/${name}.js`))
  }
})
