import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

type VercelRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: any }
type VercelResponse = { status(code: number): VercelResponse; json(body: Record<string, unknown>): void }

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function normalizePhone(raw: unknown) {
  const value = String(raw || '').trim().replace(/[\s()-]/g, '')
  if (value.startsWith('+')) return value
  if (value.startsWith('60')) return `+${value}`
  if (value.startsWith('0')) return `+60${value.slice(1)}`
  return `+60${value}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!url || !anonKey || !serviceKey) return res.status(503).json({ error: 'Member sign-in is not configured.' })
  let body: any
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}) }
  catch { return res.status(400).json({ error: 'Invalid request. Please try again.' }) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Invalid request.' })
  const phone = normalizePhone(body.phone)
  const pin = String(body.pin || '')
  if (!/^\+?[1-9]\d{7,14}$/.test(phone) || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: 'Enter your phone number and 6-digit PIN.' })

  const phoneHash = createHmac('sha256', serviceKey).update(phone).digest('hex')
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: allowed, error: limitError } = await admin.rpc('member_login_allowed', { p_phone_hash: phoneHash })
  if (limitError) return res.status(503).json({ error: 'Member sign-in is temporarily unavailable.' })
  if (!allowed) return res.status(429).json({ error: 'Too many incorrect PIN attempts. Please wait 15 minutes or ask staff for help.' })

  const { data, error } = await authClient.auth.signInWithPassword({ phone, password: pin })
  if (error || !data.user || !data.session) {
    await admin.rpc('record_member_login_failure', { p_phone_hash: phoneHash })
    return res.status(401).json({ error: 'Phone number or PIN is incorrect.' })
  }
  const { data: member } = await admin.from('members').select('id,display_name,phone,active').eq('id', data.user.id).maybeSingle()
  if (!member?.active) {
    await authClient.auth.signOut()
    await admin.rpc('record_member_login_failure', { p_phone_hash: phoneHash })
    return res.status(401).json({ error: 'Phone number or PIN is incorrect.' })
  }
  await admin.rpc('clear_member_login_attempts', { p_phone_hash: phoneHash })
  return res.status(200).json({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token }, member: { id: member.id, name: member.display_name, phone: member.phone } })
}
