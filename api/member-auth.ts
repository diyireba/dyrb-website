import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { normalizePhone, staffLoginId, validStaffLoginId, staffLoginEmail, memberLoginEmail } from '../server/login-identity.js'

type VercelRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: any }
type VercelResponse = { status(code: number): VercelResponse; json(body: Record<string, unknown>): void }

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!url || !anonKey || !serviceKey) return res.status(503).json({ error: 'Member sign-in is not configured.' })
  let body: any
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}) }
  catch { return res.status(400).json({ error: 'Invalid request. Please try again.' }) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Invalid request.' })
  const phone = normalizePhone(body.phone)
  if (body.accountType !== undefined && !['staff', 'member'].includes(body.accountType)) return res.status(400).json({ error: 'Invalid account type.' })
  const isStaff = body.accountType === 'staff'
  const loginId = staffLoginId(body.loginId)
  const pin = String(body.pin || '')
  if (!(isStaff ? validStaffLoginId(loginId) : /^\+[1-9]\d{7,14}$/.test(phone)) || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: isStaff ? 'Enter your user ID and 6-digit passcode.' : 'Enter your phone number and 6-digit PIN.' })

  const phoneHash = createHmac('sha256', serviceKey).update(isStaff ? `staff:${loginId}` : phone).digest('hex')
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: allowed, error: limitError } = await admin.rpc('member_login_allowed', { p_phone_hash: phoneHash })
  if (limitError) return res.status(503).json({ error: 'Member sign-in is temporarily unavailable.' })
  if (!allowed) return res.status(429).json({ error: 'Too many incorrect PIN attempts. Please wait 15 minutes or ask staff for help.' })

  const invalidCredentials = isStaff ? 'User ID or passcode is incorrect, or this staff account is inactive.' : 'Phone number or PIN is incorrect.'
  const { data, error } = await authClient.auth.signInWithPassword({ email: isStaff ? staffLoginEmail(loginId) : memberLoginEmail(phone), password: pin })
  if (error || !data.user || !data.session) {
    await admin.rpc('record_member_login_failure', { p_phone_hash: phoneHash })
    return res.status(401).json({ error: invalidCredentials })
  }
  if (isStaff) {
    const { data: staff, error: profileError } = await admin.from('staff_profiles').select('user_id,display_name,login_id,role,active').eq('user_id', data.user.id).maybeSingle()
    if (profileError || !staff?.active || staff.login_id !== loginId) {
      await authClient.auth.signOut()
      await admin.rpc('record_member_login_failure', { p_phone_hash: phoneHash })
      return res.status(401).json({ error: invalidCredentials })
    }
    await admin.rpc('clear_member_login_attempts', { p_phone_hash: phoneHash })
    return res.status(200).json({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token }, staff: { id: staff.user_id, name: staff.display_name, loginId: staff.login_id, role: staff.role } })
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
