import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { normalizePhone, memberLoginEmail, staffLoginEmail } from '../server/login-identity.js'

process.env.SUPABASE_URL = 'https://test.example.com'
process.env.SUPABASE_ANON_KEY = 'anon'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'private'
let state
globalThis.__loginClient = () => ({
  auth: {
    async signInWithPassword(credentials) {
      state.credentials = credentials
      return state.wrong ? { data: {}, error: {} } : { data: { user: { id: 'user' }, session: { access_token: 'access', refresh_token: 'refresh' } } }
    },
    async signOut() { state.signedOut = true },
  },
  async rpc(name) { state.rpcs.push(name); return { data: name === 'member_login_allowed' ? !state.locked : true } },
  from(table) {
    state.table = table
    const query = { select() { return query }, eq() { return query }, async maybeSingle() { return { data: state.profile, error: state.profileError } } }
    return query
  },
})
const source = readFileSync(new URL('../api/member-auth.ts', import.meta.url), 'utf8')
  .replace("import { createClient } from '@supabase/supabase-js'", 'const createClient = globalThis.__loginClient')
  .replace("'../server/login-identity.js'", JSON.stringify(new URL('../server/login-identity.js', import.meta.url).href))
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const handler = (await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)).default
async function request(body, options = {}) {
  state = { rpcs: [], profile: { user_id: 'user', id: 'user', display_name: 'Test', login_id: 'aden', phone: '+60123456789', role: 'owner', active: true }, ...options }
  const result = {}
  const res = { status(code) { result.status = code; return res }, json(body) { result.body = body } }
  await handler({ method: 'POST', headers: {}, body }, res)
  return result
}

test('staff IDs authenticate without phone/SMS and return only an active matching staff profile', async () => {
  const response = await request({ accountType: 'staff', loginId: ' ADEN ', pin: '123456' })
  assert.equal(response.status, 200)
  assert.deepEqual(state.credentials, { email: staffLoginEmail('aden'), password: '123456' })
  assert.equal(state.table, 'staff_profiles')
  assert.equal(response.body.staff.loginId, 'aden')
  assert.deepEqual(response.body.session, { access_token: 'access', refresh_token: 'refresh' })
})

test('members keep normalized phone login but authenticate through a separate internal identity', async () => {
  const response = await request({ phone: '012 3456789', pin: '123456' })
  assert.equal(response.status, 200)
  assert.deepEqual(state.credentials, { email: memberLoginEmail(normalizePhone('0123456789')), password: '123456' })
  assert.equal(state.table, 'members')
  assert.equal(response.body.member.phone, '+60123456789')
  assert.equal(response.body.staff, undefined)
  assert.notEqual(memberLoginEmail('+60123456789'), staffLoginEmail('aden'))
})

test('inactive, mismatched, missing and inaccessible staff profiles never receive sessions', async () => {
  for (const options of [{ profile: null }, { profile: { active: false, login_id: 'aden' } }, { profile: { active: true, login_id: 'other' } }, { profileError: {} }]) {
    const response = await request({ accountType: 'staff', loginId: 'aden', pin: '123456' }, options)
    assert.equal(response.status, 401)
    assert.equal(response.body.session, undefined)
    assert.equal(state.signedOut, true)
    assert.ok(state.rpcs.includes('record_member_login_failure'))
  }
})

test('credential failures are generic and both login types honor the server attempt limit', async () => {
  for (const body of [{ accountType: 'staff', loginId: 'aden', pin: '123456' }, { phone: '0123456789', pin: '123456' }]) {
    assert.equal((await request(body, { wrong: true })).status, 401)
    assert.ok(state.rpcs.includes('record_member_login_failure'))
    assert.equal((await request(body, { locked: true })).status, 429)
    assert.equal(state.credentials, undefined)
  }
})

test('invalid user IDs, unknown account types and malformed credentials do not reach authentication', async () => {
  for (const body of [{ accountType: 'staff', loginId: '0123456789', pin: '123456' }, { accountType: 'staff', loginId: 'aden@other.com', pin: '123456' }, { accountType: 'owner', pin: '123456' }, { phone: '0123456789', pin: 'bad' }]) {
    assert.equal((await request(body)).status, 400)
    assert.equal(state.credentials, undefined)
  }
})
